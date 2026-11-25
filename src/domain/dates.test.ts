import { describe, expect, it } from 'vitest'
import { addDays, addMonths, isoWeekday, monthGrid, toLocalDate } from './dates'

describe('dates', () => {
  it('formats local dates without UTC shifting', () => {
    expect(toLocalDate(new Date(2026, 0, 1, 0, 5))).toBe('2026-01-01')
    expect(toLocalDate(new Date(2026, 11, 31, 23, 59))).toBe('2026-12-31')
  })

  it('adds days across month, year and leap boundaries', () => {
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01')
    expect(addDays('2027-01-01', -1)).toBe('2026-12-31')
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29')
  })

  it('returns ISO weekdays', () => {
    expect(isoWeekday('2026-11-23')).toBe(1) // Monday
    expect(isoWeekday('2026-11-29')).toBe(7) // Sunday
  })

  it('wraps months', () => {
    expect(addMonths({ year: 2026, month: 0 }, -1)).toEqual({ year: 2025, month: 11 })
    expect(addMonths({ year: 2026, month: 11 }, 1)).toEqual({ year: 2027, month: 0 })
  })

  it('builds a Monday-first month grid padded to whole weeks', () => {
    const grid = monthGrid({ year: 2026, month: 10 }) // Nov 2026 starts on a Sunday
    expect(grid.length % 7).toBe(0)
    expect(grid.slice(0, 6)).toEqual(Array(6).fill(null))
    expect(grid[6]).toBe('2026-11-01')
    expect(grid.filter(Boolean)).toHaveLength(30)
  })
})
