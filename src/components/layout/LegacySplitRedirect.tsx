import { Navigate, useLocation } from 'react-router'
import { LIBRARY_PATH, SPLIT_PATH } from '@/features/split/paths'

/** /split → /workout/split, /split/library → /workout/library, /split/:id/... → /workout/split/:id/... */
export function LegacySplitRedirect() {
  const { pathname, search } = useLocation()
  const target = pathname.startsWith('/split/library') ? LIBRARY_PATH : pathname.replace(/^\/split/, SPLIT_PATH)
  return <Navigate to={target + search} replace />
}
