import { and, desc, eq, sql } from 'drizzle-orm'
import { db } from '../../../db'
import { priceListings } from '../../../db/schema'
import { normalizeSetNo } from '../../../utils/pricing'

export default defineEventHandler(async (event) => {
  requireUser(event)
  const rawSetNo = getRouterParam(event, 'setNo')
  if (!rawSetNo) throw createError({ statusCode: 400, statusMessage: 'Missing setNo' })

  const setNo = normalizeSetNo(rawSetNo)
  const q = getQuery(event)

  const page = Math.max(1, Number.parseInt(String(q.page ?? '1'), 10) || 1)
  const pageSize = Math.min(100, Math.max(1, Number.parseInt(String(q.pageSize ?? '25'), 10) || 25))
  const offset = (page - 1) * pageSize

  const filters = [eq(priceListings.setNo, setNo)]
  if (q.source === 'bricklink' || q.source === 'ebay') {
    filters.push(eq(priceListings.source, q.source))
  }
  if (q.condition === 'new' || q.condition === 'used') {
    filters.push(eq(priceListings.condition, q.condition))
  }
  const where = and(...filters)

  const countResult = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(priceListings)
    .where(where)
  const count = countResult[0]?.count ?? 0

  const rows = await db
    .select()
    .from(priceListings)
    .where(where)
    .orderBy(desc(priceListings.saleDate), desc(priceListings.capturedAt))
    .limit(pageSize)
    .offset(offset)

  return {
    total: count,
    page,
    pageSize,
    items: rows.map((r) => ({
      id: r.id,
      condition: r.condition,
      source: r.source,
      price: Number(r.price),
      currency: r.currency,
      saleDate: r.saleDate,
      listingUrl: r.listingUrl,
      title: r.title,
    })),
  }
})
