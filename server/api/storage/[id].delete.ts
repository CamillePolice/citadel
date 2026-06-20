import { and, count, eq } from 'drizzle-orm'
import { db } from '../../db'
import { storageSpaces, userItems } from '../../db/schema'

export default defineEventHandler(async (event) => {
  const user = requireUser(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Missing id' })

  const [{ n }] = await db
    .select({ n: count(userItems.id) })
    .from(userItems)
    .where(and(eq(userItems.storageSpaceId, id), eq(userItems.userId, user.id)))

  if (n > 0) throw createError({ statusCode: 409, statusMessage: 'Space has items — unassign them first' })

  const [deleted] = await db
    .delete(storageSpaces)
    .where(and(eq(storageSpaces.id, id), eq(storageSpaces.userId, user.id)))
    .returning({ id: storageSpaces.id })

  if (!deleted) throw createError({ statusCode: 404, statusMessage: 'Not found' })
  return { ok: true }
})
