import { eq } from 'drizzle-orm'
import { db } from '../db'
import { catalogSets, userItems } from '../db/schema'
import { latestPriceFor } from '../utils/pricing'

export default defineEventHandler(async (event) => {
  const user = requireUser(event)

  const rows = await db
    .select({
      id: userItems.id,
      setNo: userItems.setNo,
      condition: userItems.condition,
      quantity: userItems.quantity,
      completeness: userItems.completeness,
      hasBox: userItems.hasBox,
      hasInstructions: userItems.hasInstructions,
      hasMinifigs: userItems.hasMinifigs,
      purchasePrice: userItems.purchasePrice,
      purchaseDate: userItems.purchaseDate,
      storageLocation: userItems.storageLocation,
      notes: userItems.notes,
      createdAt: userItems.createdAt,
      updatedAt: userItems.updatedAt,
      name: catalogSets.name,
      theme: catalogSets.theme,
      year: catalogSets.year,
      pieceCount: catalogSets.pieceCount,
      imageUrl: catalogSets.imageUrl,
    })
    .from(userItems)
    .leftJoin(catalogSets, eq(userItems.setNo, catalogSets.setNo))
    .where(eq(userItems.userId, user.id))

  return Promise.all(
    rows.map(async (r) => {
      const qty = r.quantity ?? 1
      const cost = Number(r.purchasePrice ?? 0) * qty
      const price = await latestPriceFor(r.setNo, r.condition)

      const currentValue = price ? price.avgPrice * qty : 0
      const pnl = price ? currentValue - cost : 0
      const pnlPct = price && cost > 0 ? pnl / cost : 0

      return {
        ...r,
        currentValue,
        cost,
        pnl,
        pnlPct,
        priceSource: price ? price.source : null,
        degraded: !price,
      }
    }),
  )
})
