import { create } from 'zustand'

export type SessionState =
  | { status: 'loading' }
  | { status: 'unconfigured' }
  | { status: 'signedOut' }
  | { status: 'ready'; userId: string; email: string }
  | { status: 'error'; userId: string; email: string; message: string }

/** Written only by data/auth.ts. */
export const useSession = create<SessionState>(() => ({ status: 'loading' }))

/** For screens behind the auth guard, where a ready session is guaranteed. */
export function useUser() {
  const s = useSession()
  if (s.status !== 'ready') throw new Error('useUser() outside a signed-in route')
  return s
}
