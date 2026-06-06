import { eq } from 'drizzle-orm'
import { db } from '../../db'
import { catalogSets, userItems } from '../../db/schema'
import { latestPriceFor } from '../../utils/pricing'

export default defineEventHandler(async (event) => {
  const user = requireUser(event)

  const rows = await db
    .select({
      id: userItems.id,
      setNo: userItems.setNo,
      condition: userItems.condition,
      quantity: userItems.quantity,
      purchasePrice: userItems.purchasePrice,
      name: catalogSets.name,
      theme: catalogSets.theme,
      pieceCount: catalogSets.pieceCount,
    })
    .from(userItems)
    .leftJoin(catalogSets, eq(userItems.setNo, catalogSets.setNo))
    .where(eq(userItems.userId, user.id))

  let totalValue = 0
  let totalCost = 0
  let numPieces = 0
  const numItems = rows.length

  const themeMap = new Map<string, { value: number; count: number }>()
  const condMap = new Map<string, { value: number; count: number }>()
  const perItem: { id: string; setNo: string; name: string | null; pnl: number; pnlPct: number }[] = []

  for (const r of rows) {
    const qty = r.quantity ?? 1
    const cost = Number(r.purchasePrice ?? 0) * qty
    const price = await latestPriceFor(r.setNo, r.condition)
    const value = price ? price.avgPrice * qty : 0
    const pnl = price ? value - cost : 0
    const pnlPct = price && cost > 0 ? pnl / cost : 0

    totalValue += value
    totalCost += cost
    numPieces += (r.pieceCount ?? 0) * qty

    const themeKey = r.theme ?? 'Unknown'
    const t = themeMap.get(themeKey) ?? { value: 0, count: 0 }
    t.value += value
    t.count += 1
    themeMap.set(themeKey, t)

    const condKey = r.condition ?? 'unknown'
    const c = condMap.get(condKey) ?? { value: 0, count: 0 }
    c.value += value
    c.count += 1
    condMap.set(condKey, c)

    perItem.push({ id: r.id, setNo: r.setNo, name: r.name, pnl, pnlPct })
  }

  const pnl = totalValue - totalCost
  const roi = totalCost > 0 ? pnl / totalCost : 0
  const avgValuePerItem = numItems > 0 ? totalValue / numItems : 0

  const byTheme = [...themeMap.entries()]
    .map(([theme, v]) => ({ theme, value: v.value, count: v.count }))
    .sort((a, b) => b.value - a.value)

  const byCondition = [...condMap.entries()].map(([condition, v]) => ({
    condition,
    value: v.value,
    count: v.count,
  }))

  const sortedByPnlPct = [...perItem].sort((a, b) => a.pnlPct - b.pnlPct)
  const flops = sortedByPnlPct.slice(0, 5)
  const topPerformers = [...sortedByPnlPct].reverse().slice(0, 5)

  return {
    totalValue,
    totalCost,
    pnl,
    roi,
    numItems,
    numPieces,
    avgValuePerItem,
    byTheme,
    byCondition,
    topPerformers,
    flops,
  }
})
