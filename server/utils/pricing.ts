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

export function applyConditionDecote(
  price: number,
  opts: {
    condition: string | null
    completeness: string | null
    hasBox: boolean | null
    hasInstructions: boolean | null
  },
): number {
  if (opts.condition !== 'used') return price
  let factor = 1
  if (opts.completeness === 'incomplete') factor *= 0.85
  if (opts.hasBox === false) factor *= 0.9
  if (opts.hasInstructions === false) factor *= 0.95
  return Math.round(price * factor * 100) / 100
}

export interface LatestPrice {
  avgPrice: number
  source: 'bricklink' | 'brickowl' | 'avenuedelabrique'
}

type SourceSpec = { source: 'bricklink' | 'brickowl' | 'avenuedelabrique'; guideType: 'sold' | 'stock' | 'listing' }

export async function latestPriceFor(
  setNo: string,
  itemCondition: 'new_sealed' | 'used' | null,
): Promise<LatestPrice | null> {
  const priceCondition = itemToPriceCondition(itemCondition)
  if (!priceCondition) return null

  const sourcePriority: SourceSpec[] =
    itemCondition === 'new_sealed'
      ? [
          { source: 'avenuedelabrique', guideType: 'listing' },
          { source: 'bricklink', guideType: 'sold' },
          { source: 'brickowl', guideType: 'sold' },
        ]
      : [
          { source: 'bricklink', guideType: 'sold' },
          { source: 'brickowl', guideType: 'sold' },
        ]

  for (const { source, guideType } of sourcePriority) {
    const [row] = await db
      .select({ avgPrice: priceSnapshots.avgPrice })
      .from(priceSnapshots)
      .where(
        and(
          eq(priceSnapshots.setNo, setNo),
          eq(priceSnapshots.condition, priceCondition),
          eq(priceSnapshots.source, source),
          eq(priceSnapshots.guideType, guideType),
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
