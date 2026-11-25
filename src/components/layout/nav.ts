import { ChartLine, CircleUser, Dumbbell, House, Utensils, type LucideIcon } from 'lucide-react'
import { LIBRARY_PATH, SPLIT_PATH } from '@/features/split/paths'

export type NavItem = { to: string; label: string; icon: LucideIcon }

const home: NavItem = { to: '/', label: 'Home', icon: House }
const workout: NavItem = { to: '/workout', label: 'Workout', icon: Dumbbell }
const progress: NavItem = { to: '/progress', label: 'Progress', icon: ChartLine }
const nutrition: NavItem = { to: '/nutrition', label: 'Nutrition', icon: Utensils }
const profile: NavItem = { to: '/profile', label: 'Profile', icon: CircleUser }

/** Phone bottom bar. Split lives under Workout; Profile is the header avatar. */
export const phoneTabs = [home, workout, progress, nutrition]
/** Desktop/tablet sidebar. */
export const sidebarItems = [home, workout, progress, nutrition, profile]

export function pageTitle(pathname: string): string {
  if (pathname.startsWith(LIBRARY_PATH)) return 'Exercise library'
  if (pathname.startsWith(SPLIT_PATH)) return 'Split'
  const match = sidebarItems.find((i) => i.to !== '/' && pathname.startsWith(i.to))
  return match?.label ?? 'Pluto'
}
