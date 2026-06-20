import { z } from 'zod'
import { db } from '../../db'
import { storageSpaces } from '../../db/schema'

const schema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(['shelf', 'drawer', 'box', 'room']),
  rows: z.number().int().min(1).max(50).nullable().optional(),
  cols: z.number().int().min(1).max(50).nullable().optional(),
  description: z.string().max(500).nullable().optional(),
})

export default defineEventHandler(async (event) => {
  const user = requireUser(event)
  const parsed = schema.safeParse(await readBody(event))
  if (!parsed.success) throw createError({ statusCode: 400, statusMessage: 'Invalid body' })

  const { name, type, rows, cols, description } = parsed.data
  const [space] = await db
    .insert(storageSpaces)
    .values({ userId: user.id, name, type, rows: rows ?? null, cols: cols ?? null, description: description ?? null })
    .returning()

  return space
})
