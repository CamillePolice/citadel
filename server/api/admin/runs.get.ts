import { desc } from 'drizzle-orm'
import { db } from '../../db'
import { workerRuns } from '../../db/schema'

export default defineEventHandler(async (event) => {
  const user = requireUser(event)
  if (!user.isAdmin) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  const runs = await db.select().from(workerRuns).orderBy(desc(workerRuns.startedAt)).limit(20)
  return runs
})
