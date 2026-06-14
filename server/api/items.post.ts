import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../db'
import { catalogSets, userItems } from '../db/schema'
import { normalizeSetNo, latestPriceFor } from '../utils/pricing'
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

  const inserted = await db
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

  const created = inserted[0]
  if (!created) {
    throw createError({ statusCode: 500, statusMessage: 'Insert returned no row' })
  }

  const [catalog] = await db
    .select({ name: catalogSets.name, theme: catalogSets.theme, imageUrl: catalogSets.imageUrl })
    .from(catalogSets)
    .where(eq(catalogSets.setNo, setNo))
    .limit(1)

  const price = await latestPriceFor(setNo, created.condition)
  const purchasePriceNum = created.purchasePrice != null ? Number(created.purchasePrice) : null
  const qty = created.quantity ?? 1
  const currentValue = price ? price.avgPrice * qty : 0
  const cost = (purchasePriceNum ?? 0) * qty
  const pnl = price ? currentValue - cost : 0
  const pnlPct = price && cost > 0 ? (pnl / cost) * 100 : 0

  setResponseStatus(event, 201)
  return {
    id: created.id,
    setNo: created.setNo,
    name: catalog?.name ?? null,
    theme: catalog?.theme ?? null,
    imageUrl: catalog?.imageUrl ?? null,
    condition: created.condition,
    quantity: qty,
    completeness: created.completeness,
    purchasePrice: purchasePriceNum,
    purchaseDate: created.purchaseDate,
    storageLocation: created.storageLocation,
    notes: created.notes,
    currentValue,
    pnl,
    pnlPct,
    priceSource: price?.source ?? null,
    degraded: !price,
  }
})
