import { describe, it, expect } from 'vitest'
import { normalizeSetNo, itemToPriceCondition } from '../../server/utils/pricing'

describe('normalizeSetNo', () => {
  it('adds -1 suffix when missing', () => {
    expect(normalizeSetNo('75281')).toBe('75281-1')
  })

  it('keeps existing suffix intact', () => {
    expect(normalizeSetNo('75281-1')).toBe('75281-1')
  })

  it('keeps non-standard suffixes intact', () => {
    expect(normalizeSetNo('75281-2')).toBe('75281-2')
  })

  it('trims whitespace before normalizing', () => {
    expect(normalizeSetNo('  75281  ')).toBe('75281-1')
  })

  it('trims whitespace and keeps existing suffix', () => {
    expect(normalizeSetNo('  75281-1  ')).toBe('75281-1')
  })
})

describe('itemToPriceCondition', () => {
  it('maps new_sealed to new', () => {
    expect(itemToPriceCondition('new_sealed')).toBe('new')
  })

  it('maps used to used', () => {
    expect(itemToPriceCondition('used')).toBe('used')
  })

  it('maps null to null', () => {
    expect(itemToPriceCondition(null)).toBeNull()
  })
})
