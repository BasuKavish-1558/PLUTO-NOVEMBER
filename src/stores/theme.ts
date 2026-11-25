import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { BackgroundId } from '@/lib/backgrounds'

export type ThemePref = 'light' | 'dark' | 'system'

type ThemeState = {
  pref: ThemePref
  background: BackgroundId
  setPref: (pref: ThemePref) => void
  setBackground: (background: BackgroundId) => void
  toggle: () => void
}

const systemDark = () => window.matchMedia('(prefers-color-scheme: dark)').matches

export const resolveDark = (pref: ThemePref) =>
  pref === 'dark' || (pref === 'system' && systemDark())

// Stored under 'pluto-theme'; index.html reads it before first paint.
// Also mirrored to profiles.theme_pref / profiles.background by ThemeSync once signed in.
export const useTheme = create<ThemeState>()(
  persist(
    (set, get) => ({
      pref: 'system',
      background: 'none',
      setPref: (pref) => set({ pref }),
      setBackground: (background) => set({ background }),
      toggle: () => set({ pref: resolveDark(get().pref) ? 'light' : 'dark' }),
    }),
    { name: 'pluto-theme' },
  ),
)

export function applyTheme(pref: ThemePref) {
  document.documentElement.classList.toggle('dark', resolveDark(pref))
}
