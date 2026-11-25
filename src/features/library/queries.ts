import { useMemo } from 'react'
import { db, type ExerciseRow } from '@/data/db'
import { BUILTIN_EXERCISES } from '@/data/library/builtinExercises'
import { muscleIdOf, type Exercise } from '@/domain/library'
import { useLive } from '@/lib/useLive'
import { useSession } from '@/stores/session'

const BUILTINS: Exercise[] = BUILTIN_EXERCISES.map((e) => ({
  id: e.id,
  user_id: null,
  name: e.name,
  muscle_group_id: muscleIdOf(e.muscle),
  secondary_muscle_group_ids: (e.secondary ?? []).map(muscleIdOf),
  equipment: e.equipment,
  archived_at: null,
}))

const toExercise = (e: ExerciseRow): Exercise => ({
  id: e.id,
  user_id: e.user_id,
  name: e.name,
  muscle_group_id: e.muscle_group_id,
  secondary_muscle_group_ids: e.secondary_muscle_group_ids,
  equipment: e.equipment,
  archived_at: e.archived_at,
})

/** Built-ins plus the user's custom exercises, archived included (filter with filterExercises). */
export function useLibrary(): Exercise[] | undefined {
  const session = useSession()
  const userId = session.status === 'ready' ? session.userId : null
  const custom = useLive(async () => (userId ? db.exercises.where('user_id').equals(userId).toArray() : []), [userId])
  return useMemo(() => custom && [...BUILTINS, ...custom.map(toExercise)], [custom])
}

export function useExerciseMap() {
  const library = useLibrary()
  return useMemo(() => new Map((library ?? []).map((e) => [e.id, e])), [library])
}
