import { parseLocalDate, toLocalDate, type LocalDate } from './dates'
import { estimateOneRepMax } from './oneRepMax'
import { workingSets, type StatSet } from './workoutStats'

export const RANGES = ['1M', '3M', '6M', '1Y', 'All'] as const
export type Range = (typeof RANGES)[number]
const MONTHS: Record<Exclude<Range, 'All'>, number> = { '1M': 1, '3M': 3, '6M': 6, '1Y': 12 }

/** First day inside the range, or null for All. Month ends clamp: Mar 31 − 1M = Feb 28/29. */
export function rangeStart(range: Range, today: LocalDate): LocalDate | null {
  if (range === 'All') return null
  const d = parseLocalDate(today)
  const target = new Date(d.getFullYear(), d.getMonth() - MONTHS[range], 1, 12)
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate()
  target.setDate(Math.min(d.getDate(), lastDay))
  return toLocalDate(target)
}

const inRange = (date: LocalDate, start: LocalDate | null, today: LocalDate) => (!start || date >= start) && date <= today

type WorkoutRef = { id: string; local_date: LocalDate; started_at: string }
type ExerciseRef = { id: string; workout_id: string; exercise_id: string }
type SetRef = StatSet & { workout_exercise_id: string; duration_seconds?: number | null }

export type ExercisePoint = {
  date: LocalDate
  workoutId: string
  topWeightKg: number
  e1rmKg: number
  /** Most reps in one working set (the chart for reps-only exercises). */
  topReps: number
  /** Longest hold in one working set, in seconds (the chart for timed exercises). */
  topSeconds: number
}

/**
 * One point per session that has working sets of this exercise (warm-ups never count).
 * Top weight = heaviest working set; est. 1RM = best Epley of any working set; top reps and
 * top seconds are the best single set by reps and by hold time.
 */
export function exerciseSeries(
  exerciseId: string,
  workouts: readonly WorkoutRef[],
  exercises: readonly ExerciseRef[],
  sets: readonly SetRef[],
  range: Range,
  today: LocalDate,
): ExercisePoint[] {
  const start = rangeStart(range, today)
  const refsByWorkout = new Map<string, Set<string>>()
  for (const e of exercises) {
    if (e.exercise_id !== exerciseId) continue
    refsByWorkout.set(e.workout_id, (refsByWorkout.get(e.workout_id) ?? new Set()).add(e.id))
  }
  return [...workouts]
    .filter((w) => refsByWorkout.has(w.id) && inRange(w.local_date, start, today))
    .sort((a, b) => a.started_at.localeCompare(b.started_at))
    .flatMap((w) => {
      const ids = refsByWorkout.get(w.id)!
      const working = workingSets(sets.filter((s) => ids.has(s.workout_exercise_id)))
      if (!working.length) return []
      return [
        {
          date: w.local_date,
          workoutId: w.id,
          topWeightKg: Math.max(...working.map((s) => s.weight_kg)),
          topReps: Math.max(...working.map((s) => s.reps)),
          topSeconds: Math.max(0, ...working.map((s) => s.duration_seconds ?? 0)),
          e1rmKg: Math.round(Math.max(...working.map((s) => estimateOneRepMax(s.weight_kg, s.reps))) * 10) / 10,
        },
      ]
    })
}

type WeightRow = { local_date: LocalDate; measured_at: string; weight_kg: number }

/** One point per day (that day's last weigh-in), oldest first. */
export function bodyweightSeries(entries: readonly WeightRow[], range: Range, today: LocalDate) {
  const start = rangeStart(range, today)
  const byDay = new Map<LocalDate, WeightRow>()
  for (const e of entries) {
    if (!inRange(e.local_date, start, today)) continue
    const current = byDay.get(e.local_date)
    if (!current || e.measured_at > current.measured_at) byDay.set(e.local_date, e)
  }
  return [...byDay.values()].sort((a, b) => a.local_date.localeCompare(b.local_date)).map((e) => ({ date: e.local_date, weightKg: e.weight_kg }))
}

/** Headline numbers for a series: latest, best (highest) and change from the first point. */
export function seriesSummary(values: readonly number[]) {
  if (!values.length) return null
  const latest = values.at(-1)!
  return { latest, best: Math.max(...values), change: Math.round((latest - values[0]!) * 10) / 10 }
}
