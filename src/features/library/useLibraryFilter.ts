import { useMemo, useState } from 'react'
import { filterExercises, type Equipment, type Exercise } from '@/domain/library'

/** EL-3 state: search by name, browse by muscle group, filter by equipment. */
export function useLibraryFilter(library: readonly Exercise[] | undefined, includeArchived = false) {
  const [query, setQuery] = useState('')
  const [muscle, setMuscle] = useState<number | null>(null)
  const [equipment, setEquipment] = useState<Equipment | null>(null)
  const results = useMemo(
    () => filterExercises(library ?? [], { query, muscleGroupId: muscle, equipment, includeArchived }),
    [library, query, muscle, equipment, includeArchived],
  )
  return { query, setQuery, muscle, setMuscle, equipment, setEquipment, results }
}
