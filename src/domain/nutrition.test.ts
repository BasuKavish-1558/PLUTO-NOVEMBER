import { describe, expect, it } from 'vitest'
import {
  clampMultiplier,
  crossesGoal,
  dailyTotal,
  dailyTotals,
  goalSettingOn,
  presetFor,
  proteinGoalFor,
  weightOn,
} from './nutrition'

const w = (local_date: string, weight_kg: number, time = '08:00') => ({ local_date, weight_kg, measured_at: `${local_date}T${time}:00.000Z` })
const g = (effective_from: string, multiplier: number, goal_type: 'cut' | 'maintain' | 'bulk' | null = null) => ({ effective_from, multiplier, goal_type })

const weights = [w('2026-11-01', 82), w('2026-11-10', 80), w('2026-11-10', 79.5, '20:00'), w('2026-11-20', 78)]
const goals = [g('2026-11-05', 1.6, 'maintain'), g('2026-11-15', 2.0, 'cut')]

describe('body weight on a date', () => {
  it('uses the latest entry on or before the date', () => {
    expect(weightOn('2026-11-12', weights)).toBe(79.5) // the evening entry of the 10th
    expect(weightOn('2026-11-20', weights)).toBe(78)
  })

  it('falls back to the first entry before any exists, and null without entries', () => {
    expect(weightOn('2026-10-01', weights)).toBe(82)
    expect(weightOn('2026-11-01', [])).toBeNull()
  })
})

describe('goal setting on a date', () => {
  it('uses the multiplier effective on that date (history kept)', () => {
    expect(goalSettingOn('2026-11-10', goals)).toEqual({ multiplier: 1.6, goalType: 'maintain' })
    expect(goalSettingOn('2026-11-15', goals)).toEqual({ multiplier: 2.0, goalType: 'cut' })
  })

  it('defaults to maintain (1.6) before the first goal', () => {
    expect(goalSettingOn('2026-11-01', goals)).toEqual({ multiplier: 1.6, goalType: 'maintain' })
  })
})

describe('proteinGoalFor', () => {
  it('is body weight × multiplier, both as of that date, in whole grams', () => {
    expect(proteinGoalFor('2026-11-12', goals, weights)).toEqual({ grams: 127, multiplier: 1.6, goalType: 'maintain', weightKg: 79.5 })
    expect(proteinGoalFor('2026-11-21', goals, weights)?.grams).toBe(156) // 78 × 2.0
  })

  it('recalculates when a new weight is logged', () => {
    const later = [...weights, w('2026-11-22', 76)]
    expect(proteinGoalFor('2026-11-22', goals, later)?.grams).toBe(152)
    expect(proteinGoalFor('2026-11-21', goals, later)?.grams).toBe(156) // past days unchanged
  })

  it('needs a body weight', () => {
    expect(proteinGoalFor('2026-11-22', goals, [])).toBeNull()
  })
})

describe('daily totals', () => {
  const entries = [
    { local_date: '2026-11-24', amount: 25 },
    { local_date: '2026-11-24', amount: 30.5 },
    { local_date: '2026-11-23', amount: 40 },
  ]

  it('sums only the given local date (resets at local midnight)', () => {
    expect(dailyTotal(entries, '2026-11-24')).toBe(55.5)
    expect(dailyTotal(entries, '2026-11-25')).toBe(0)
  })

  it('lists days newest first', () => {
    expect(dailyTotals(entries)).toEqual([
      { date: '2026-11-24', total: 55.5 },
      { date: '2026-11-23', total: 40 },
    ])
  })

  it('flags only the entry that reaches the goal', () => {
    expect(crossesGoal(100, 130, 128)).toBe(true)
    expect(crossesGoal(130, 150, 128)).toBe(false)
    expect(crossesGoal(100, 120, 128)).toBe(false)
    expect(crossesGoal(0, 10, 0)).toBe(false)
  })
})

describe('multiplier', () => {
  it('recognises presets and custom values', () => {
    expect(presetFor(2.0)).toBe('cut')
    expect(presetFor(1.8)).toBe('bulk')
    expect(presetFor(1.7)).toBeNull()
  })

  it('snaps to 0.1 within 0.5–4.0', () => {
    expect(clampMultiplier(1.66)).toBe(1.7)
    expect(clampMultiplier(0.1)).toBe(0.5)
    expect(clampMultiplier(9)).toBe(4)
  })
})
