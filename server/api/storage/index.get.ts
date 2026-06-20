import { and, count, eq } from 'drizzle-orm'
import { db } from '../../db'
import { storageSpaces, userItems } from '../../db/schema'

export default defineEventHandler(async (event) => {
  const user = requireUser(event)

  const rows = await db
    .select({
      id: storageSpaces.id,
      name: storageSpaces.name,
      type: storageSpaces.type,
      rows: storageSpaces.rows,
      cols: storageSpaces.cols,
      description: storageSpaces.description,
      createdAt: storageSpaces.createdAt,
      itemCount: count(userItems.id),
    })
    .from(storageSpaces)
    .leftJoin(userItems, and(eq(userItems.storageSpaceId, storageSpaces.id), eq(userItems.userId, user.id)))
    .where(eq(storageSpaces.userId, user.id))
    .groupBy(storageSpaces.id)
    .orderBy(storageSpaces.createdAt)

  return rows
})
