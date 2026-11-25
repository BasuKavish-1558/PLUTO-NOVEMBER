import { describe, expect, it } from 'vitest'
import { formatClock, formatDuration, setVolume, summarizeWorkout, volumeOf, workingSets } from './workoutStats'

const set = (weight_kg: number, reps: number, is_warmup = false) => ({ weight_kg, reps, is_warmup })

describe('volume', () => {
  it('is weight × reps per set', () => {
    expect(setVolume(set(100, 5))).toBe(500)
  })

  it('sums working sets only, excluding warm-ups', () => {
    const sets = [set(60, 10, true), set(100, 5), set(100, 5), set(90, 8)]
    expect(workingSets(sets)).toHaveLength(3)
    expect(volumeOf(sets)).toBe(500 + 500 + 720)
  })

  it('counts bodyweight sets (0 kg added) as zero volume', () => {
    expect(volumeOf([set(0, 12), set(0, 10)])).toBe(0)
    expect(volumeOf([set(0, 12), set(10, 8)])).toBe(80)
  })

  it('handles fractional plates without float noise in the summary', () => {
    expect(summarizeWorkout([{ sets: [set(22.5, 3), set(0.1, 3)] }], 0).volumeKg).toBe(67.8)
  })
})

describe('summarizeWorkout', () => {
  it('reports duration, exercises with sets, working and warm-up sets, and volume', () => {
    const summary = summarizeWorkout(
      [{ sets: [set(40, 10, true), set(80, 8), set(80, 8)] }, { sets: [set(0, 10)] }, { sets: [] }],
      3600,
    )
    expect(summary).toEqual({ durationSeconds: 3600, exerciseCount: 2, setCount: 3, warmupCount: 1, volumeKg: 1280 })
  })

  it('is all zeros for an empty workout', () => {
    expect(summarizeWorkout([], 0)).toEqual({ durationSeconds: 0, exerciseCount: 0, setCount: 0, warmupCount: 0, volumeKg: 0 })
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
