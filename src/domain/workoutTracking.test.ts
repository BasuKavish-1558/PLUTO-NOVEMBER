import { describe, expect, it } from 'vitest'
import { diffWorkout, previousPerformance, sessionFromRows } from './workoutHistory'
import {
  addSet,
  finishedRows,
  initialSets,
  isEmptySet,
  prefill,
  toggleLogged,
  updateSetAndFill,
  type ActiveWorkout,
  type SessionSet,
} from './workoutSession'

/** Reps-only (bodyweight) and timed (Dead Hang) exercises, end to end through the pure session code. */

let n = 0
const uuid = () => `id-${++n}`
const T0 = Date.UTC(2026, 10, 24, 17, 0, 0)

const row = (extra: Partial<SessionSet> = {}): SessionSet => ({
  id: uuid(),
  weightKg: null,
  reps: null,
  durationSeconds: null,
  isWarmup: false,
  done: false,
  loggedAt: null,
  ...extra,
})

const workout = (exercises: ActiveWorkout['exercises']): ActiveWorkout => ({
  id: 'w1',
  userId: 'u1',
  splitDayId: null,
  title: '',
  localDate: '2026-11-24',
  notes: '',
  timer: { startedAt: T0, pausedAt: null, pausedMs: 0 },
  exercises,
})

const prevWeighted = [{ weightKg: 10, reps: 8, durationSeconds: null, isWarmup: false }]
const prevHang = [{ weightKg: 0, reps: 1, durationSeconds: 45, isWarmup: false }]

describe('pre-fill by tracking', () => {
  it('reps-only rows never carry a weight, even from old weighted history', () => {
    const rows = initialSets('reps', prevWeighted, { sets: 2, repsMin: 6 }, uuid)
    expect(rows.map((r) => [r.weightKg, r.reps, r.durationSeconds])).toEqual([
      [null, 8, null],
      [null, 8, null],
    ])
    expect(prefill('reps', [], undefined, 10)).toEqual({ weightKg: null, reps: 10, durationSeconds: null })
  })

  it('timed rows copy the time and ignore reps', () => {
    expect(initialSets('time', prevHang, { sets: 2, repsMin: 8 }, uuid).map((r) => [r.reps, r.durationSeconds])).toEqual([
      [null, 45],
      [null, 45],
    ])
    // Old history logged as plain reps (no time): nothing leaks into the timed row.
    const old = [{ weightKg: 0, reps: 30, durationSeconds: null, isWarmup: false }]
    expect(initialSets('time', old, undefined, uuid).map((r) => [r.reps, r.durationSeconds])).toEqual([[null, null]])
  })

  it('adds a set copying the last one, per tracking', () => {
    const w = addSet(workout([{ id: 'e1', exerciseId: 'hang', tracking: 'time', sets: [row({ durationSeconds: 40 })] }]), 'e1', 'new')
    expect(w.exercises[0]!.sets[1]).toMatchObject({ id: 'new', durationSeconds: 40, reps: null, weightKg: null })
  })
})

describe('logging by tracking', () => {
  it('a timed set needs a time; a reps-only set needs reps and is saved with weight 0', () => {
    const hang = row({ durationSeconds: 45 })
    const noTime = row()
    let w = workout([{ id: 'e1', exerciseId: 'hang', tracking: 'time', sets: [hang, noTime] }])
    w = toggleLogged(w, 'e1', hang.id, 'now')
    w = toggleLogged(w, 'e1', noTime.id, 'now')
    expect(w.exercises[0]!.sets.map((x) => x.done)).toEqual([true, false])

    const pullUp = row({ reps: 8 })
    let w2 = workout([{ id: 'e2', exerciseId: 'pullup', tracking: 'reps', sets: [pullUp] }])
    w2 = toggleLogged(w2, 'e2', pullUp.id, 'now')
    expect(w2.exercises[0]!.sets[0]).toMatchObject({ done: true, weightKg: 0 })
  })

  it('a time-only row is not blank; an empty one is', () => {
    expect(isEmptySet(row({ durationSeconds: 45 }))).toBe(false)
    expect(isEmptySet(row())).toBe(true)
    expect(isEmptySet(row({ weightKg: 0, reps: 0, durationSeconds: 0 }))).toBe(true)
  })

  it('typing a time fills the empty rows below', () => {
    const [a, b, c] = [row(), row(), row({ durationSeconds: 30 })]
    const w = updateSetAndFill(workout([{ id: 'e1', exerciseId: 'hang', tracking: 'time', sets: [a!, b!, c!] }]), 'e1', a!.id, { durationSeconds: 60 })
    expect(w.exercises[0]!.sets.map((x) => x.durationSeconds)).toEqual([60, 60, 30])
  })
})

describe('what is saved', () => {
  it('stores a hold as one rep plus its duration, and reps-only sets with no weight', () => {
    const hang = row({ durationSeconds: 75, done: true, loggedAt: '2026-11-24T17:10:00.000Z' })
    const pullUp = row({ weightKg: 10, reps: 8, done: true, loggedAt: '2026-11-24T17:20:00.000Z' }) // stale weight must not be saved
    const bench = row({ weightKg: 80, reps: 5, done: true, loggedAt: '2026-11-24T17:30:00.000Z' })
    const rows = finishedRows(
      workout([
        { id: 'e1', exerciseId: 'hang', tracking: 'time', sets: [hang] },
        { id: 'e2', exerciseId: 'pullup', tracking: 'reps', sets: [pullUp] },
        { id: 'e3', exerciseId: 'bench', tracking: 'weight_reps', sets: [bench] },
      ]),
      T0 + 3_600_000,
    )
    expect(rows.sets.map((x) => [x.weight_kg, x.reps, x.duration_seconds])).toEqual([
      [0, 1, 75],
      [0, 8, undefined],
      [80, 5, undefined],
    ])
    expect('duration_seconds' in rows.sets[1]!).toBe(false) // key omitted, so normal sets also work before the migration
  })
})

describe('history and editing', () => {
  const workouts = [{ id: 'w1', started_at: '2026-11-20T17:00:00.000Z' }]
  const exercises = [{ id: 'we1', workout_id: 'w1', exercise_id: 'hang', position: 0 }]
  const sets = [{ id: 's1', workout_exercise_id: 'we1', set_number: 1, weight_kg: 0, reps: 1, duration_seconds: 45, is_warmup: false }]

  it('previous performance carries the duration', () => {
    expect(previousPerformance(workouts, exercises, sets).get('hang')?.sets).toEqual([{ weightKg: 0, reps: 1, durationSeconds: 45, isWarmup: false }])
  })

  it('an edited timed set patches only the duration; a new timed set is one rep', () => {
    let draft = sessionFromRows(exercises, sets, null, () => 'time')
    expect(draft.exercises[0]!.tracking).toBe('time')
    expect(diffWorkout(exercises, sets, draft).patchSets).toEqual([])

    const ex = draft.exercises[0]!
    draft = { ...draft, exercises: [{ ...ex, sets: [{ ...ex.sets[0]!, durationSeconds: 60 }, row({ id: 'new', durationSeconds: 30, done: true })] }] }
    const ops = diffWorkout(exercises, sets, draft)
    expect(ops.patchSets).toEqual([{ id: 's1', changes: { duration_seconds: 60 } }])
    expect(ops.insertSets).toEqual([{ id: 'new', workout_exercise_id: 'we1', set_number: 2, weight_kg: 0, reps: 1, duration_seconds: 30, is_warmup: false }])
  })

  it('stored weight on a reps-only exercise is left alone when editing', () => {
    const old = [{ id: 's1', workout_exercise_id: 'we1', set_number: 1, weight_kg: 10, reps: 8, is_warmup: false }]
    const draft = sessionFromRows(exercises, old, null, () => 'reps')
    expect(draft.exercises[0]!.sets[0]!.weightKg).toBe(10)
    expect(diffWorkout(exercises, old, draft).patchSets).toEqual([])
  })
})
