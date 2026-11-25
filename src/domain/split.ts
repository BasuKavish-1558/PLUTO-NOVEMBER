import { isoWeekday, type LocalDate } from './dates'

type DayLike = { weekday: number; is_rest: boolean }
type Positioned = { id: string; position: number }
export type Targets = { sets: number | null; repsMin: number | null; repsMax: number | null }

/** SP-7: the active split's day for a local date (one fixed weekly routine). */
export function splitDayFor<T extends DayLike>(days: readonly T[], date: LocalDate): T | null {
  return days.find((d) => d.weekday === isoWeekday(date)) ?? null
}

export const trainingDaysPerWeek = (days: readonly DayLike[]) => days.filter((d) => !d.is_rest).length

export function moveItem<T>(list: readonly T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= list.length || to >= list.length) return [...list]
  const next = [...list]
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item!)
  return next
}

/** Positions 0..n-1 in the new order, returning only rows whose position actually changes. */
export function reorderPatches(items: readonly Positioned[], orderedIds: readonly string[]) {
  const byId = new Map(items.map((i) => [i.id, i]))
  return orderedIds.flatMap((id, position) => {
    const item = byId.get(id)
    return item && item.position !== position ? [{ id, position }] : []
  })
}

export const nextPosition = (items: readonly Positioned[]) => items.reduce((max, i) => Math.max(max, i.position + 1), 0)

/** "3 × 8–12", "3 × 5", "3 sets", "8–12 reps" or "" when no targets are set. */
export function formatTargets({ sets, repsMin, repsMax }: Targets) {
  const reps = repsMin && repsMax && repsMin !== repsMax ? `${repsMin}–${repsMax}` : String(repsMin ?? repsMax ?? '')
  if (sets && reps) return `${sets} × ${reps}`
  if (sets) return `${sets} set${sets === 1 ? '' : 's'}`
  return reps ? `${reps} reps` : ''
}

export const TARGET_LIMITS = { sets: [1, 20], reps: [1, 100] } as const

/** All fields optional; limits mirror the database checks. */
export function validateTargets({ sets, repsMin, repsMax }: Targets) {
  const inRange = (n: number | null, [lo, hi]: readonly [number, number]) => n === null || (Number.isInteger(n) && n >= lo && n <= hi)
  const errors: Partial<Record<'sets' | 'reps', string>> = {}
  if (!inRange(sets, TARGET_LIMITS.sets)) errors.sets = 'Sets must be 1–20'
  if (!inRange(repsMin, TARGET_LIMITS.reps) || !inRange(repsMax, TARGET_LIMITS.reps)) errors.reps = 'Reps must be 1–100'
  else if (repsMin !== null && repsMax !== null && repsMax < repsMin) errors.reps = 'The upper rep target must be at least the lower one'
  return errors
}
