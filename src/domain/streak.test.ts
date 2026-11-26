import { describe, expect, it } from 'vitest'
import { computeStreak, longestStreak, monthlyWorkoutCount } from './streak'

const today = '2026-11-24'

describe('computeStreak', () => {
  it('is zero with no workouts', () => {
    expect(computeStreak([], today)).toEqual({ length: 0, status: 'none' })
  })

  it('counts consecutive days ending today', () => {
    expect(computeStreak(['2026-11-22', '2026-11-23', today], today)).toEqual({
      length: 3,
      status: 'active',
    })
  })

  it('survives until today ends if yesterday had a workout', () => {
    expect(computeStreak(['2026-11-22', '2026-11-23'], today)).toEqual({
      length: 2,
      status: 'at_risk',
    })
  })

  it('breaks after a full missed day', () => {
    expect(computeStreak(['2026-11-21', '2026-11-22'], today).length).toBe(0)
  })

  it('ignores duplicate workouts on the same day and gaps further back', () => {
    const dates = ['2026-11-18', '2026-11-23', '2026-11-23', today]
    expect(computeStreak(dates, today).length).toBe(2)
  })

  it('crosses month boundaries', () => {
    expect(computeStreak(['2026-10-31', '2026-11-01'], '2026-11-01').length).toBe(2)
  })
})

describe('computeStreak edge cases', () => {
  it('does not care about input order', () => {
    expect(computeStreak([today, '2026-11-22', '2026-11-23'], today).length).toBe(3)
  })

  it('crosses year boundaries', () => {
    expect(computeStreak(['2026-12-30', '2026-12-31', '2027-01-01'], '2027-01-01')).toEqual({ length: 3, status: 'active' })
  })

  it('counts across a DST change (Europe and US switch in March and November)', () => {
    expect(computeStreak(['2026-03-28', '2026-03-29', '2026-03-30'], '2026-03-30').length).toBe(3)
    expect(computeStreak(['2026-10-31', '2026-11-01', '2026-11-02'], '2026-11-02').length).toBe(3)
  })

  it('ignores future-dated workouts', () => {
    expect(computeStreak(['2026-11-23', '2026-11-25'], today)).toEqual({ length: 1, status: 'at_risk' })
  })

  it('counts a leap day', () => {
    expect(computeStreak(['2028-02-28', '2028-02-29', '2028-03-01'], '2028-03-01').length).toBe(3)
  })
})

describe('computeStreak with rest days', () => {
  // 2026-11-24 is a Tuesday. A Push/Pull/Legs week with Sunday (7) as the rest day:
  const sundayRest = new Set([7])

  it('bridges a rest day without counting it', () => {
    // Fri 20, Sat 21, (Sun 22 rest), Mon 23, Tue 24
    const dates = ['2026-11-20', '2026-11-21', '2026-11-23', today]
    expect(computeStreak(dates, today)).toEqual({ length: 2, status: 'active' }) // without a split: broken on Sunday
    expect(computeStreak(dates, today, sundayRest)).toEqual({ length: 4, status: 'active' })
  })

  it('still breaks when a training day is missed', () => {
    // Mon 23 missed (a training day)
    expect(computeStreak(['2026-11-21', '2026-11-22'], today, sundayRest).length).toBe(0)
  })

  it('bridges several rest days in a row (e.g. Upper/Lower weekends)', () => {
    const weekend = new Set([3, 6, 7]) // Wed, Sat, Sun rest
    // Thu 19, Fri 20, (Sat 21, Sun 22 rest), Mon 23
    expect(computeStreak(['2026-11-19', '2026-11-20', '2026-11-23'], today, weekend)).toEqual({ length: 3, status: 'at_risk' })
  })

  it('is safe all day when today is a rest day', () => {
    // Sunday 29 is a rest day; last workout Saturday 28
    expect(computeStreak(['2026-11-27', '2026-11-28'], '2026-11-29', sundayRest)).toEqual({ length: 2, status: 'resting' })
  })

  it('counts a workout done on a rest day', () => {
    expect(computeStreak(['2026-11-21', '2026-11-22', '2026-11-23'], today, sundayRest)).toEqual({ length: 3, status: 'at_risk' })
  })

  it('stops at the first workout even if every day were a rest day', () => {
    const allRest = new Set([1, 2, 3, 4, 5, 6, 7])
    expect(computeStreak(['2026-11-01'], today, allRest)).toEqual({ length: 1, status: 'resting' })
  })
})

describe('monthlyWorkoutCount', () => {
  it('counts workouts in the month only', () => {
    const dates = ['2026-10-31', '2026-11-01', '2026-11-01', '2026-11-30', '2026-12-01']
    expect(monthlyWorkoutCount(dates, { year: 2026, month: 10 })).toBe(3)
  })
})

describe('longestStreak', () => {
  const sundayRest = new Set([7]) // 2026-11-22 is a Sunday

  it('is null with no workouts', () => {
    expect(longestStreak([])).toBeNull()
  })

  it('is a single day for a single workout', () => {
    expect(longestStreak(['2026-11-10'])).toEqual({ length: 1, start: '2026-11-10', end: '2026-11-10' })
  })

  it('picks the longest run and reports where it started and ended', () => {
    const dates = ['2026-11-01', '2026-11-02', '2026-11-03', '2026-11-10', '2026-11-11', '2026-11-12', '2026-11-13', '2026-11-14', '2026-11-20', '2026-11-21']
    expect(longestStreak(dates)).toEqual({ length: 5, start: '2026-11-10', end: '2026-11-14' })
  })

  it('goes to the most recent run on a tie', () => {
    expect(longestStreak(['2026-11-01', '2026-11-02', '2026-11-10', '2026-11-11'])).toEqual({ length: 2, start: '2026-11-10', end: '2026-11-11' })
  })

  it('ignores order and duplicate workouts on one day', () => {
    expect(longestStreak(['2026-11-12', '2026-11-10', '2026-11-11', '2026-11-11'])).toEqual({ length: 3, start: '2026-11-10', end: '2026-11-12' })
  })

  it('crosses month and year boundaries', () => {
    expect(longestStreak(['2026-12-31', '2027-01-01', '2027-01-02'])).toEqual({ length: 3, start: '2026-12-31', end: '2027-01-02' })
    expect(longestStreak(['2026-10-30', '2026-10-31', '2026-11-01'])?.length).toBe(3)
  })

  it('bridges scheduled rest days without counting them', () => {
    // Fri 20, Sat 21, (Sun 22 rest), Mon 23, Tue 24
    const dates = ['2026-11-20', '2026-11-21', '2026-11-23', '2026-11-24']
    expect(longestStreak(dates, sundayRest)).toEqual({ length: 4, start: '2026-11-20', end: '2026-11-24' })
    expect(longestStreak(dates)).toEqual({ length: 2, start: '2026-11-23', end: '2026-11-24' }) // no split: Sunday breaks it
  })

  it('still breaks on a missed training day', () => {
    // Mon 23 skipped
    expect(longestStreak(['2026-11-21', '2026-11-24'], sundayRest)?.length).toBe(1)
  })

  it('does not stretch to a trailing rest day', () => {
    expect(longestStreak(['2026-11-20', '2026-11-21'], sundayRest)).toEqual({ length: 2, start: '2026-11-20', end: '2026-11-21' })
  })

  it('is never shorter than the current streak', () => {
    const dates = ['2026-11-20', '2026-11-21', '2026-11-23', '2026-11-24']
    expect(longestStreak(dates, sundayRest)!.length).toBeGreaterThanOrEqual(computeStreak(dates, '2026-11-24', sundayRest).length)
  })
})

