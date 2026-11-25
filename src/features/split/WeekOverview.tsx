import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router'
import { isoWeekday, toLocalDate } from '@/domain/dates'
import { cn } from '@/lib/utils'
import type { SplitDetail } from './queries'
import { dayTitle, WEEKDAYS } from './splitText'
import { dayPath } from '@/features/split/paths'

/** Mon–Sun rows, today highlighted; each opens that day's editor. */
export function WeekOverview({ detail }: { detail: SplitDetail }) {
  const today = isoWeekday(toLocalDate(new Date()))

  return (
    <ul className="divide-y">
      {detail.days.map((d) => {
        const isToday = d.weekday === today
        return (
          <li key={d.id}>
            <Link
              to={dayPath(detail.split.id, d.weekday)}
              className="flex min-h-14 items-center gap-4 px-5 py-2 transition-colors hover:bg-muted/50 active:bg-muted"
            >
              <span className={cn('w-10 text-sm font-medium', isToday ? 'text-primary' : 'text-muted-foreground')}>
                {WEEKDAYS[d.weekday - 1]!.slice(0, 3)}
              </span>
              <span className="min-w-0 flex-1">
                <span className={cn('block truncate', d.is_rest && 'text-muted-foreground')}>{dayTitle(d)}</span>
                {!d.is_rest && (
                  <span className="block text-sm text-muted-foreground">
                    {d.items.length ? `${d.items.length} exercise${d.items.length === 1 ? '' : 's'}` : 'No exercises yet'}
                  </span>
                )}
              </span>
              {isToday && <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary-ink">Today</span>}
              <ChevronRight className="size-5 text-muted-foreground" />
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
