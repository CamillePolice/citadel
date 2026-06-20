import { describe, it, expect } from 'vitest'
import { normalizeSetNo, itemToPriceCondition, applyConditionDecote } from '../../server/utils/pricing'

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

describe('applyConditionDecote', () => {
  it('used + incomplete + no box + no instructions → cumulative decote', () => {
    const result = applyConditionDecote(100, {
      condition: 'used',
      completeness: 'incomplete',
      hasBox: false,
      hasInstructions: false,
    })
    expect(result).toBe(Math.round(100 * 0.85 * 0.9 * 0.95 * 100) / 100)
  })

  it('used + complete + has box + has instructions → unchanged', () => {
    expect(
      applyConditionDecote(100, {
        condition: 'used',
        completeness: 'complete',
        hasBox: true,
        hasInstructions: true,
      }),
    ).toBe(100)
  })

  it('new_sealed → no decote regardless of flags', () => {
    expect(
      applyConditionDecote(100, {
        condition: 'new_sealed',
        completeness: 'incomplete',
        hasBox: false,
        hasInstructions: false,
      }),
    ).toBe(100)
  })

  it('used + null completeness → no completeness decote', () => {
    expect(
      applyConditionDecote(100, {
        condition: 'used',
        completeness: null,
        hasBox: true,
        hasInstructions: true,
      }),
    ).toBe(100)
  })

  it('used + no box only → -10%', () => {
    expect(
      applyConditionDecote(100, {
        condition: 'used',
        completeness: null,
        hasBox: false,
        hasInstructions: null,
      }),
    ).toBe(90)
  })

  it('used + no instructions only → -5%', () => {
    expect(
      applyConditionDecote(100, {
        condition: 'used',
        completeness: null,
        hasBox: null,
        hasInstructions: false,
      }),
    ).toBe(95)
  })

  it('null condition → no decote', () => {
    expect(
      applyConditionDecote(100, {
        condition: null,
        completeness: 'incomplete',
        hasBox: false,
        hasInstructions: false,
      }),
    ).toBe(100)
  })
})
