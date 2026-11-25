import { toLocalDate } from '@/domain/dates'
import { diffWorkout, previousPerformance, type PreviousSession } from '@/domain/workoutHistory'
import { finishedRows, initialSets, type ActiveWorkout, type Targets } from '@/domain/workoutSession'
import { summarizeWorkout } from '@/domain/workoutStats'
import { db, type Workout } from '../db'
import { commit } from './write'

/** WK-5: last session's sets per exercise, read from local history (works offline). */
export async function loadPrevious(exerciseIds: readonly string[], excludeWorkoutId?: string): Promise<Map<string, PreviousSession>> {
  if (!exerciseIds.length) return new Map()
  const refs = await db.workout_exercises.where('exercise_id').anyOf([...exerciseIds]).toArray()
  const workouts = (await db.workouts.bulkGet([...new Set(refs.map((r) => r.workout_id))])).filter((w) => !!w)
  const sets = await db.set_logs.where('workout_exercise_id').anyOf(refs.map((r) => r.id)).toArray()
  return previousPerformance(workouts, refs, sets, excludeWorkoutId)
}

export type StartPlan = {
  userId: string
  title: string
  splitDayId: string | null
  items: { exerciseId: string; targets?: Targets }[]
}

/** WK-1: a split day's exercises pre-filled from last session, or an empty ad hoc workout. */
export async function startWorkout(plan: StartPlan, now = Date.now()): Promise<ActiveWorkout> {
  const previous = await loadPrevious(plan.items.map((i) => i.exerciseId))
  const uuid = () => crypto.randomUUID()
  const workout: ActiveWorkout = {
    id: uuid(),
    userId: plan.userId,
    splitDayId: plan.splitDayId,
    title: plan.title,
    localDate: toLocalDate(new Date(now)),
    notes: '',
    timer: { startedAt: now, pausedAt: null, pausedMs: 0 },
    exercises: plan.items.map((i) => ({
      id: uuid(),
      exerciseId: i.exerciseId,
      sets: initialSets(previous.get(i.exerciseId)?.sets, i.targets, uuid),
    })),
  }
  await saveActive(workout)
  return workout
}

/** WK-9: called on every change so the workout survives a crash or a closed tab. */
export const saveActive = (workout: ActiveWorkout) => db.activeWorkout.put({ key: 'current', workout })
export const loadActive = async (userId: string) => {
  const record = await db.activeWorkout.get('current')
  return record?.workout.userId === userId ? record.workout : null
}
export const discardActive = () => db.activeWorkout.delete('current')

/**
 * WK-7: turns the in-progress workout into synced rows plus events, in one transaction.
 * Parents are queued before children so the outbox replays in FK order.
 */
export async function finishWorkout(active: ActiveWorkout, now = Date.now()) {
  const { workout, exercises, sets } = finishedRows(active, now)
  const summary = summarizeWorkout(
    exercises.map((e) => ({ sets: sets.filter((s) => s.workout_exercise_id === e.id) })),
    workout.duration_seconds,
  )
  await commit(async (w) => {
    await w.insert('workouts', workout)
    for (const e of exercises) await w.insert('workout_exercises', e)
    for (const { loggedAt, ...s } of sets) {
      await w.insert('set_logs', s)
      const exerciseId = exercises.find((e) => e.id === s.workout_exercise_id)!.exercise_id
      await w.event(active.userId, 'set_logged', { workout_id: workout.id, set_log_id: s.id, exercise_id: exerciseId, weight_kg: s.weight_kg, reps: s.reps, is_warmup: s.is_warmup }, loggedAt)
    }
    // Mid-workout PRs were saved without a workout (it didn't exist on the server yet); link them now.
    for (const prId of active.prIds ?? []) if (await db.personal_records.get(prId)) await w.patch('personal_records', prId, { workout_id: workout.id })
    await w.event(active.userId, 'workout_completed', { workout_id: workout.id, ...summary }, workout.ended_at)
    await db.activeWorkout.delete('current')
  })
  return { workoutId: workout.id, summary }
}

/** WK-10. The server cascades exercises, sets and photo rows; locally we delete them ourselves. Photo files go too. */
export function deleteWorkout(id: string) {
  return commit(async (w) => {
    for (const photo of await db.workout_photos.where('workout_id').equals(id).toArray()) {
      await db.workout_photos.delete(photo.id)
      await db.pendingUploads.delete(photo.storage_path)
      await db.outbox.add({ op: 'remove', table: 'storage', rowId: photo.storage_path })
    }
    // PR-6: PRs survive; the server nulls workout_id itself (ON DELETE SET NULL).
    await db.personal_records.where('workout_id').equals(id).modify({ workout_id: null })
    const exerciseIds = await db.workout_exercises.where('workout_id').equals(id).primaryKeys()
    await db.set_logs.where('workout_exercise_id').anyOf(exerciseIds).delete()
    await db.workout_exercises.bulkDelete(exerciseIds)
    await w.remove('workouts', id)
  })
}

/** WK-10: applies a diffWorkout() result row by row, plus notes. */
export function saveWorkoutEdits(workout: Workout, ops: ReturnType<typeof diffWorkout>, notes: string) {
  return commit(async (w) => {
    const nextNotes = notes.trim() || null
    if (nextNotes !== workout.notes) await w.patch('workouts', workout.id, { notes: nextNotes })
    for (const id of ops.removeExercises) {
      await db.set_logs.where('workout_exercise_id').equals(id).delete()
      await w.remove('workout_exercises', id)
    }
    for (const e of ops.insertExercises) await w.insert('workout_exercises', { ...e, user_id: workout.user_id, workout_id: workout.id })
    for (const { id, position } of ops.patchExercises) await w.patch('workout_exercises', id, { position })
    for (const id of ops.removeSets) await w.remove('set_logs', id)
    for (const s of ops.insertSets) await w.insert('set_logs', { ...s, user_id: workout.user_id })
    for (const { id, changes } of ops.patchSets) await w.patch('set_logs', id, changes)
  })
}
