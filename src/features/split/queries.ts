import { db, type Split, type SplitDay, type SplitDayExercise } from '@/data/db'
import { useProfile } from '@/features/profile/queries'
import { useLive } from '@/lib/useLive'
import { useSession } from '@/stores/session'

export type DayWithItems = SplitDay & { items: SplitDayExercise[] }
export type SplitDetail = { split: Split; days: DayWithItems[] }

export function useSplits(): Split[] | undefined {
  const session = useSession()
  const userId = session.status === 'ready' ? session.userId : null
  return useLive(
    async () =>
      userId ? (await db.splits.where('user_id').equals(userId).toArray()).sort((a, b) => a.created_at.localeCompare(b.created_at)) : [],
    [userId],
  )
}

/** undefined while loading, null when the split doesn't exist (deleted, or a bad link). */
export function useSplitDetail(splitId: string | null | undefined): SplitDetail | null | undefined {
  return useLive(async () => {
    const split = splitId ? await db.splits.get(splitId) : undefined
    if (!split) return null
    const days = (await db.split_days.where('split_id').equals(split.id).toArray()).sort((a, b) => a.weekday - b.weekday)
    const items = await db.split_day_exercises
      .where('split_day_id')
      .anyOf(days.map((d) => d.id))
      .toArray()
    return {
      split,
      days: days.map((d) => ({
        ...d,
        items: items.filter((i) => i.split_day_id === d.id).sort((a, b) => a.position - b.position),
      })),
    }
  }, [splitId])
}

export function useActiveSplit() {
  const profile = useProfile()
  const detail = useSplitDetail(profile?.active_split_id)
  return profile === undefined ? undefined : profile?.active_split_id ? detail : null
}
