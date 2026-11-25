import { nextPosition, reorderPatches } from '@/domain/split'
import { db, type SplitDay, type SplitDayExercise } from '../db'
import type { SplitRows } from '../presets'
import { commit } from './write'

/** Inserts parents before children so the outbox replays in FK order. */
export function createSplit({ split, days, items }: SplitRows) {
  return commit(async (w) => {
    await w.insert('splits', split)
    for (const day of days) await w.insert('split_days', day)
    for (const item of items) await w.insert('split_day_exercises', item)
    return split.id
  })
}

/** SP-6: one column on the profile, so there can never be two active splits. */
export const activateSplit = (profileId: string, splitId: string | null) =>
  commit((w) => w.patch('profiles', profileId, { active_split_id: splitId }))

export const renameSplit = (id: string, name: string) => commit((w) => w.patch('splits', id, { name }))

/** The server cascades to days and exercises (and nulls the active split); locally we do the same. */
export function deleteSplit(id: string, profile: { id: string; active_split_id: string | null }) {
  return commit(async (w) => {
    if (profile.active_split_id === id) await w.patch('profiles', profile.id, { active_split_id: null })
    const dayIds = await db.split_days.where('split_id').equals(id).primaryKeys()
    await db.split_day_exercises.where('split_day_id').anyOf(dayIds).delete()
    await db.split_days.bulkDelete(dayIds)
    await w.remove('splits', id)
  })
}

export const updateDay = (id: string, changes: Partial<Pick<SplitDay, 'label' | 'is_rest'>>) =>
  commit((w) => w.patch('split_days', id, changes))

export function addToDay(day: Pick<SplitDay, 'id' | 'user_id'>, exerciseId: string) {
  return commit(async (w) => {
    const items = await db.split_day_exercises.where('split_day_id').equals(day.id).toArray()
    await w.insert('split_day_exercises', {
      id: crypto.randomUUID(),
      user_id: day.user_id,
      split_day_id: day.id,
      exercise_id: exerciseId,
      position: nextPosition(items),
      target_sets: null,
      target_reps_min: null,
      target_reps_max: null,
    })
  })
}

export const removeFromDay = (itemId: string) => commit((w) => w.remove('split_day_exercises', itemId))

export const setTargets = (
  itemId: string,
  targets: Pick<SplitDayExercise, 'target_sets' | 'target_reps_min' | 'target_reps_max'>,
) => commit((w) => w.patch('split_day_exercises', itemId, targets))

/** SP-5: writes only the positions that changed. */
export function reorderDay(dayId: string, orderedIds: readonly string[]) {
  return commit(async (w) => {
    const items = await db.split_day_exercises.where('split_day_id').equals(dayId).toArray()
    for (const { id, position } of reorderPatches(items, orderedIds)) await w.patch('split_day_exercises', id, { position })
  })
}
