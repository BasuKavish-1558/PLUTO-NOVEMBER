export type StatSet = { weight_kg: number; reps: number; is_warmup: boolean }
export type StatExercise = { sets: readonly StatSet[] }

/** Warm-ups never count toward volume or charts (WK-4). */
export const workingSets = <T extends StatSet>(sets: readonly T[]) => sets.filter((s) => !s.is_warmup)

/** weight × reps; bodyweight work logs 0 added load, so it adds no volume (PLAN A20). */
export const setVolume = (s: StatSet) => s.weight_kg * s.reps

export const volumeOf = (sets: readonly StatSet[]) => workingSets(sets).reduce((sum, s) => sum + setVolume(s), 0)

export type WorkoutSummary = {
  durationSeconds: number
  exerciseCount: number
  setCount: number // working sets
  warmupCount: number
  volumeKg: number
}

/** WK-7: duration, exercises done, total sets, total volume. Exercises without sets don't count. */
export function summarizeWorkout(exercises: readonly StatExercise[], durationSeconds: number): WorkoutSummary {
  const all = exercises.flatMap((e) => e.sets)
  const working = workingSets(all)
  return {
    durationSeconds,
    exerciseCount: exercises.filter((e) => e.sets.length > 0).length,
    setCount: working.length,
    warmupCount: all.length - working.length,
    volumeKg: Math.round(volumeOf(all) * 10) / 10,
  }
}

/** 3725 → "1:02:05", 754 → "12:34". */
export function formatClock(totalSeconds: number) {
  const s = Math.max(0, Math.floor(totalSeconds))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const ss = String(s % 60).padStart(2, '0')
  return h ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`
}

/** 3725 → "1 h 2 min", 754 → "12 min", 40 → "under 1 min". */
export function formatDuration(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
  if (minutes < 1) return 'under 1 min'
  const h = Math.floor(minutes / 60)
  return h ? `${h} h ${minutes % 60} min` : `${minutes} min`
}
