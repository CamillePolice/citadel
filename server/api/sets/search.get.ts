import { or, ilike, asc } from 'drizzle-orm'
import { db } from '../../db'
import { catalogSets } from '../../db/schema'

export default defineEventHandler(async (event) => {
  requireUser(event)
  const q = getQuery(event).q as string | undefined

  if (!q || q.length < 2) return []

  return db
    .select()
    .from(catalogSets)
    .where(or(ilike(catalogSets.setNo, `%${q}%`), ilike(catalogSets.name, `%${q}%`)))
    .orderBy(asc(catalogSets.setNo))
    .limit(10)
})
