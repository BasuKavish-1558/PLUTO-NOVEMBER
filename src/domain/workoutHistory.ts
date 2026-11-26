import type { Tracking } from './tracking'
import type { PreviousSet, Session } from './workoutSession'

type WorkoutRef = { id: string; started_at: string }
type ExerciseRef = { id: string; workout_id: string; exercise_id: string; position: number }
type SetRef = {
  id: string
  workout_exercise_id: string
  set_number: number
  weight_kg: number
  reps: number
  duration_seconds?: number | null
  is_warmup: boolean
}

export type PreviousSession = { workoutId: string; startedAt: string; sets: PreviousSet[] }

/**
 * WK-5 / PLAN A3: for each exercise, the most recent completed workout that contains it,
 * regardless of split day. If it appeared twice in that workout, the first occurrence wins.
 */
export function previousPerformance(
  workouts: readonly WorkoutRef[],
  exercises: readonly ExerciseRef[],
  sets: readonly SetRef[],
  excludeWorkoutId?: string,
): Map<string, PreviousSession> {
  const startedAt = new Map(workouts.filter((w) => w.id !== excludeWorkoutId).map((w) => [w.id, w.started_at]))
  const best = new Map<string, { ref: ExerciseRef; startedAt: string }>()
  for (const ref of exercises) {
    const at = startedAt.get(ref.workout_id)
    if (!at) continue
    const current = best.get(ref.exercise_id)
    const newer = !current || at > current.startedAt
    const earlierInSameWorkout = current && at === current.startedAt && ref.workout_id === current.ref.workout_id && ref.position < current.ref.position
    if (newer || earlierInSameWorkout) best.set(ref.exercise_id, { ref, startedAt: at })
  }
  const result = new Map<string, PreviousSession>()
  for (const [exerciseId, { ref, startedAt: at }] of best) {
    const rows = sets.filter((s) => s.workout_exercise_id === ref.id).sort((a, b) => a.set_number - b.set_number)
    result.set(exerciseId, {
      workoutId: ref.workout_id,
      startedAt: at,
      sets: rows.map((s) => ({ weightKg: s.weight_kg, reps: s.reps, durationSeconds: s.duration_seconds ?? null, isWarmup: s.is_warmup })),
    })
  }
  return result
}

/**
 * A saved workout as an editable session; every row counts as logged. `trackingOf` says how each
 * exercise is measured (stored values are kept as they were, even ones no longer shown).
 */
export function sessionFromRows(
  exercises: readonly ExerciseRef[],
  sets: readonly SetRef[],
  notes: string | null,
  trackingOf: (exerciseId: string) => Tracking = () => 'weight_reps',
): Session {
  return {
    notes: notes ?? '',
    exercises: [...exercises]
      .sort((a, b) => a.position - b.position)
      .map((e) => ({
        id: e.id,
        exerciseId: e.exercise_id,
        tracking: trackingOf(e.exercise_id),
        sets: sets
          .filter((s) => s.workout_exercise_id === e.id)
          .sort((a, b) => a.set_number - b.set_number)
          .map((s) => ({ id: s.id, weightKg: s.weight_kg, reps: s.reps, durationSeconds: s.duration_seconds ?? null, isWarmup: s.is_warmup, done: true, loggedAt: null })),
      })),
  }
}

type SetPatch = Partial<Pick<SetRef, 'set_number' | 'weight_kg' | 'reps' | 'duration_seconds' | 'is_warmup'>>

/**
 * WK-10: row-level changes that turn the saved workout into the edited draft. Exercises left with
 * no sets are removed; positions and set numbers are renumbered and patched only where they change.
 */
export function diffWorkout(exercises: readonly ExerciseRef[], sets: readonly SetRef[], draft: Session) {
  const oldEx = new Map(exercises.map((e) => [e.id, e]))
  const oldSets = new Map(sets.map((s) => [s.id, s]))
  const kept = draft.exercises.filter((e) => e.sets.length > 0)
  const keptIds = new Set(kept.map((e) => e.id))

  const ops = {
    insertExercises: [] as { id: string; exercise_id: string; position: number }[],
    patchExercises: [] as { id: string; position: number }[],
    removeExercises: exercises.filter((e) => !keptIds.has(e.id)).map((e) => e.id),
    insertSets: [] as SetRef[],
    patchSets: [] as { id: string; changes: SetPatch }[],
    removeSets: [] as string[],
  }

  kept.forEach((e, position) => {
    const old = oldEx.get(e.id)
    if (!old) ops.insertExercises.push({ id: e.id, exercise_id: e.exerciseId, position })
    else if (old.position !== position) ops.patchExercises.push({ id: e.id, position })

    const draftIds = new Set(e.sets.map((s) => s.id))
    if (old) for (const s of sets) if (s.workout_exercise_id === e.id && !draftIds.has(s.id)) ops.removeSets.push(s.id)

    e.sets.forEach((s, i) => {
      const timed = e.tracking === 'time'
      const next = {
        set_number: i + 1,
        weight_kg: s.weightKg ?? 0,
        reps: timed ? 1 : (s.reps ?? 0), // a timed hold is stored as one rep with its duration
        ...(timed ? { duration_seconds: s.durationSeconds ?? 0 } : {}),
        is_warmup: s.isWarmup,
      }
      const prev = oldSets.get(s.id)
      if (!prev) {
        ops.insertSets.push({ id: s.id, workout_exercise_id: e.id, ...next })
        return
      }
      const changes: SetPatch = {}
      for (const k of Object.keys(next) as (keyof typeof next)[]) if ((prev as Record<string, unknown>)[k] !== next[k]) Object.assign(changes, { [k]: next[k] })
      if (Object.keys(changes).length) ops.patchSets.push({ id: s.id, changes })
    })
  })
  return ops
}
