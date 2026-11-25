import { useEffect, useState } from 'react'
import { db, type SetLog, type Workout, type WorkoutExercise } from '@/data/db'
import { loadPrevious } from '@/data/repos/workouts'
import { summarizeWorkout, type WorkoutSummary } from '@/domain/workoutStats'
import { useLive } from '@/lib/useLive'
import { useSession } from '@/stores/session'

export type WorkoutDetail = { workout: Workout; exercises: WorkoutExercise[]; sets: SetLog[] }
export type HistoryItem = { workout: Workout; summary: WorkoutSummary }

function useUserId() {
  const s = useSession()
  return s.status === 'ready' ? s.userId : null
}

async function loadDetails(workouts: Workout[]): Promise<WorkoutDetail[]> {
  const exercises = await db.workout_exercises.where('workout_id').anyOf(workouts.map((w) => w.id)).toArray()
  const sets = await db.set_logs.where('workout_exercise_id').anyOf(exercises.map((e) => e.id)).toArray()
  return workouts.map((workout) => {
    const own = exercises.filter((e) => e.workout_id === workout.id).sort((a, b) => a.position - b.position)
    const ids = new Set(own.map((e) => e.id))
    return { workout, exercises: own, sets: sets.filter((s) => ids.has(s.workout_exercise_id)).sort((a, b) => a.set_number - b.set_number) }
  })
}

export const summaryOf = ({ workout, exercises, sets }: WorkoutDetail) =>
  summarizeWorkout(
    exercises.map((e) => ({ sets: sets.filter((s) => s.workout_exercise_id === e.id) })),
    workout.duration_seconds,
  )

/** Finished workouts, newest first, with their WK-7 summary. */
export function useWorkoutHistory(): HistoryItem[] | undefined {
  const userId = useUserId()
  return useLive(async () => {
    if (!userId) return []
    const workouts = (await db.workouts.where('user_id').equals(userId).toArray()).sort((a, b) => b.started_at.localeCompare(a.started_at))
    return (await loadDetails(workouts)).map((d) => ({ workout: d.workout, summary: summaryOf(d) }))
  }, [userId])
}

/** undefined while loading, null when it doesn't exist. */
export function useWorkoutDetail(id: string | undefined): WorkoutDetail | null | undefined {
  return useLive(async () => {
    const workout = id ? await db.workouts.get(id) : undefined
    return workout ? ((await loadDetails([workout]))[0] ?? null) : null
  }, [id])
}

/** Full logs for one local date (the calendar day sheet). */
export function useWorkoutsOn(localDate: string | null): WorkoutDetail[] | undefined {
  const userId = useUserId()
  return useLive(async () => {
    if (!userId || !localDate) return []
    const workouts = (await db.workouts.where('local_date').equals(localDate).toArray())
      .filter((w) => w.user_id === userId)
      .sort((a, b) => a.started_at.localeCompare(b.started_at))
    return loadDetails(workouts)
  }, [userId, localDate])
}

/** One local date per finished workout (streaks count workouts, the calendar counts days). */
export function useWorkoutDates(): string[] | undefined {
  const userId = useUserId()
  return useLive(async () => (userId ? (await db.workouts.where('user_id').equals(userId).toArray()).map((w) => w.local_date) : []), [userId])
}

/** WK-5 for the logger. Keyed by the exercise list so it only re-reads when that changes. */
export function usePreviousPerformance(exerciseIds: readonly string[], excludeWorkoutId?: string) {
  const key = [...new Set(exerciseIds)].sort().join()
  return useLive(() => loadPrevious(key ? key.split(',') : [], excludeWorkoutId), [key, excludeWorkoutId])
}

/** Re-renders every `ms` while `running`, for the workout clock. */
export function useNow(running: boolean, ms = 1000) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!running) return
    const tick = () => setNow(Date.now())
    const id = setInterval(tick, ms)
    const first = setTimeout(tick, 0) // catch up at once after a resume
    return () => {
      clearInterval(id)
      clearTimeout(first)
    }
  }, [running, ms])
  return now
}
