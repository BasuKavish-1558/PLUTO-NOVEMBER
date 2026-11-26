import { describe, expect, it } from 'vitest'
import { formatClock, formatDuration, summarizeWorkout, workingSets } from './workoutStats'

const set = (weight_kg: number, reps: number, is_warmup = false) => ({ weight_kg, reps, is_warmup })

describe('working sets', () => {
  it('leaves warm-ups out', () => {
    expect(workingSets([set(60, 10, true), set(100, 5), set(90, 8)])).toHaveLength(2)
  })
})

describe('summarizeWorkout', () => {
  it('reports duration, exercises with sets, and working and warm-up sets', () => {
    const summary = summarizeWorkout(
      [{ sets: [set(40, 10, true), set(80, 8), set(80, 8)] }, { sets: [set(0, 10)] }, { sets: [] }],
      3600,
    )
    expect(summary).toEqual({ durationSeconds: 3600, exerciseCount: 2, setCount: 3, warmupCount: 1 })
  })

  it('is all zeros for an empty workout', () => {
    expect(summarizeWorkout([], 0)).toEqual({ durationSeconds: 0, exerciseCount: 0, setCount: 0, warmupCount: 0 })
  })
})

describe('formatting', () => {
  it('formats the running clock', () => {
    expect(formatClock(0)).toBe('0:00')
    expect(formatClock(754)).toBe('12:34')
    expect(formatClock(3725)).toBe('1:02:05')
  })

  it('formats a finished duration', () => {
    expect(formatDuration(40)).toBe('under 1 min')
    expect(formatDuration(754)).toBe('12 min')
    expect(formatDuration(3725)).toBe('1 h 2 min')
  })
})
