import { describe, expect, it } from 'vitest'
import { formatTargets, moveItem, nextPosition, reorderPatches, splitDayFor, trainingDaysPerWeek, validateTargets } from './split'

const week = [1, 2, 3, 4, 5, 6, 7].map((weekday) => ({ weekday, is_rest: weekday > 5, label: `Day ${weekday}` }))

describe('splitDayFor', () => {
  it('maps a local date to its ISO weekday', () => {
    expect(splitDayFor(week, '2026-11-23')?.label).toBe('Day 1') // Monday
    expect(splitDayFor(week, '2026-11-29')?.label).toBe('Day 7') // Sunday
  })

  it('returns null when the split has no row for that day', () => {
    expect(splitDayFor(week.slice(0, 3), '2026-11-29')).toBeNull()
  })

  it('counts training days', () => {
    expect(trainingDaysPerWeek(week)).toBe(5)
  })
})

describe('reordering', () => {
  it('moves an item without mutating the input', () => {
    const list = ['a', 'b', 'c', 'd']
    expect(moveItem(list, 0, 2)).toEqual(['b', 'c', 'a', 'd'])
    expect(moveItem(list, 3, 0)).toEqual(['d', 'a', 'b', 'c'])
    expect(moveItem(list, 0, 9)).toEqual(list)
    expect(list).toEqual(['a', 'b', 'c', 'd'])
  })

  it('patches only rows whose position changes', () => {
    const items = [
      { id: 'a', position: 0 },
      { id: 'b', position: 1 },
      { id: 'c', position: 2 },
    ]
    expect(reorderPatches(items, ['a', 'c', 'b'])).toEqual([
      { id: 'c', position: 1 },
      { id: 'b', position: 2 },
    ])
    expect(reorderPatches(items, ['a', 'b', 'c'])).toEqual([])
  })

  it('appends after the highest position, even with gaps', () => {
    expect(nextPosition([])).toBe(0)
    expect(nextPosition([{ id: 'a', position: 4 }, { id: 'b', position: 1 }])).toBe(5)
  })
})

describe('targets', () => {
  it('formats whichever targets are set', () => {
    expect(formatTargets({ sets: 3, repsMin: 8, repsMax: 12 })).toBe('3 × 8–12')
    expect(formatTargets({ sets: 3, repsMin: 5, repsMax: 5 })).toBe('3 × 5')
    expect(formatTargets({ sets: 1, repsMin: null, repsMax: null })).toBe('1 set')
    expect(formatTargets({ sets: null, repsMin: 8, repsMax: 12 })).toBe('8–12 reps')
    expect(formatTargets({ sets: null, repsMin: null, repsMax: null })).toBe('')
  })

  it('validates ranges and order', () => {
    expect(validateTargets({ sets: null, repsMin: null, repsMax: null })).toEqual({})
    expect(validateTargets({ sets: 21, repsMin: 8, repsMax: 12 }).sets).toBeDefined()
    expect(validateTargets({ sets: 3, repsMin: 12, repsMax: 8 }).reps).toMatch(/at least/)
    expect(validateTargets({ sets: 3, repsMin: 0, repsMax: 8 }).reps).toBeDefined()
  })
})
