import { SearchX } from 'lucide-react'
import type { ReactNode } from 'react'
import { equipmentLabel, groupByMuscle, type Exercise } from '@/domain/library'
import { cn } from '@/lib/utils'

type Props = {
  exercises: readonly Exercise[]
  onSelect: (exercise: Exercise) => void
  trailing?: (exercise: Exercise) => ReactNode
  selectLabel?: (exercise: Exercise) => string
}

/** Exercises in muscle-group sections (EL-1). */
export function ExerciseList({ exercises, onSelect, trailing, selectLabel }: Props) {
  if (!exercises.length) {
    return (
      <div className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground">
        <SearchX className="size-8" />
        <p className="text-sm">No exercises match. Try another search or filter.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {groupByMuscle(exercises).map(({ group, exercises: items }) => (
        <section key={group.id} aria-labelledby={`group-${group.slug}`}>
          <h2 id={`group-${group.slug}`} className="mb-2 flex items-baseline justify-between px-1 text-sm font-semibold">
            {group.name}
            <span className="font-normal text-muted-foreground tabular-nums">{items.length}</span>
          </h2>
          <ul className="divide-y overflow-hidden rounded-xl border bg-card">
            {items.map((e) => (
              <li key={e.id}>
                <button
                  type="button"
                  onClick={() => onSelect(e)}
                  aria-label={selectLabel?.(e)}
                  className="flex min-h-14 w-full items-center gap-3 px-4 py-2 text-left transition-colors hover:bg-muted/50 active:bg-muted"
                >
                  <span className="min-w-0 flex-1">
                    <span className={cn('block truncate', e.archived_at && 'text-muted-foreground line-through')}>{e.name}</span>
                    <span className="block text-sm text-muted-foreground">
                      {equipmentLabel(e.equipment)}
                      {e.user_id && ' · Custom'}
                      {e.archived_at && ' · Archived'}
                    </span>
                  </span>
                  {trailing?.(e)}
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
