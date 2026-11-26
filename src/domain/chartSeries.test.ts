import { describe, expect, it } from 'vitest'
import { bodyweightSeries, exerciseSeries, rangeStart, seriesSummary } from './chartSeries'
import { estimateOneRepMax } from './oneRepMax'

describe('estimateOneRepMax (Epley)', () => {
  it('is the weight for a single rep', () => {
    expect(estimateOneRepMax(100, 1)).toBe(100)
  })

  it('is weight × (1 + reps / 30) otherwise', () => {
    expect(estimateOneRepMax(100, 5)).toBeCloseTo(116.667, 3)
    expect(estimateOneRepMax(60, 10)).toBe(80)
  })

  it('is 0 for bodyweight-only or no reps', () => {
    expect(estimateOneRepMax(0, 12)).toBe(0)
    expect(estimateOneRepMax(100, 0)).toBe(0)
  })
})

describe('rangeStart', () => {
  it('goes back whole months, clamping month ends', () => {
    expect(rangeStart('1M', '2026-11-24')).toBe('2026-10-24')
    expect(rangeStart('3M', '2026-05-31')).toBe('2026-02-28')
    expect(rangeStart('1M', '2028-03-31')).toBe('2028-02-29')
    expect(rangeStart('1Y', '2026-11-24')).toBe('2025-11-24')
    expect(rangeStart('All', '2026-11-24')).toBeNull()
  })
})

const workouts = [
  { id: 'w1', local_date: '2026-06-01', started_at: '2026-06-01T17:00:00Z' },
  { id: 'w3', local_date: '2026-11-20', started_at: '2026-11-20T17:00:00Z' },
  { id: 'w2', local_date: '2026-11-01', started_at: '2026-11-01T17:00:00Z' },
  { id: 'w4', local_date: '2026-11-22', started_at: '2026-11-22T17:00:00Z' }, // warm-ups only
  { id: 'w5', local_date: '2026-11-23', started_at: '2026-11-23T17:00:00Z' }, // other exercise
]
const exercises = [
  { id: 'e1', workout_id: 'w1', exercise_id: 'bench' },
  { id: 'e2', workout_id: 'w2', exercise_id: 'bench' },
  { id: 'e3a', workout_id: 'w3', exercise_id: 'bench' },
  { id: 'e3b', workout_id: 'w3', exercise_id: 'bench' }, // same exercise twice in one workout
  { id: 'e4', workout_id: 'w4', exercise_id: 'bench' },
  { id: 'e5', workout_id: 'w5', exercise_id: 'squat' },
]
const s = (workout_exercise_id: string, weight_kg: number, reps: number, is_warmup = false) => ({ workout_exercise_id, weight_kg, reps, is_warmup })
const sets = [
  s('e1', 70, 8),
  s('e2', 40, 10, true),
  s('e2', 80, 5),
  s('e2', 75, 8),
  s('e3a', 85, 3),
  s('e3b', 60, 12),
  s('e4', 40, 10, true),
  s('e5', 120, 5),
]

describe('exerciseSeries', () => {
  it('gives one point per session, oldest first, from working sets only', () => {
    const points = exerciseSeries('bench', workouts, exercises, sets, 'All', '2026-11-24')
    expect(points.map((p) => p.workoutId)).toEqual(['w1', 'w2', 'w3'])
    expect(points[1]).toEqual({ date: '2026-11-01', workoutId: 'w2', topWeightKg: 80, e1rmKg: 95, topReps: 8, topSeconds: 0 }) // best reps: the 75 × 8 set
  })

  it('merges an exercise that appears twice in a workout', () => {
    const w3 = exerciseSeries('bench', workouts, exercises, sets, 'All', '2026-11-24')[2]!
    expect(w3.topWeightKg).toBe(85)
    expect(w3.e1rmKg).toBe(93.5) // best of 85 × (1 + 3/30) = 93.5 and 60 × (1 + 12/30) = 84
  })

  it('filters by time range', () => {
    expect(exerciseSeries('bench', workouts, exercises, sets, '1M', '2026-11-24').map((p) => p.workoutId)).toEqual(['w2', 'w3'])
  })
})

describe('bodyweightSeries', () => {
  const entries = [
    { local_date: '2026-11-20', measured_at: '2026-11-20T07:00:00Z', weight_kg: 80 },
    { local_date: '2026-11-20', measured_at: '2026-11-20T21:00:00Z', weight_kg: 80.6 },
    { local_date: '2026-11-10', measured_at: '2026-11-10T07:00:00Z', weight_kg: 81 },
    { local_date: '2025-01-01', measured_at: '2025-01-01T07:00:00Z', weight_kg: 85 },
  ]

  it('keeps the last weigh-in per day, oldest first, within range', () => {
    expect(bodyweightSeries(entries, '1M', '2026-11-24')).toEqual([
      { date: '2026-11-10', weightKg: 81 },
      { date: '2026-11-20', weightKg: 80.6 },
    ])
    expect(bodyweightSeries(entries, 'All', '2026-11-24')).toHaveLength(3)
  })
})

describe('seriesSummary', () => {
  it('reports latest, best and change since the first point', () => {
    expect(seriesSummary([80, 85, 82.5])).toEqual({ latest: 82.5, best: 85, change: 2.5 })
    expect(seriesSummary([])).toBeNull()
  })
})
