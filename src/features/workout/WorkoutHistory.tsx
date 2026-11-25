import { ChevronRight, History } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { EmptyState } from '@/components/layout/EmptyState'
import { Button } from '@/components/ui/button'
import { parseLocalDate } from '@/domain/dates'
import { formatWeight } from '@/domain/units'
import { formatDuration } from '@/domain/workoutStats'
import { useProfile } from '@/features/profile/queries'
import { useWorkoutHistory } from './queries'
import { PageSkeleton } from '@/components/ui/skeleton'

const PAGE = 20

export function WorkoutHistory() {
  const history = useWorkoutHistory()
  const unit = useProfile()?.weight_unit ?? 'kg'
  const [limit, setLimit] = useState(PAGE)
  if (!history) return <PageSkeleton cards={1} />
  if (!history.length) {
    return (
      <EmptyState icon={History} title="No workouts yet">
        Finished workouts show up here. Tap one to see it, edit it or delete it.
      </EmptyState>
    )
  }

  return (
    <section className="space-y-2">
      <h2 className="px-1 text-sm font-semibold">History</h2>
      <ul className="divide-y overflow-hidden rounded-xl border bg-card">
        {history.slice(0, limit).map(({ workout, summary }) => (
          <li key={workout.id}>
            <Link to={`/workout/${workout.id}`} className="flex min-h-16 items-center gap-3 px-5 py-3 transition-colors hover:bg-muted/50 active:bg-muted">
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{workout.title || 'Workout'}</span>
                <span className="block text-sm text-muted-foreground tabular-nums">
                  {parseLocalDate(workout.local_date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                  {' · '}
                  {formatDuration(workout.duration_seconds)} · {summary.setCount} sets · {formatWeight(summary.volumeKg, unit)}
                </span>
              </span>
              <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
            </Link>
          </li>
        ))}
      </ul>
      {history.length > limit && (
        <Button variant="ghost" className="w-full text-muted-foreground" onClick={() => setLimit((n) => n + PAGE)}>
          Show more
        </Button>
      )}
    </section>
  )
}
