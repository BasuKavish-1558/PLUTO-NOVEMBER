import type { Exercise } from '@/domain/library'
import { commit } from './write'

export type ExerciseInput = Pick<Exercise, 'name' | 'muscle_group_id' | 'secondary_muscle_group_ids' | 'equipment'>

/** EL-4. Check names with nameTaken() first; the server only enforces uniqueness per user. */
export function createExercise(userId: string, input: ExerciseInput) {
  const id = crypto.randomUUID()
  return commit(async (w) => {
    await w.insert('exercises', { id, user_id: userId, archived_at: null, ...input })
    return id
  })
}

export const updateExercise = (id: string, input: ExerciseInput) => commit((w) => w.patch('exercises', id, input))

/** EL-6: never hard-deleted, so past workouts and splits keep their exercise. */
export const archiveExercise = (id: string) =>
  commit((w) => w.patch('exercises', id, { archived_at: new Date().toISOString() }))

export const restoreExercise = (id: string) => commit((w) => w.patch('exercises', id, { archived_at: null }))
