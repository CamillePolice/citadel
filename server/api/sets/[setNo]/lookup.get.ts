import { eq } from 'drizzle-orm'
import { db } from '../../../db'
import { catalogSets } from '../../../db/schema'
import { normalizeSetNo } from '../../../utils/pricing'
import { ensureCatalogSet } from '../../../utils/catalog'

export default defineEventHandler(async (event) => {
  requireUser(event)
  const rawSetNo = getRouterParam(event, 'setNo')
  if (!rawSetNo) throw createError({ statusCode: 400, statusMessage: 'Missing setNo' })

  const setNo = normalizeSetNo(rawSetNo)

  const [found] = await db.select().from(catalogSets).where(eq(catalogSets.setNo, setNo)).limit(1)
  if (found) return found

  await ensureCatalogSet(setNo)

  const [created] = await db.select().from(catalogSets).where(eq(catalogSets.setNo, setNo)).limit(1)
  if (created && created.name) return created

  throw createError({ statusCode: 404, statusMessage: 'Set not found' })
})
