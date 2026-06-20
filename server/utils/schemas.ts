import { z } from 'zod'

export const patchItemSchema = z.object({
  condition: z.enum(['new_sealed', 'used']).optional(),
  quantity: z.number().int().positive().optional(),
  completeness: z.enum(['complete', 'incomplete', 'na']).optional(),
  hasBox: z.boolean().optional(),
  hasInstructions: z.boolean().optional(),
  hasMinifigs: z.boolean().optional(),
  purchasePrice: z.number().nonnegative().nullish(),
  purchaseDate: z.string().nullable().optional(),
  storageLocation: z.string().nullable().optional(),
  storageSpaceId: z.string().uuid().nullable().optional(),
  storageRow: z.number().int().nonnegative().nullable().optional(),
  storageCol: z.number().int().nonnegative().nullable().optional(),
  notes: z.string().nullable().optional(),
})
