import type { LocalDate } from './dates'

export type GoalType = 'cut' | 'maintain' | 'bulk'

/** NT-5 starting assumptions, in g of protein per kg of body weight. */
export const GOAL_PRESETS: Record<GoalType, number> = { cut: 2.0, maintain: 1.6, bulk: 1.8 }
export const DEFAULT_MULTIPLIER = GOAL_PRESETS.maintain
export const MULTIPLIER_RANGE = { min: 0.5, max: 4.0, step: 0.1 } as const

type WeightRow = { local_date: LocalDate; measured_at: string; weight_kg: number }
type GoalRow = { effective_from: LocalDate; multiplier: number | null; goal_type: GoalType | null }
type EntryRow = { local_date: LocalDate; amount: number }

/**
 * Body weight effective on a date: the latest entry on or before it. Before the first
 * entry, the first entry stands in (a goal needs some weight). Null with no entries.
 */
export function weightOn(date: LocalDate, entries: readonly WeightRow[]): number | null {
  let best: WeightRow | null = null
  let first: WeightRow | null = null
  for (const e of entries) {
    if (!first || e.measured_at < first.measured_at) first = e
    if (e.local_date <= date && (!best || e.measured_at > best.measured_at)) best = e
  }
  return (best ?? first)?.weight_kg ?? null
}

/** Multiplier effective on a date (history via effective_from). Days before any goal use maintain. */
export function goalSettingOn(date: LocalDate, goals: readonly GoalRow[]): { multiplier: number; goalType: GoalType | null } {
  let best: GoalRow | null = null
  for (const g of goals) if (g.multiplier !== null && g.effective_from <= date && (!best || g.effective_from > best.effective_from)) best = g
  return best ? { multiplier: best.multiplier!, goalType: best.goal_type } : { multiplier: DEFAULT_MULTIPLIER, goalType: 'maintain' }
}

export type ProteinGoal = { grams: number; multiplier: number; goalType: GoalType | null; weightKg: number }

/** NT-1/NT-5: goal(date) = body weight on date × multiplier on date, in whole grams. Never stored. */
export function proteinGoalFor(date: LocalDate, goals: readonly GoalRow[], weights: readonly WeightRow[]): ProteinGoal | null {
  const weightKg = weightOn(date, weights)
  if (weightKg === null) return null
  const { multiplier, goalType } = goalSettingOn(date, goals)
  return { grams: Math.round(weightKg * multiplier), multiplier, goalType, weightKg }
}

export function dailyTotal(entries: readonly EntryRow[], date: LocalDate) {
  return Math.round(entries.filter((e) => e.local_date === date).reduce((sum, e) => sum + e.amount, 0) * 10) / 10
}

/** Totals per day, newest first, for the history list (NT-4). */
export function dailyTotals(entries: readonly EntryRow[]): { date: LocalDate; total: number }[] {
  const byDay = new Map<LocalDate, number>()
  for (const e of entries) byDay.set(e.local_date, (byDay.get(e.local_date) ?? 0) + e.amount)
  return [...byDay].map(([date, total]) => ({ date, total: Math.round(total * 10) / 10 })).sort((a, b) => b.date.localeCompare(a.date))
}

/** True only for the entry that takes the day from below the goal to at or above it. */
export const crossesGoal = (before: number, after: number, goal: number) => goal > 0 && before < goal && after >= goal

/** Which preset a multiplier matches, or null for a custom value. */
export function presetFor(multiplier: number): GoalType | null {
  const match = (Object.entries(GOAL_PRESETS) as [GoalType, number][]).find(([, m]) => Math.abs(m - multiplier) < 1e-9)
  return match?.[0] ?? null
}

/** Snap to the 0.1 grid and the allowed range (matches numeric(4,2) and the DB check). */
export function clampMultiplier(value: number) {
  const { min, max } = MULTIPLIER_RANGE
  return Math.min(max, Math.max(min, Math.round(value * 10) / 10))
}
