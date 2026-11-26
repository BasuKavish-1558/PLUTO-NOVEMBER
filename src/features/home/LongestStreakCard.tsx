import { Trophy } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { formatDateRange } from '@/domain/dates'
import type { LongestStreak } from '@/domain/streak'
import { cn } from '@/lib/utils'

type Props = { longest: LongestStreak; isCurrent: boolean }

/** The best streak ever, with when it started and ended. */
export function LongestStreakCard({ longest, isCurrent }: Props) {
  return (
    <Card className="flex items-center gap-4 p-4">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-muted">
        <Trophy className={cn('size-5', isCurrent ? 'text-primary' : 'text-muted-foreground')} aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-muted-foreground">Longest streak</p>
        <p className="text-2xl font-semibold tracking-tight tabular-nums">
          {longest.length} {longest.length === 1 ? 'day' : 'days'}
        </p>
        <p className="text-sm text-muted-foreground">{formatDateRange(longest.start, longest.end)}</p>
      </div>
      {isCurrent && (
        <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary-ink">Current</span>
      )}
    </Card>
  )
}
