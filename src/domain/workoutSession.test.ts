import { describe, expect, it } from 'vitest'
import {
  addSet,
  elapsedMs,
  finishedRows,
  initialSets,
  pauseTimer,
  prefill,
  removeExercise,
  resumeTimer,
  toggleLogged,
  updateSetAndFill,
  updateSet,
  type ActiveWorkout,
  type SessionSet,
  type Timer,
} from './workoutSession'

let n = 0
const uuid = () => `id-${++n}`
const T0 = Date.UTC(2026, 10, 24, 17, 0, 0)

const set = (weightKg: number | null, reps: number | null, extra: Partial<SessionSet> = {}): SessionSet => ({
  id: uuid(),
  weightKg,
  reps,
  isWarmup: false,
  done: false,
  loggedAt: null,
  ...extra,
})

const workout = (exercises: ActiveWorkout['exercises']): ActiveWorkout => ({
  id: 'w1',
  userId: 'u1',
  splitDayId: 'd1',
  title: 'Push',
  localDate: '2026-11-24',
  notes: '  felt strong  ',
  timer: { startedAt: T0, pausedAt: null, pausedMs: 0 },
  exercises,
})

describe('timer', () => {
  it('counts active time and excludes pauses', () => {
    let t: Timer = { startedAt: T0, pausedAt: null, pausedMs: 0 }
    expect(elapsedMs(t, T0 + 60_000)).toBe(60_000)
    t = pauseTimer(t, T0 + 60_000)
    expect(elapsedMs(t, T0 + 10 * 60_000)).toBe(60_000) // frozen while paused
    t = resumeTimer(t, T0 + 10 * 60_000)
    expect(elapsedMs(t, T0 + 11 * 60_000)).toBe(2 * 60_000)
  })

  it('ignores a second pause or resume', () => {
    const paused = pauseTimer({ startedAt: T0, pausedAt: null, pausedMs: 0 }, T0 + 1000)
    expect(pauseTimer(paused, T0 + 5000)).toBe(paused)
    const running = resumeTimer(paused, T0 + 2000)
    expect(resumeTimer(running, T0 + 3000)).toBe(running)
  })

  it('survives a reload because it is only timestamps', () => {
    const saved = JSON.parse(JSON.stringify({ startedAt: T0, pausedAt: null, pausedMs: 30_000 }))
    expect(elapsedMs(saved, T0 + 90_000)).toBe(60_000)
  })
})

describe('pre-fill', () => {
  const previous = [
    { weightKg: 40, reps: 10, isWarmup: true },
    { weightKg: 80, reps: 8, isWarmup: false },
    { weightKg: 82.5, reps: 6, isWarmup: false },
  ]

  it('copies the previous row in this session first', () => {
    expect(prefill([set(90, 5)], previous)).toEqual({ weightKg: 90, reps: 5 })
  })

  it('otherwise uses last session’s first working set, then the rep target', () => {
    expect(prefill([], previous)).toEqual({ weightKg: 80, reps: 8 })
    expect(prefill([], undefined, 10)).toEqual({ weightKg: null, reps: 10 })
  })

  it('starts target sets from the matching working sets of last session', () => {
    const rows = initialSets(previous, { sets: 3, repsMin: 8 }, uuid)
    expect(rows.map((r) => [r.weightKg, r.reps])).toEqual([[80, 8], [82.5, 6], [82.5, 6]])
  })

  it('without targets, repeats last session including warm-ups', () => {
    expect(initialSets(previous, undefined, uuid).map((r) => r.isWarmup)).toEqual([true, false, false])
  })

  it('with no history, gives one row with the rep target', () => {
    expect(initialSets(undefined, { sets: null, repsMin: 12 }, uuid)).toMatchObject([{ weightKg: null, reps: 12 }])
  })
})

describe('logging', () => {
  it('logs a pre-filled row in one tap and un-logs on a second', () => {
    const s = set(80, 8)
    let w = workout([{ id: 'e1', exerciseId: 'bench', sets: [s] }])
    w = toggleLogged(w, 'e1', s.id, '2026-11-24T17:05:00.000Z')
    expect(w.exercises[0]!.sets[0]).toMatchObject({ done: true, loggedAt: '2026-11-24T17:05:00.000Z' })
    w = toggleLogged(w, 'e1', s.id, '2026-11-24T17:06:00.000Z')
    expect(w.exercises[0]!.sets[0]).toMatchObject({ done: false, loggedAt: null })
  })

  it('treats an empty weight as bodyweight but needs reps', () => {
    const bw = set(null, 12)
    const noReps = set(60, null)
    let w = workout([{ id: 'e1', exerciseId: 'pullup', sets: [bw, noReps] }])
    w = toggleLogged(w, 'e1', bw.id, 'now')
    w = toggleLogged(w, 'e1', noReps.id, 'now')
    expect(w.exercises[0]!.sets.map((x) => [x.done, x.weightKg])).toEqual([[true, 0], [false, 60]])
  })

  it('adds, edits and removes', () => {
    let w = workout([{ id: 'e1', exerciseId: 'bench', sets: [set(80, 8)] }])
    w = addSet(w, 'e1', 'new')
    expect(w.exercises[0]!.sets[1]).toMatchObject({ id: 'new', weightKg: 80, reps: 8, done: false })
    w = updateSet(w, 'e1', 'new', { isWarmup: true, reps: 10 })
    expect(w.exercises[0]!.sets[1]).toMatchObject({ isWarmup: true, reps: 10 })
    expect(removeExercise(w, 'e1').exercises).toEqual([])
  })
})

describe('finishedRows', () => {
  it('keeps only logged sets, renumbers them and drops empty exercises', () => {
    const a = set(60, 10, { done: true, isWarmup: true, loggedAt: '2026-11-24T17:02:00.000Z' })
    const b = set(80, 8)
    const c = set(80, 8, { done: true, loggedAt: '2026-11-24T17:04:00.000Z' })
    const w = workout([
      { id: 'skip', exerciseId: 'fly', sets: [set(20, 12)] },
      { id: 'e1', exerciseId: 'bench', sets: [a, b, c] },
    ])
    const rows = finishedRows({ ...w, timer: { startedAt: T0, pausedAt: null, pausedMs: 5 * 60_000 } }, T0 + 50 * 60_000)

    expect(rows.workout).toMatchObject({ duration_seconds: 45 * 60, notes: 'felt strong', split_day_id: 'd1', local_date: '2026-11-24' })
    expect(rows.workout.ended_at).toBe(new Date(T0 + 50 * 60_000).toISOString())
    expect(rows.exercises).toEqual([{ id: 'e1', user_id: 'u1', workout_id: 'w1', exercise_id: 'bench', position: 0 }])
    expect(rows.sets.map((s) => [s.set_number, s.is_warmup, s.weight_kg])).toEqual([[1, true, 60], [2, false, 80]])
  })

  it('stores empty notes as null', () => {
    expect(finishedRows({ ...workout([]), notes: '   ' }, T0).workout.notes).toBeNull()
  })
})

describe('updateSetAndFill', () => {
  it('fills only empty, unlogged working rows below the edited one', () => {
    const rows = [set(null, 6), set(null, 6), set(70, 6), set(null, 6, { done: true }), set(null, 6, { isWarmup: true }), set(null, 6)]
    const w = updateSetAndFill(workout([{ id: 'e1', exerciseId: 'bench', sets: rows }]), 'e1', rows[0]!.id, { weightKg: 80 })
    expect(w.exercises[0]!.sets.map((x) => x.weightKg)).toEqual([80, 80, 70, null, null, 80])
  })

  it('never touches rows above', () => {
    const rows = [set(null, null), set(null, null)]
    const w = updateSetAndFill(workout([{ id: 'e1', exerciseId: 'bench', sets: rows }]), 'e1', rows[1]!.id, { reps: 5 })
    expect(w.exercises[0]!.sets.map((x) => x.reps)).toEqual([null, 5])
  })
})
