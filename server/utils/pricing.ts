import { and, desc, eq } from 'drizzle-orm'
import { db } from '../db'
import { priceSnapshots } from '../db/schema'

export function normalizeSetNo(raw: string): string {
  const s = raw.trim()
  return s.includes('-') ? s : `${s}-1`
}

export function itemToPriceCondition(condition: 'new_sealed' | 'used' | null): 'new' | 'used' | null {
  if (condition === 'new_sealed') return 'new'
  if (condition === 'used') return 'used'
  return null
}

export interface LatestPrice {
  avgPrice: number
  source: 'bricklink' | 'brickowl'
}

export async function latestPriceFor(
  setNo: string,
  itemCondition: 'new_sealed' | 'used' | null,
): Promise<LatestPrice | null> {
  const priceCondition = itemToPriceCondition(itemCondition)
  if (!priceCondition) return null

  for (const source of ['bricklink', 'brickowl'] as const) {
    const [row] = await db
      .select({ avgPrice: priceSnapshots.avgPrice })
      .from(priceSnapshots)
      .where(
        and(
          eq(priceSnapshots.setNo, setNo),
          eq(priceSnapshots.condition, priceCondition),
          eq(priceSnapshots.source, source),
          eq(priceSnapshots.guideType, 'sold'),
        ),
      )
      .orderBy(desc(priceSnapshots.capturedAt))
      .limit(1)

    if (row && row.avgPrice != null) {
      return { avgPrice: Number(row.avgPrice), source }
    }
  }
  return null
}
