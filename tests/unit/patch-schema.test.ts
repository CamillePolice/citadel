import { describe, it, expect } from 'vitest'
import { patchItemSchema } from '../../server/utils/schemas'

describe('patchItemSchema', () => {
  it('accepts empty object (all fields optional)', () => {
    expect(patchItemSchema.safeParse({}).success).toBe(true)
  })

  it('accepts valid full payload', () => {
    const result = patchItemSchema.safeParse({
      condition: 'new_sealed',
      quantity: 2,
      completeness: 'complete',
      hasBox: true,
      hasInstructions: false,
      hasMinifigs: true,
      purchasePrice: 99.99,
      purchaseDate: '2024-01-01',
      storageLocation: 'Cave',
      notes: 'Good condition',
    })
    expect(result.success).toBe(true)
  })

  it('accepts null purchasePrice', () => {
    expect(patchItemSchema.safeParse({ purchasePrice: null }).success).toBe(true)
  })

  it('rejects string purchasePrice', () => {
    expect(patchItemSchema.safeParse({ purchasePrice: '99.99' }).success).toBe(false)
  })

  it('rejects negative purchasePrice', () => {
    expect(patchItemSchema.safeParse({ purchasePrice: -1 }).success).toBe(false)
  })

  it('rejects zero quantity', () => {
    expect(patchItemSchema.safeParse({ quantity: 0 }).success).toBe(false)
  })

  it('rejects negative quantity', () => {
    expect(patchItemSchema.safeParse({ quantity: -1 }).success).toBe(false)
  })

  it('rejects float quantity', () => {
    expect(patchItemSchema.safeParse({ quantity: 1.5 }).success).toBe(false)
  })

  it('rejects invalid condition', () => {
    expect(patchItemSchema.safeParse({ condition: 'broken' }).success).toBe(false)
  })

  it('rejects invalid completeness', () => {
    expect(patchItemSchema.safeParse({ completeness: 'yes' }).success).toBe(false)
  })

  it('accepts null purchaseDate', () => {
    expect(patchItemSchema.safeParse({ purchaseDate: null }).success).toBe(true)
  })

  it('accepts null notes', () => {
    expect(patchItemSchema.safeParse({ notes: null }).success).toBe(true)
  })

  it('accepts hasBox=false', () => {
    expect(patchItemSchema.safeParse({ hasBox: false }).success).toBe(true)
  })

  it('accepts hasMinifigs=true with other fields', () => {
    const result = patchItemSchema.safeParse({
      hasMinifigs: true,
      condition: 'used',
      quantity: 1,
    })
    expect(result.success).toBe(true)
  })
})
