import { db, type PersonalRecord, type SetLog, type Workout, type WorkoutExercise } from '@/data/db'
import { useLive } from '@/lib/useLive'
import { useSession } from '@/stores/session'

export type TrainingHistory = { workouts: Workout[]; exercises: WorkoutExercise[]; sets: SetLog[] }

function useUserId() {
  const s = useSession()
  return s.status === 'ready' ? s.userId : null
}

/** All finished training, read once and shared by the charts (everything is local). */
export function useTrainingHistory(): TrainingHistory | undefined {
  const userId = useUserId()
  return useLive(async () => {
    if (!userId) return { workouts: [], exercises: [], sets: [] }
    const workouts = await db.workouts.where('user_id').equals(userId).toArray()
    const exercises = await db.workout_exercises.where('workout_id').anyOf(workouts.map((w) => w.id)).toArray()
    const sets = await db.set_logs.where('workout_exercise_id').anyOf(exercises.map((e) => e.id)).toArray()
    return { workouts, exercises, sets }
  }, [userId])
}

/** Every PR of the user (previousRecord needs the full list). */
export function usePrs(): PersonalRecord[] | undefined {
  const userId = useUserId()
  return useLive(async () => (userId ? db.personal_records.where('user_id').equals(userId).toArray() : []), [userId])
}
