import { trackingOf, type Tracking } from '@/domain/tracking'
import { db } from '../db'
import { BUILTIN_EXERCISES } from './builtinExercises'

const BUILTIN = new Map<string, Tracking>(BUILTIN_EXERCISES.map((e) => [e.id, trackingOf(e)]))

/** How each exercise is measured, for built-ins and the user's custom ones alike (local data, works offline). */
export async function loadTracking(exerciseIds: readonly string[]): Promise<Map<string, Tracking>> {
  const result = new Map<string, Tracking>()
  const unknown: string[] = []
  for (const id of exerciseIds) {
    const known = BUILTIN.get(id)
    if (known) result.set(id, known)
    else unknown.push(id)
  }
  for (const custom of await db.exercises.bulkGet(unknown)) if (custom) result.set(custom.id, trackingOf(custom))
  return result
}
