import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../../db'
import { storageSpaces } from '../../db/schema'

const schema = z.object({
  name: z.string().min(1).max(100).optional(),
  type: z.enum(['shelf', 'drawer', 'box', 'room']).optional(),
  rows: z.number().int().min(1).max(50).nullable().optional(),
  cols: z.number().int().min(1).max(50).nullable().optional(),
  description: z.string().max(500).nullable().optional(),
})

export default defineEventHandler(async (event) => {
  const user = requireUser(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Missing id' })

  const parsed = schema.safeParse(await readBody(event))
  if (!parsed.success) throw createError({ statusCode: 400, statusMessage: 'Invalid body' })

  const updates: Record<string, unknown> = {}
  const b = parsed.data
  if (b.name !== undefined) updates.name = b.name
  if (b.type !== undefined) updates.type = b.type
  if (b.rows !== undefined) updates.rows = b.rows
  if (b.cols !== undefined) updates.cols = b.cols
  if (b.description !== undefined) updates.description = b.description

  const [updated] = await db
    .update(storageSpaces)
    .set(updates)
    .where(and(eq(storageSpaces.id, id), eq(storageSpaces.userId, user.id)))
    .returning()

  if (!updated) throw createError({ statusCode: 404, statusMessage: 'Not found' })
  return updated
})
