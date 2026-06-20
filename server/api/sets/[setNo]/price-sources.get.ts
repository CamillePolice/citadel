import { sql } from 'drizzle-orm'
import { db } from '../../../db'
import { normalizeSetNo } from '../../../utils/pricing'

export default defineEventHandler(async (event) => {
  requireUser(event)
  const rawSetNo = getRouterParam(event, 'setNo')
  if (!rawSetNo) throw createError({ statusCode: 400, statusMessage: 'Missing setNo' })

  const setNo = normalizeSetNo(rawSetNo)

  const rows = await db.execute(sql`
    SELECT DISTINCT ON (source, condition, guide_type)
      source, condition, guide_type, avg_price, min_price, max_price, unit_quantity, source_url, captured_at
    FROM price_snapshots
    WHERE set_no = ${setNo}
    ORDER BY source, condition, guide_type, captured_at DESC
  `)

  return (rows as Array<Record<string, unknown>>).map((r) => ({
    source: r.source,
    condition: r.condition,
    guideType: r.guide_type,
    avgPrice: r.avg_price != null ? Number(r.avg_price) : null,
    minPrice: r.min_price != null ? Number(r.min_price) : null,
    maxPrice: r.max_price != null ? Number(r.max_price) : null,
    unitQuantity: r.unit_quantity,
    sourceUrl: r.source_url ?? null,
    capturedAt: r.captured_at,
  }))
})
