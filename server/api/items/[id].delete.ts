import { and, eq } from 'drizzle-orm'
import { db } from '../../db'
import { userItems } from '../../db/schema'

export default defineEventHandler(async (event) => {
  const user = requireUser(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Missing id' })

  const [existing] = await db.select({ userId: userItems.userId }).from(userItems).where(eq(userItems.id, id)).limit(1)

  if (!existing) throw createError({ statusCode: 404, statusMessage: 'Item not found' })
  if (existing.userId !== user.id) throw createError({ statusCode: 403, statusMessage: 'Forbidden' })

  await db.delete(userItems).where(and(eq(userItems.id, id), eq(userItems.userId, user.id)))

  setResponseStatus(event, 204)
  return null
})
