import { and, eq, sql } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../../db'
import { userItems } from '../../db/schema'
import { latestPriceFor, applyConditionDecote } from '../../utils/pricing'

const patchSchema = z.object({
  condition: z.enum(['new_sealed', 'used']).optional(),
  quantity: z.number().int().positive().optional(),
  completeness: z.enum(['complete', 'incomplete', 'na']).optional(),
  hasBox: z.boolean().optional(),
  hasInstructions: z.boolean().optional(),
  hasMinifigs: z.boolean().optional(),
  purchasePrice: z.number().nonnegative().optional(),
  purchaseDate: z.string().optional(),
  storageLocation: z.string().optional(),
  notes: z.string().optional(),
})

export default defineEventHandler(async (event) => {
  const user = requireUser(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Missing id' })

  const parsed = patchSchema.safeParse(await readBody(event))
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid body', data: parsed.error.issues })
  }
  const body = parsed.data

  const [existing] = await db.select({ userId: userItems.userId }).from(userItems).where(eq(userItems.id, id)).limit(1)

  if (!existing) throw createError({ statusCode: 404, statusMessage: 'Item not found' })
  if (existing.userId !== user.id) throw createError({ statusCode: 403, statusMessage: 'Forbidden' })

  const updates: Record<string, unknown> = { updatedAt: sql`now()` }
  if (body.condition !== undefined) updates.condition = body.condition
  if (body.quantity !== undefined) updates.quantity = body.quantity
  if (body.completeness !== undefined) updates.completeness = body.completeness
  if (body.hasBox !== undefined) updates.hasBox = body.hasBox
  if (body.hasInstructions !== undefined) updates.hasInstructions = body.hasInstructions
  if (body.hasMinifigs !== undefined) updates.hasMinifigs = body.hasMinifigs
  if (body.purchasePrice !== undefined) updates.purchasePrice = String(body.purchasePrice)
  if (body.purchaseDate !== undefined) updates.purchaseDate = body.purchaseDate
  if (body.storageLocation !== undefined) updates.storageLocation = body.storageLocation
  if (body.notes !== undefined) updates.notes = body.notes

  const [updated] = await db
    .update(userItems)
    .set(updates)
    .where(and(eq(userItems.id, id), eq(userItems.userId, user.id)))
    .returning()

  if (!updated) throw createError({ statusCode: 404, statusMessage: 'Item not found' })

  const price = await latestPriceFor(updated.setNo, updated.condition)
  const purchasePriceNum = updated.purchasePrice != null ? Number(updated.purchasePrice) : null
  const qty = updated.quantity ?? 1
  const basePrice = price ? applyConditionDecote(price.avgPrice, updated) : 0
  const currentValue = basePrice * qty
  const cost = (purchasePriceNum ?? 0) * qty
  const pnl = basePrice ? currentValue - cost : 0
  const pnlPct = basePrice && cost > 0 ? (pnl / cost) * 100 : 0

  return {
    ...updated,
    purchasePrice: purchasePriceNum,
    currentValue,
    cost,
    pnl,
    pnlPct,
    priceSource: price?.source ?? null,
    degraded: !price,
  }
})
