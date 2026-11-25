import { Trophy } from 'lucide-react'
import { motion } from 'motion/react'
import { Link } from 'react-router'
import type { LocalDate } from '@/domain/dates'
import type { WeightUnit } from '@/domain/units'
import { useExerciseMap } from '@/features/library/queries'
import { useProtein } from '@/features/nutrition/queries'
import { usePrs } from '@/features/progress/queries'
import { prTitle, prValue } from '@/features/prs/prText'
import { spring } from '@/lib/motion'

/** Protein for the day: total against that day's goal, plus its entries. */
export function DayProtein({ date }: { date: LocalDate }) {
  const protein = useProtein(date)
  if (!protein) return null
  const { total, goal, todayEntries: entries } = protein
  const ratio = goal ? Math.min(total / goal.grams, 1) : 0

  return (
    <section className="space-y-2">
      <h3 className="flex items-baseline justify-between text-sm font-semibold">
        Protein
        <span className="font-normal text-muted-foreground tabular-nums">
          {total} g{goal ? ` of ${goal.grams} g` : ''}
        </span>
      </h3>
      {goal && (
        <div className="h-2 overflow-hidden rounded-full bg-cell" role="img" aria-label={`${total} of ${goal.grams} grams of protein`}>
          <motion.div className="h-full rounded-full bg-primary" initial={{ width: 0 }} animate={{ width: `${ratio * 100}%` }} transition={spring} />
        </div>
      )}
      {entries.length ? (
        <ul className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted-foreground tabular-nums">
          {entries.map((e) => (
            <li key={e.id}>
              {e.label ? `${e.label} · ` : ''}
              {e.amount} g
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">No protein logged.</p>
      )}
    </section>
  )
}

/** PRs logged on the day (CL-3), wherever they were logged from. */
export function DayPrs({ date, unit }: { date: LocalDate; unit: WeightUnit }) {
  const prs = (usePrs() ?? []).filter((p) => p.local_date === date)
  const exercises = useExerciseMap()
  if (!prs.length) return null

  return (
    <section className="space-y-2">
      <h3 className="text-sm font-semibold">Personal records</h3>
      <ul className="space-y-1.5">
        {prs.map((pr) => (
          <li key={pr.id}>
            <Link to={`/progress?exercise=${pr.exercise_id}`} className="flex min-h-11 items-center gap-2 text-sm">
              <Trophy className="size-4 shrink-0 text-primary" />
              <span className="font-medium">{exercises.get(pr.exercise_id)?.name ?? 'Exercise'}</span>
              <span className="text-muted-foreground tabular-nums">
                {prValue(pr, unit)} · {prTitle(pr, unit)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
