import { describe, it, expect } from 'vitest'
import { formatCurrency, formatPct, formatDate, pnlClass } from '~/utils/format'

describe('formatCurrency', () => {
  it('returns — for null', () => {
    expect(formatCurrency(null)).toBe('—')
  })

  it('returns — for undefined', () => {
    expect(formatCurrency(undefined)).toBe('—')
  })

  it('returns — for NaN', () => {
    expect(formatCurrency(NaN)).toBe('—')
  })

  it('formats zero as currency string', () => {
    const result = formatCurrency(0)
    expect(result).not.toBe('—')
    expect(result).toContain('0')
  })

  it('formats positive number as currency string', () => {
    const result = formatCurrency(100)
    expect(result).not.toBe('—')
    expect(result).toMatch(/100/)
  })

  it('formats negative number as currency string', () => {
    const result = formatCurrency(-50)
    expect(result).not.toBe('—')
    expect(result).toContain('50')
  })
})

describe('formatPct', () => {
  it('returns — for null', () => {
    expect(formatPct(null)).toBe('—')
  })

  it('returns — for undefined', () => {
    expect(formatPct(undefined)).toBe('—')
  })

  it('returns — for NaN', () => {
    expect(formatPct(NaN)).toBe('—')
  })

  it('formats 0 as percent string', () => {
    const result = formatPct(0)
    expect(result).not.toBe('—')
    expect(result).toMatch(/0/)
  })

  it('formats positive ratio as percent string', () => {
    const result = formatPct(50)
    expect(result).not.toBe('—')
    expect(result).toMatch(/50/)
  })
})

describe('formatDate', () => {
  it('returns — for null', () => {
    expect(formatDate(null)).toBe('—')
  })

  it('returns — for undefined', () => {
    expect(formatDate(undefined)).toBe('—')
  })

  it('returns — for empty string', () => {
    expect(formatDate('')).toBe('—')
  })

  it('returns — for invalid date string', () => {
    expect(formatDate('not-a-date')).toBe('—')
  })

  it('formats ISO date as dd/mm/yyyy', () => {
    expect(formatDate('2024-03-15')).toBe('15/03/2024')
  })

  it('formats ISO datetime', () => {
    expect(formatDate('2024-01-01T00:00:00.000Z')).toMatch(/01\/01\/2024/)
  })
})

describe('pnlClass', () => {
  it('returns muted class for null', () => {
    expect(pnlClass(null)).toBe('text-imperial-muted')
  })

  it('returns muted class for undefined', () => {
    expect(pnlClass(undefined)).toBe('text-imperial-muted')
  })

  it('returns muted class for zero', () => {
    expect(pnlClass(0)).toBe('text-imperial-muted')
  })

  it('returns gain class for positive value', () => {
    expect(pnlClass(100)).toBe('text-gain')
  })

  it('returns loss class for negative value', () => {
    expect(pnlClass(-1)).toBe('text-loss')
  })
})
