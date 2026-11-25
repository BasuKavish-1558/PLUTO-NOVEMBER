import type { LocalDate } from './dates'

/** One row in the logger. Weight is added load in kg; null until typed or pre-filled. */
export type SessionSet = {
  id: string
  weightKg: number | null
  reps: number | null
  isWarmup: boolean
  done: boolean
  loggedAt: string | null
}
export type SessionExercise = { id: string; exerciseId: string; sets: SessionSet[] }
export type Session = { exercises: SessionExercise[]; notes: string }

/** Timestamps, not a ticking counter, so the time is right after a crash (PLAN A16). */
export type Timer = { startedAt: number; pausedAt: number | null; pausedMs: number }

/** The in-progress workout. Lives only in Dexie until it's finished (PLAN A15). */
export type ActiveWorkout = Session & {
  id: string
  userId: string
  splitDayId: string | null
  title: string
  localDate: LocalDate
  timer: Timer
  /** PRs logged during this workout; linked to it on Finish (PR-4). Optional for records saved before PRs existed. */
  prIds?: string[]
}

export type PreviousSet = { weightKg: number; reps: number; isWarmup: boolean }
export type Targets = { sets: number | null; repsMin: number | null }
type Uuid = () => string

// Timer ---------------------------------------------------------------------

export const elapsedMs = (t: Timer, now: number) => Math.max(0, (t.pausedAt ?? now) - t.startedAt - t.pausedMs)
export const pauseTimer = (t: Timer, now: number): Timer => (t.pausedAt === null ? { ...t, pausedAt: now } : t)
export const resumeTimer = (t: Timer, now: number): Timer =>
  t.pausedAt === null ? t : { ...t, pausedAt: null, pausedMs: t.pausedMs + Math.max(0, now - t.pausedAt) }

/** Back to 0:00, as if the workout started now (for a timer started by accident). Keeps the paused state. */
export const resetTimer = (t: Timer, now: number): Timer => ({ startedAt: now, pausedAt: t.pausedAt === null ? null : now, pausedMs: 0 })

// Pre-fill (≤ 2-tap logging) -------------------------------------------------

const blank = (id: string, weightKg: number | null, reps: number | null, isWarmup = false): SessionSet => ({
  id,
  weightKg,
  reps,
  isWarmup,
  done: false,
  loggedAt: null,
})

/** A new row copies the previous row; the first row copies last session's first working set. */
export function prefill(sets: readonly SessionSet[], previous?: readonly PreviousSet[], repsTarget: number | null = null) {
  const last = sets.at(-1)
  if (last) return { weightKg: last.weightKg, reps: last.reps }
  const ref = previous?.find((s) => !s.isWarmup) ?? previous?.[0]
  return ref ? { weightKg: ref.weightKg, reps: ref.reps } : { weightKg: null, reps: repsTarget }
}

/**
 * Rows for an exercise as a workout starts. With target sets: that many working rows, each from
 * the same working set last session. Without: last session's sets as they were. Otherwise one row.
 */
export function initialSets(previous: readonly PreviousSet[] | undefined, targets: Targets | undefined, uuid: Uuid): SessionSet[] {
  const working = previous?.filter((s) => !s.isWarmup) ?? []
  if (targets?.sets) {
    return Array.from({ length: targets.sets }, (_, i) => {
      const ref = working[i] ?? working.at(-1)
      return blank(uuid(), ref?.weightKg ?? null, ref?.reps ?? targets.repsMin)
    })
  }
  if (previous?.length) return previous.map((s) => blank(uuid(), s.weightKg, s.reps, s.isWarmup))
  return [blank(uuid(), null, targets?.repsMin ?? null)]
}

// Edits -----------------------------------------------------------------------

const mapExercise = <S extends Session>(s: S, exId: string, fn: (e: SessionExercise) => SessionExercise): S => ({
  ...s,
  exercises: s.exercises.map((e) => (e.id === exId ? fn(e) : e)),
})
const mapSet = <S extends Session>(s: S, exId: string, setId: string, fn: (set: SessionSet) => SessionSet) =>
  mapExercise(s, exId, (e) => ({ ...e, sets: e.sets.map((x) => (x.id === setId ? fn(x) : x)) }))

export const addExercise = <S extends Session>(s: S, exercise: SessionExercise): S => ({ ...s, exercises: [...s.exercises, exercise] })

export const removeExercise = <S extends Session>(s: S, exId: string): S => ({
  ...s,
  exercises: s.exercises.filter((e) => e.id !== exId),
})

export const addSet = <S extends Session>(s: S, exId: string, id: string, previous?: readonly PreviousSet[], done = false) =>
  mapExercise(s, exId, (e) => {
    const { weightKg, reps } = prefill(e.sets, previous)
    return { ...e, sets: [...e.sets, { ...blank(id, weightKg, reps), done }] }
  })

export const removeSet = <S extends Session>(s: S, exId: string, setId: string) =>
  mapExercise(s, exId, (e) => ({ ...e, sets: e.sets.filter((x) => x.id !== setId) }))

export const updateSet = <S extends Session>(s: S, exId: string, setId: string, patch: Partial<Pick<SessionSet, 'weightKg' | 'reps' | 'isWarmup'>>) =>
  mapSet(s, exId, setId, (x) => ({ ...x, ...patch }))

/**
 * Typing a weight or reps also fills the *empty*, unlogged rows below it, so after setting the
 * first row the rest are one ✓ each. Rows that already have a value are never overwritten.
 */
export const updateSetAndFill = <S extends Session>(s: S, exId: string, setId: string, patch: Partial<Pick<SessionSet, 'weightKg' | 'reps'>>) =>
  mapExercise(s, exId, (e) => {
    const at = e.sets.findIndex((x) => x.id === setId)
    return {
      ...e,
      sets: e.sets.map((x, i) => {
        if (i === at) return { ...x, ...patch }
        if (i < at || x.done || x.isWarmup) return x
        return {
          ...x,
          weightKg: x.weightKg === null && patch.weightKg != null ? patch.weightKg : x.weightKg,
          reps: x.reps === null && patch.reps != null ? patch.reps : x.reps,
        }
      }),
    }
  })

export const canLog = (set: SessionSet) => set.reps !== null && Number.isInteger(set.reps) && set.reps >= 1

/** The ✓ tap: logs a valid row (empty weight = bodyweight, 0 kg) or un-logs a logged one. */
export function toggleLogged<S extends Session>(s: S, exId: string, setId: string, nowIso: string): S {
  return mapSet(s, exId, setId, (x) => {
    if (x.done) return { ...x, done: false, loggedAt: null }
    return canLog(x) ? { ...x, done: true, weightKg: x.weightKg ?? 0, loggedAt: nowIso } : x
  })
}

export const loggedSetCount = (s: Session) => s.exercises.reduce((n, e) => n + e.sets.filter((x) => x.done).length, 0)

// Finish ----------------------------------------------------------------------

/** Server rows for a finished workout: only logged sets, numbered 1..n; exercises without any are dropped. */
export function finishedRows(w: ActiveWorkout, now: number) {
  const notes = w.notes.trim()
  const workout = {
    id: w.id,
    user_id: w.userId,
    split_day_id: w.splitDayId,
    title: w.title,
    local_date: w.localDate,
    started_at: new Date(w.timer.startedAt).toISOString(),
    ended_at: new Date(Math.max(now, w.timer.startedAt)).toISOString(),
    duration_seconds: Math.floor(elapsedMs(w.timer, now) / 1000),
    notes: notes || null,
  }
  const exercises: { id: string; user_id: string; workout_id: string; exercise_id: string; position: number }[] = []
  const sets: {
    id: string
    user_id: string
    workout_exercise_id: string
    set_number: number
    weight_kg: number
    reps: number
    is_warmup: boolean
    loggedAt: string
  }[] = []
  for (const e of w.exercises) {
    const done = e.sets.filter((x) => x.done)
    if (!done.length) continue
    exercises.push({ id: e.id, user_id: w.userId, workout_id: w.id, exercise_id: e.exerciseId, position: exercises.length })
    done.forEach((x, i) =>
      sets.push({
        id: x.id,
        user_id: w.userId,
        workout_exercise_id: e.id,
        set_number: i + 1,
        weight_kg: x.weightKg ?? 0,
        reps: x.reps!,
        is_warmup: x.isWarmup,
        loggedAt: x.loggedAt ?? workout.ended_at,
      }),
    )
  }
  return { workout, exercises, sets }
}
