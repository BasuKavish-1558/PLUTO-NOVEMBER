import { ChevronRight, Pencil } from 'lucide-react'
import { motion } from 'motion/react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import type { LocalDate } from '@/domain/dates'
import { parseLocalDate } from '@/domain/dates'
import { spring } from '@/lib/motion'
import { cn } from '@/lib/utils'

type Day = { date: LocalDate; total: number; goal: number | null }
type Props = { days: Day[]; selected: LocalDate; onSelect: (date: LocalDate) => void; onEdit: () => void }

const PAGE = 14
const label = (date: string) => parseLocalDate(date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })

/**
 * NT-4: past days are kept; tap one to open it above and add, remove or change its entries and goal.
 * Edit logs a day that was missed entirely (it isn't listed, having no entries).
 */
export function NutritionHistory({ days, selected, onSelect, onEdit }: Props) {
  const [limit, setLimit] = useState(PAGE)

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-sm font-semibold">History</h2>
        <Button variant="ghost" size="sm" onClick={onEdit}>
          <Pencil /> Edit<span className="sr-only"> history: log a missed day</span>
        </Button>
      </div>
      {!days.length && <p className="px-1 text-sm text-muted-foreground">No past days yet. Forgot one? Tap Edit to log it.</p>}
      {days.length > 0 && <ul className="divide-y overflow-hidden rounded-xl border bg-card">
        {days.slice(0, limit).map((d) => {
          const ratio = d.goal ? Math.min(d.total / d.goal, 1) : 0
          const current = d.date === selected
          return (
            <li key={d.date}>
              <button
                type="button"
                onClick={() => onSelect(d.date)}
                aria-current={current ? 'date' : undefined}
                className={cn('flex min-h-14 w-full items-center gap-3 px-5 py-2 text-left hover:bg-muted/50 active:bg-muted', current && 'bg-primary/10')}
              >
                <span className="w-24 shrink-0 text-sm">{label(d.date)}</span>
                <span className="h-2 flex-1 overflow-hidden rounded-full bg-cell">
                  <motion.span className="block h-full rounded-full bg-primary" initial={{ width: 0 }} animate={{ width: `${ratio * 100}%` }} transition={spring} />
                </span>
                <span className="w-24 shrink-0 text-right text-sm tabular-nums text-muted-foreground">
                  {d.total}
                  {d.goal ? ` / ${d.goal}` : ''} g
                </span>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
              </button>
            </li>
          )
        })}
      </ul>}
      {days.length > limit && (
        <Button variant="ghost" className="w-full text-muted-foreground" onClick={() => setLimit((n) => n + PAGE)}>
          Show more
        </Button>
      )}
    </section>
  )
}
