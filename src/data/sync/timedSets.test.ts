import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { toggleLogged, updateSet, type ActiveWorkout } from '@/domain/workoutSession'
import { db, wipeLocalData } from '../db'
import { BUILTIN_EXERCISES } from '../library/builtinExercises'
import { createPr } from '../repos/prs'
import { finishWorkout, loadActive, startWorkout } from '../repos/workouts'
import { server } from './fakeServer.testkit'
import { pushOutbox } from './push'

vi.mock('../supabase', async () => (await import('./fakeServer.testkit')).supabaseModule)

const USER = '66666666-6666-4666-8666-666666666666'
const T0 = Date.UTC(2026, 10, 26, 17, 0, 0)
const exerciseId = (name: string) => BUILTIN_EXERCISES.find((e) => e.name === name)!.id
const HANG = exerciseId('Dead Hang')
const PULL_UP = exerciseId('Pull-Up')
const BENCH = exerciseId('Bench Press')

const payloadsOf = async (table: string) =>
  (await db.outbox.toArray()).flatMap((e) => (e.table === table && 'payload' in e ? [e.payload as Record<string, unknown>] : []))

/** Log one set per exercise: a 75 s hang and 12 pull-ups. */
async function logHangAndPullUps(start = T0) {
  let w: ActiveWorkout = await startWorkout(
    {
      userId: USER,
      title: 'Pull',
      splitDayId: null,
      items: [
        { exerciseId: HANG, targets: { sets: 1, repsMin: 8 } },
        { exerciseId: PULL_UP, targets: { sets: 1, repsMin: 8 } },
      ],
    },
    start,
  )
  const [hang, pull] = w.exercises
  w = updateSet(w, hang!.id, hang!.sets[0]!.id, { durationSeconds: 75 })
  w = toggleLogged(w, hang!.id, hang!.sets[0]!.id, new Date(start + 60_000).toISOString())
  w = updateSet(w, pull!.id, pull!.sets[0]!.id, { reps: 12 })
  w = toggleLogged(w, pull!.id, pull!.sets[0]!.id, new Date(start + 120_000).toISOString())
  return w
}

beforeEach(async () => {
  await wipeLocalData()
  server.reset()
})

describe('starting a workout', () => {
  it('knows how each exercise is measured and keeps the other fields empty', async () => {
    const w = await startWorkout(
      {
        userId: USER,
        title: 'Mixed',
        splitDayId: null,
        items: [
          { exerciseId: HANG, targets: { sets: 2, repsMin: 8 } },
          { exerciseId: PULL_UP, targets: { sets: 1, repsMin: 8 } },
          { exerciseId: BENCH, targets: { sets: 1, repsMin: 5 } },
        ],
      },
      T0,
    )
    expect(w.exercises.map((e) => e.tracking)).toEqual(['time', 'reps', 'weight_reps'])
    expect(w.exercises[0]!.sets.map((s) => [s.reps, s.durationSeconds])).toEqual([[null, null], [null, null]]) // the rep target is ignored for a hold
    expect(w.exercises[1]!.sets[0]).toMatchObject({ weightKg: null, reps: 8, durationSeconds: null })
    expect(w.exercises[2]!.sets[0]).toMatchObject({ reps: 5, durationSeconds: null })
  })

  it('a workout saved before this feature still opens (tracking defaults to weight × reps)', async () => {
    await db.activeWorkout.put({
      key: 'current',
      workout: {
        id: 'old',
        userId: USER,
        splitDayId: null,
        title: 'Old',
        localDate: '2026-11-25',
        notes: '',
        timer: { startedAt: T0, pausedAt: null, pausedMs: 0 },
        exercises: [{ id: 'e1', exerciseId: BENCH, sets: [{ id: 's1', weightKg: 80, reps: 5, isWarmup: false, done: false, loggedAt: null }] }],
      } as unknown as ActiveWorkout,
    })
    const w = (await loadActive(USER))!
    expect(w.exercises[0]).toMatchObject({ tracking: 'weight_reps' })
    expect(w.exercises[0]!.sets[0]!.durationSeconds).toBeNull()
  })
})

describe('saving and syncing', () => {
  it('stores a hold as one rep plus its duration, and pull-ups with no weight and no duration key', async () => {
    const { workoutId } = await finishWorkout(await logHangAndPullUps(), T0 + 600_000)
    const exercises = await db.workout_exercises.where('workout_id').equals(workoutId).toArray()
    const sets = await db.set_logs.toArray()
    const hang = sets.find((s) => s.workout_exercise_id === exercises.find((e) => e.exercise_id === HANG)!.id)!
    const pull = sets.find((s) => s.workout_exercise_id === exercises.find((e) => e.exercise_id === PULL_UP)!.id)!

    expect(hang).toMatchObject({ weight_kg: 0, reps: 1, duration_seconds: 75 })
    expect(pull).toMatchObject({ weight_kg: 0, reps: 12 })
    expect('duration_seconds' in pull).toBe(false)

    const setPayloads = await payloadsOf('set_logs')
    expect(setPayloads.filter((p) => 'duration_seconds' in p)).toHaveLength(1) // only the hold: normal sets sync even before the migration
    expect(await pushOutbox()).toBe(true)
  })

  it('the next session starts from the last hold and the last rep count', async () => {
    await finishWorkout(await logHangAndPullUps(), T0 + 600_000)
    const next = await startWorkout(
      {
        userId: USER,
        title: 'Pull',
        splitDayId: null,
        items: [
          { exerciseId: HANG, targets: { sets: 1, repsMin: 8 } },
          { exerciseId: PULL_UP, targets: { sets: 1, repsMin: 8 } },
        ],
      },
      T0 + 86_400_000,
    )
    expect(next.exercises[0]!.sets[0]).toMatchObject({ durationSeconds: 75, reps: null })
    expect(next.exercises[1]!.sets[0]).toMatchObject({ reps: 12, durationSeconds: null, weightKg: null })
  })
})

describe('longest hold records', () => {
  it('saves one rep plus the duration; weighted records carry no duration key', async () => {
    const holdId = await createPr(USER, { exercise_id: HANG, type: 'longest_hold', weight_kg: 0, reps: 1, duration_seconds: 90, note: null }, null)
    const benchId = await createPr(USER, { exercise_id: BENCH, type: 'heaviest_weight', weight_kg: 100, reps: 1, note: null }, null)

    expect(await db.personal_records.get(holdId)).toMatchObject({ type: 'longest_hold', reps: 1, duration_seconds: 90 })
    expect('duration_seconds' in (await db.personal_records.get(benchId))!).toBe(false)

    const payloads = await payloadsOf('personal_records')
    expect(payloads.filter((p) => 'duration_seconds' in p).map((p) => p.duration_seconds)).toEqual([90])
  })
})
