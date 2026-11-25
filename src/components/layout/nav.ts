import { ChartLine, CircleUser, Dumbbell, House, Layers, Utensils, type LucideIcon } from 'lucide-react'

export type NavItem = { to: string; label: string; icon: LucideIcon; hint?: string }

const home: NavItem = { to: '/', label: 'Home', icon: House }
const workout: NavItem = { to: '/workout', label: 'Workout', icon: Dumbbell }
const progress: NavItem = { to: '/progress', label: 'Progress', icon: ChartLine }
const split: NavItem = { to: '/split', label: 'Split', icon: Layers, hint: 'Weekly routine and exercise library' }
const nutrition: NavItem = { to: '/nutrition', label: 'Nutrition', icon: Utensils, hint: 'Protein goal and daily log' }
const profile: NavItem = { to: '/profile', label: 'Profile', icon: CircleUser }

/** Phone bottom bar (plus a "More" tab). Profile lives in the header avatar. */
export const phoneTabs = [home, workout, progress]
/** Phone "More" sheet. */
export const moreItems = [split, nutrition]
/** Desktop/tablet sidebar. */
export const sidebarItems = [home, workout, split, progress, nutrition, profile]

export function pageTitle(pathname: string): string {
  if (pathname.startsWith('/split/library')) return 'Exercise library'
  const match = sidebarItems.find((i) => i.to !== '/' && pathname.startsWith(i.to))
  return match?.label ?? 'Pluto'
}
