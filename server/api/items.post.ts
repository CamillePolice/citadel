import { z } from 'zod'
import { db } from '../db'
import { userItems } from '../db/schema'
import { normalizeSetNo } from '../utils/pricing'
import { ensureCatalogSet } from '../utils/catalog'

const bodySchema = z.object({
  setNo: z.string().min(1),
  condition: z.enum(['new_sealed', 'used']),
  quantity: z.number().int().positive().default(1),
  completeness: z.enum(['complete', 'incomplete', 'na']).optional(),
  hasBox: z.boolean().optional(),
  hasInstructions: z.boolean().optional(),
  hasMinifigs: z.boolean().optional(),
  purchasePrice: z.number().nonnegative().nullish(),
  purchaseDate: z.string().nullish(),
  storageLocation: z.string().nullish(),
  notes: z.string().nullish(),
})

export default defineEventHandler(async (event) => {
  const user = requireUser(event)
  const raw = await readBody(event)

  const parsed = bodySchema.safeParse(raw)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid body', data: parsed.error.issues })
  }
  const body = parsed.data
  const setNo = normalizeSetNo(body.setNo)

  await ensureCatalogSet(setNo)

  const [created] = await db
    .insert(userItems)
    .values({
      userId: user.id,
      setNo,
      condition: body.condition,
      quantity: body.quantity,
      completeness: body.completeness,
      hasBox: body.hasBox,
      hasInstructions: body.hasInstructions,
      hasMinifigs: body.hasMinifigs,
      purchasePrice: body.purchasePrice != null ? String(body.purchasePrice) : null,
      purchaseDate: body.purchaseDate || null,
      storageLocation: body.storageLocation,
      notes: body.notes,
    })
    .returning()

  setResponseStatus(event, 201)
  return created
})
