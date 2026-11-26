import { formatWeight, type WeightUnit } from './units'
import { formatClock } from './workoutStats'

/** How an exercise is measured: weight × reps, reps only (bodyweight), or a timed hold. */
export type Tracking = 'weight_reps' | 'reps' | 'time'

/**
 * Exercises logged by time. Ids are the built-ins' stable UUIDs (src/data/presets.test.ts checks
 * this one is "Dead Hang"). Add a hold such as Plank here to time it too.
 */
export const TIMED_EXERCISE_IDS: ReadonlySet<string> = new Set(['cfe584af-8b5b-56d6-bb56-38b1ab417dbc'])

/**
 * Bodyweight movements you load with a belt or vest: Weighted Pull-Up and the two weighted dips.
 * They keep "Bodyweight" equipment but are logged with the added weight, unlike their plain versions.
 */
export const WEIGHTED_BODYWEIGHT_IDS: ReadonlySet<string> = new Set([
  'bf323334-f1e1-5084-9bd9-94ddbf1baec2', // Weighted Pull-Up
  '4fb92502-3076-5611-9c76-0c0584d2cf42', // Weighted Chest Dip
  'b65792fc-76d6-593e-af3e-9395c251bfee', // Weighted Triceps Dip
])

/**
 * Every other bodyweight exercise (including custom ones) is reps only; the listed holds are timed.
 * A custom exercise that needs added weight can simply use other equipment.
 */
export function trackingOf(exercise: { id: string; equipment: string }): Tracking {
  if (TIMED_EXERCISE_IDS.has(exercise.id)) return 'time'
  if (WEIGHTED_BODYWEIGHT_IDS.has(exercise.id)) return 'weight_reps'
  return exercise.equipment === 'bodyweight' ? 'reps' : 'weight_reps'
}

export const MAX_HOLD_SECONDS = 3600

/**
 * "45" → 45 s, "1:30" → 90 s, "1:02:03" → 3723 s. Null for empty or invalid text, seconds above 59
 * after a colon, or a total outside 1 s – 1 h.
 */
export function parseDuration(text: string): number | null {
  const t = text.trim()
  if (!t) return null
  const parts = t.split(':')
  if (parts.length > 3 || parts.some((p) => !/^\d{1,5}$/.test(p))) return null
  const nums = parts.map(Number)
  if (nums.slice(1).some((n) => n > 59)) return null
  const total = nums.reduce((sum, n) => sum * 60 + n, 0)
  return total >= 1 && total <= MAX_HOLD_SECONDS ? total : null
}

/** 45 → "0:45", 90 → "1:30". */
export const formatHold = (seconds: number) => formatClock(seconds)

type SetLike = { weight_kg: number; reps: number; duration_seconds?: number | null }

/**
 * One set as text: "80 kg × 8", "12 reps" or "1:30". Rows saved before an exercise became reps-only
 * or timed still read sensibly (reps shown when there's no time).
 */
export function formatSetText(s: SetLike, tracking: Tracking, unit: WeightUnit, bodyweightLabel = 'BW') {
  const reps = `${s.reps} ${s.reps === 1 ? 'rep' : 'reps'}`
  if (tracking === 'time') return s.duration_seconds ? formatHold(s.duration_seconds) : reps
  if (tracking === 'reps') return reps
  return `${s.weight_kg ? formatWeight(s.weight_kg, unit) : bodyweightLabel} × ${s.reps}`
}
