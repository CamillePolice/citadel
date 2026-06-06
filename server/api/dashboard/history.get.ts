import { asc, eq } from 'drizzle-orm'
import { db } from '../../db'
import { portfolioSnapshots } from '../../db/schema'

export default defineEventHandler(async (event) => {
  const user = requireUser(event)

  const rows = await db
    .select({
      capturedAt: portfolioSnapshots.capturedAt,
      totalValue: portfolioSnapshots.totalValue,
      totalCost: portfolioSnapshots.totalCost,
    })
    .from(portfolioSnapshots)
    .where(eq(portfolioSnapshots.userId, user.id))
    .orderBy(asc(portfolioSnapshots.capturedAt))

  return rows.map((r) => ({
    date: r.capturedAt,
    totalValue: Number(r.totalValue ?? 0),
    totalCost: Number(r.totalCost ?? 0),
  }))
})
