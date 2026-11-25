import { addDays, isInMonth, isoWeekday, type LocalDate, type YearMonth } from './dates'

export type Streak = {
  /** Days with a workout in the current run (rest days bridge it but don't add to it). */
  length: number
  /**
   * active: worked out today · resting: today is a scheduled rest day ·
   * at_risk: today is a training day with no workout yet · none: no streak
   */
  status: 'active' | 'resting' | 'at_risk' | 'none'
}

/**
 * Consecutive local days with a workout, where scheduled rest days (ISO weekdays of the active
 * split) neither break nor extend the run. Today stays open until it ends, so a streak only breaks
 * once a whole training day has passed without a workout (PLAN A4/A5). A workout on a rest day counts.
 */
export function computeStreak(
  workoutDates: Iterable<LocalDate>,
  today: LocalDate,
  restWeekdays: ReadonlySet<number> = new Set(),
): Streak {
  const days = new Set(workoutDates)
  let earliest: LocalDate | null = null
  for (const d of days) if (!earliest || d < earliest) earliest = d
  if (!earliest) return { length: 0, status: 'none' }

  const isRest = (d: LocalDate) => restWeekdays.has(isoWeekday(d))
  let length = days.has(today) ? 1 : 0
  for (let d = addDays(today, -1); d >= earliest; d = addDays(d, -1)) {
    if (days.has(d)) length++
    else if (!isRest(d)) break
  }
  if (!length) return { length: 0, status: 'none' }
  return { length, status: days.has(today) ? 'active' : isRest(today) ? 'resting' : 'at_risk' }
}

/** Number of workouts (not distinct days) whose local date falls in the month. */
export function monthlyWorkoutCount(workoutDates: Iterable<LocalDate>, ym: YearMonth): number {
  let count = 0
  for (const d of workoutDates) if (isInMonth(d, ym)) count++
  return count
}
