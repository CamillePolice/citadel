import { and, eq } from 'drizzle-orm'
import { db } from '../../db'
import { storageSpaces, userItems, catalogSets } from '../../db/schema'

export default defineEventHandler(async (event) => {
  const user = requireUser(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Missing id' })

  const [space] = await db
    .select()
    .from(storageSpaces)
    .where(and(eq(storageSpaces.id, id), eq(storageSpaces.userId, user.id)))
    .limit(1)

  if (!space) throw createError({ statusCode: 404, statusMessage: 'Not found' })

  const items = await db
    .select({
      id: userItems.id,
      setNo: userItems.setNo,
      storageRow: userItems.storageRow,
      storageCol: userItems.storageCol,
      condition: userItems.condition,
      name: catalogSets.name,
      imageUrl: catalogSets.imageUrl,
    })
    .from(userItems)
    .leftJoin(catalogSets, eq(catalogSets.setNo, userItems.setNo))
    .where(and(eq(userItems.storageSpaceId, id), eq(userItems.userId, user.id)))

  return { ...space, items }
})
