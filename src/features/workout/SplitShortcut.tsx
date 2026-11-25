import { BookOpen, ChevronRight, Layers } from 'lucide-react'
import { Link } from 'react-router'
import { trainingDaysPerWeek } from '@/domain/split'
import { LIBRARY_PATH, SPLIT_PATH } from '@/features/split/paths'
import { useActiveSplit } from '@/features/split/queries'

const row =
  'flex min-h-16 items-center gap-4 px-5 py-3 transition-colors hover:bg-muted/50 active:bg-muted'

/** Split is a sub-section of Workout: the weekly routine and the exercise library live here. */
export function SplitShortcut() {
  const active = useActiveSplit()

  return (
    <section className="space-y-2">
      <h2 className="px-1 text-sm font-semibold">Plan</h2>
      <div className="divide-y overflow-hidden rounded-xl border bg-card">
        <Link to={SPLIT_PATH} className={row}>
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-muted">
            <Layers className="size-5 text-primary" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-medium">Your split</span>
            <span className="block truncate text-sm text-muted-foreground">
              {active === undefined
                ? ' ' // keeps the row's height while loading
                : active
                  ? `${active.split.name} · ${trainingDaysPerWeek(active.days)} days a week`
                  : 'Pick a preset or build your own'}
            </span>
          </span>
          <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
        </Link>
        <Link to={LIBRARY_PATH} className={row}>
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-muted">
            <BookOpen className="size-5 text-primary" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-medium">Exercise library</span>
            <span className="block text-sm text-muted-foreground">Browse, search and add your own</span>
          </span>
          <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
        </Link>
      </div>
    </section>
  )
}
