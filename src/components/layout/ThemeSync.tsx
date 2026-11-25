import { lazy, Suspense, useEffect } from 'react'
import { db } from '@/data/db'
import { updateProfile } from '@/data/repos/profile'
import { useProfile } from '@/features/profile/queries'
import { applyTheme, resolveDark, useTheme } from '@/stores/theme'

// Sonner loads after the first screen; toasts raised before then wait in its store.
const Toaster = lazy(() => import('sonner').then((m) => ({ default: m.Toaster })))

/**
 * Keeps <html class="dark"> in sync with the preference and the OS setting, and,
 * once onboarded, mirrors the preference to profiles.theme_pref in both directions.
 */
export function ThemeSync() {
  const pref = useTheme((s) => s.pref)
  const profile = useProfile()
  const syncedId = profile?.onboarded_at ? profile.id : null
  const savedPref = profile?.onboarded_at ? profile.theme_pref : null
  const savedBackground = profile?.onboarded_at ? (profile.background ?? 'none') : null

  useEffect(() => {
    applyTheme(pref)
    if (pref !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => applyTheme('system')
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [pref])

  // Profile → device (sign-in, or a change pulled from another device).
  useEffect(() => {
    if (savedPref) useTheme.getState().setPref(savedPref)
  }, [savedPref])
  useEffect(() => {
    if (savedBackground) useTheme.getState().setBackground(savedBackground)
  }, [savedBackground])

  // Device → profile (header toggle or the Profile setting).
  useEffect(() => {
    if (!syncedId) return
    return useTheme.subscribe(async ({ pref: next, background }) => {
      const current = await db.profiles.get(syncedId)
      if (!current) return
      if (current.theme_pref !== next) await updateProfile(syncedId, { theme_pref: next })
      if ((current.background ?? 'none') !== background) await updateProfile(syncedId, { background })
    })
  }, [syncedId])

  return (
    <Suspense>
      <Toaster position="top-center" theme={resolveDark(pref) ? 'dark' : 'light'} />
    </Suspense>
  )
}
