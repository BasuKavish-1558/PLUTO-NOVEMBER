import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { addSet, toggleLogged, updateSet, type ActiveWorkout } from '@/domain/workoutSession'
import { diffWorkout, sessionFromRows } from '@/domain/workoutHistory'
import { db, wipeLocalData } from '../db'
import { deleteWorkout, finishWorkout, loadActive, loadPrevious, saveActive, saveWorkoutEdits, startWorkout } from '../repos/workouts'
import { server } from './fakeServer.testkit'
import { pushOutbox } from './push'

vi.mock('../supabase', async () => (await import('./fakeServer.testkit')).supabaseModule)

const USER = '22222222-2222-4222-8222-222222222222'
const BENCH = 'bench-id'
const T0 = Date.UTC(2026, 10, 24, 17, 0, 0)

/** Start, log every pre-filled row with one tap each, as on the gym floor. */
async function logWorkout(weights: number[], start = T0) {
  let w: ActiveWorkout = await startWorkout(
    { userId: USER, title: 'Push', splitDayId: null, items: [{ exerciseId: BENCH, targets: { sets: weights.length, repsMin: 8 } }] },
    start,
  )
  const ex = w.exercises[0]!
  ex.sets.forEach((s, i) => {
    w = updateSet(w, ex.id, s.id, { weightKg: weights[i]! })
    w = toggleLogged(w, ex.id, s.id, new Date(start + (i + 1) * 60_000).toISOString())
  })
  await saveActive(w)
  return w
}

beforeEach(async () => {
  await wipeLocalData()
  server.reset()
})

describe('offline workout logging', () => {
  it('auto-saves the in-progress workout so a reload restores it', async () => {
    const w = await logWorkout([80])
    expect(await loadActive(USER)).toEqual(w)
    expect(await loadActive('someone-else')).toBeNull()
  })

  it('finishing offline writes local rows and queues parents, children, then events', async () => {
    const w = await logWorkout([80, 85])
    const { workoutId, summary } = await finishWorkout(w, T0 + 30 * 60_000)

    expect(summary).toEqual({ exerciseCount: 1, setCount: 2, warmupCount: 0, durationSeconds: 1800 }) // no volume anywhere
    expect(await db.activeWorkout.count()).toBe(0)
    expect(await db.workouts.get(workoutId)).toMatchObject({ title: 'Push', local_date: '2026-11-24' })
    expect(await db.set_logs.count()).toBe(2)

    const queue = (await db.outbox.orderBy('seq').toArray()).map((e) => `${e.op} ${e.table}`)
    expect(queue).toEqual([
      'upsert workouts',
      'upsert workout_exercises',
      'upsert set_logs',
      'insert events',
      'upsert set_logs',
      'insert events',
      'insert events',
    ])
    const types = (await db.outbox.toArray()).flatMap((e) => (e.op === 'insert' ? [e.payload.type] : []))
    expect(types).toEqual(['set_logged', 'set_logged', 'workout_completed'])
  })

  it('syncs everything in order once back online, and retries resume where they stopped', async () => {
    const { workoutId } = await finishWorkout(await logWorkout([80, 85]), T0 + 1_800_000)
    const firstSet = (await db.set_logs.toArray()).sort((a, b) => a.set_number - b.set_number)[0]!
    server.failOn = `upsert set_logs ${firstSet.id}` // connection drops mid-push

    expect(await pushOutbox()).toBe(false)
    expect(await db.outbox.count()).toBe(5)

    server.failOn = null
    expect(await pushOutbox()).toBe(true)
    expect(await db.outbox.count()).toBe(0)
    expect(server.calls.filter((c) => c.startsWith(`upsert workouts ${workoutId}`))).toHaveLength(1)
    expect(server.calls.filter((c) => c.startsWith('insert events'))).toHaveLength(3) // ON CONFLICT DO NOTHING
  })

  it('pre-fills the next session from the previous one (WK-5)', async () => {
    await finishWorkout(await logWorkout([80, 85]), T0 + 1_800_000)
    const prev = await loadPrevious([BENCH])
    expect(prev.get(BENCH)?.sets.map((s) => s.weightKg)).toEqual([80, 85])

    const next = await startWorkout({ userId: USER, title: 'Push', splitDayId: null, items: [{ exerciseId: BENCH, targets: { sets: 2, repsMin: 8 } }] }, T0 + 86_400_000)
    expect(next.exercises[0]!.sets.map((s) => [s.weightKg, s.reps])).toEqual([[80, 8], [85, 8]])
  })
})

describe('editing and deleting past workouts', () => {
  it('queues only the changed rows', async () => {
    const { workoutId } = await finishWorkout(await logWorkout([80, 85]), T0 + 1_800_000)
    await db.outbox.clear()
    const workout = (await db.workouts.get(workoutId))!
    const exercises = await db.workout_exercises.where('workout_id').equals(workoutId).toArray()
    const sets = await db.set_logs.where('workout_exercise_id').anyOf(exercises.map((e) => e.id)).toArray()

    let draft = sessionFromRows(exercises, sets, workout.notes)
    const ex = draft.exercises[0]!
    draft = updateSet(draft, ex.id, ex.sets[1]!.id, { weightKg: 87.5 })
    draft = addSet(draft, ex.id, 'extra-set', undefined, true)
    await saveWorkoutEdits(workout, diffWorkout(exercises, sets, draft), 'Good session')

    const queue = (await db.outbox.orderBy('seq').toArray()).map((e) => `${e.op} ${e.table}`)
    expect(queue).toEqual(['update workouts', 'upsert set_logs', 'update set_logs'])
    expect((await db.set_logs.get(ex.sets[1]!.id))?.weight_kg).toBe(87.5)
  })

  it('deletes locally with children and sends one delete (the server cascades)', async () => {
    const { workoutId } = await finishWorkout(await logWorkout([80]), T0 + 1_800_000)
    await db.outbox.clear()
    await deleteWorkout(workoutId)
    expect(await db.workouts.count()).toBe(0)
    expect(await db.workout_exercises.count()).toBe(0)
    expect(await db.set_logs.count()).toBe(0)
    expect((await db.outbox.toArray()).map((e) => `${e.op} ${e.table} ${e.rowId}`)).toEqual([`delete workouts ${workoutId}`])
  })
})
