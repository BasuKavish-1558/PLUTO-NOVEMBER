import { useMemo, useState } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import type { LocalDate, YearMonth } from '@/domain/dates'
import { computeStreak, monthlyWorkoutCount } from '@/domain/streak'
import { useActiveSplit } from '@/features/split/queries'
import { useWorkoutDates } from '@/features/workout/queries'
import { useToday } from '@/lib/useToday'
import { CalendarStats } from './CalendarStats'
import { DayLogDrawer } from './DayLogDrawer'
import { MonthCalendar } from './MonthCalendar'

/** Home is the consistency calendar (PLAN A2). */
export function HomePage() {
  const today = useToday()
  const [month, setMonth] = useState<YearMonth>(() => {
    const now = new Date()
    return { year: now.getFullYear(), month: now.getMonth() }
  })
  const [selected, setSelected] = useState<LocalDate | null>(null)

  const loaded = useWorkoutDates()
  const dates = useMemo(() => loaded ?? [], [loaded])
  const workedDays = useMemo(() => new Set(dates), [dates])
  // Rest days of the active split bridge the streak (PLAN A5).
  const active = useActiveSplit()
  const restWeekdays = useMemo(() => new Set(active ? active.days.filter((d) => d.is_rest).map((d) => d.weekday) : []), [active])

  return (
    <div className="space-y-5">
      <PageHeader title="Home" />
      <CalendarStats
        streak={computeStreak(dates, today, restWeekdays)}
        monthCount={monthlyWorkoutCount(dates, month)}
        month={month}
      />
      <MonthCalendar
        month={month}
        onMonthChange={setMonth}
        today={today}
        workedDays={workedDays}
        onSelectDay={setSelected}
      />
      <DayLogDrawer date={selected} onClose={() => setSelected(null)} />
    </div>
  )
}
