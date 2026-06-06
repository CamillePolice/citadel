import { asc, eq } from 'drizzle-orm'
import { db } from '../../../db'
import { priceSnapshots } from '../../../db/schema'
import { normalizeSetNo } from '../../../utils/pricing'

export default defineEventHandler(async (event) => {
  requireUser(event)
  const rawSetNo = getRouterParam(event, 'setNo')
  if (!rawSetNo) throw createError({ statusCode: 400, statusMessage: 'Missing setNo' })

  const setNo = normalizeSetNo(rawSetNo)

  const rows = await db
    .select()
    .from(priceSnapshots)
    .where(eq(priceSnapshots.setNo, setNo))
    .orderBy(asc(priceSnapshots.capturedAt))

  return rows.map((r) => ({
    capturedAt: r.capturedAt,
    condition: r.condition,
    source: r.source,
    guideType: r.guideType,
    avgPrice: r.avgPrice != null ? Number(r.avgPrice) : null,
    minPrice: r.minPrice != null ? Number(r.minPrice) : null,
    maxPrice: r.maxPrice != null ? Number(r.maxPrice) : null,
  }))
})
