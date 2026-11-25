import { useQuery } from '@tanstack/react-query'
import { db } from '@/data/db'
import { mediaUrl } from '@/data/media'
import { latestWeight, sortWeightHistory } from '@/domain/vitals'
import { useLive } from '@/lib/useLive'
import { useSession } from '@/stores/session'

const SIGNED_URL_FRESH_MS = 50 * 60 * 1000

function useUserId() {
  const s = useSession()
  return s.status === 'ready' ? s.userId : null
}

/** undefined while loading, null when signed out. */
export function useProfile() {
  const userId = useUserId()
  return useLive(async () => (userId ? ((await db.profiles.get(userId)) ?? null) : null), [userId])
}

export function useWeightHistory() {
  const userId = useUserId()
  return useLive(
    async () => (userId ? sortWeightHistory(await db.body_vitals.where('user_id').equals(userId).toArray()) : []),
    [userId],
  )
}

export function useCurrentWeight() {
  const history = useWeightHistory()
  return history && latestWeight(history)
}

export const usePendingSyncCount = () => useLive(() => db.outbox.count(), [])
export const useSyncFailures = () => useLive(() => db.syncFailures.toArray(), [])

export function useMediaUrl(path: string | null | undefined) {
  const { data } = useQuery({
    queryKey: ['media', path],
    queryFn: () => mediaUrl(path!),
    enabled: !!path,
    // Retry soon after an offline miss; otherwise reuse the signed URL until shortly before it expires.
    staleTime: (q) => (q.state.data ? SIGNED_URL_FRESH_MS : 0),
    gcTime: SIGNED_URL_FRESH_MS,
  })
  return path ? (data ?? null) : null
}
