import { desc, eq } from 'drizzle-orm'
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
    .orderBy(desc(priceSnapshots.capturedAt))

  const groups: Record<string, typeof rows> = {}
  for (const row of rows) {
    const key = `${row.source}:${row.condition}`
    if (!groups[key]) groups[key] = []
    groups[key].push(row)
  }

  return Object.entries(groups).map(([key, snapshots]) => {
    const [source, condition] = key.split(':')
    return { source, condition, snapshots }
  })
})
