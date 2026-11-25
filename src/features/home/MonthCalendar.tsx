import { ChevronLeft, ChevronRight } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { addMonths, compareYearMonth, monthGrid, type LocalDate, type YearMonth } from '@/domain/dates'
import { quick } from '@/lib/motion'
import { DayCell } from './DayCell'

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

type Props = {
  month: YearMonth
  onMonthChange: (m: YearMonth) => void
  today: LocalDate
  workedDays: Set<LocalDate>
  onSelectDay: (d: LocalDate) => void
}

export function MonthCalendar({ month, onMonthChange, today, workedDays, onSelectDay }: Props) {
  const [direction, setDirection] = useState(0)
  const [ty, tm] = today.split('-').map(Number) as [number, number]
  const isCurrentMonth = compareYearMonth(month, { year: ty, month: tm - 1 }) >= 0
  const label = new Date(month.year, month.month).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })

  const go = (n: number) => {
    setDirection(n)
    onMonthChange(addMonths(month, n))
  }

  return (
    <Card className="overflow-hidden p-3 sm:p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold" aria-live="polite">
          {label}
        </h2>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={() => go(-1)} aria-label="Previous month">
            <ChevronLeft className="size-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => go(1)} disabled={isCurrentMonth} aria-label="Next month">
            <ChevronRight className="size-5" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1.5 pb-2 text-center text-xs font-medium text-muted-foreground sm:gap-2">
        {WEEKDAYS.map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </div>

      <AnimatePresence mode="popLayout" initial={false} custom={direction}>
        <motion.div
          key={`${month.year}-${month.month}`}
          custom={direction}
          variants={{
            enter: (dir: number) => ({ x: dir * 32, opacity: 0 }),
            center: { x: 0, opacity: 1 },
            exit: (dir: number) => ({ x: dir * -32, opacity: 0 }),
          }}
          initial="enter"
          animate="center"
          exit="exit"
          transition={quick}
          className="grid grid-cols-7 gap-1.5 sm:gap-2"
        >
          {monthGrid(month).map((date, i) =>
            date ? (
              <DayCell
                key={date}
                date={date}
                index={i}
                worked={workedDays.has(date)}
                isToday={date === today}
                isFuture={date > today}
                onSelect={onSelectDay}
              />
            ) : (
              <span key={`pad-${i}`} aria-hidden />
            ),
          )}
        </motion.div>
      </AnimatePresence>

      <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="size-3 rounded-sm bg-primary" /> Workout
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-3 rounded-sm bg-cell" /> No workout
        </span>
      </div>
    </Card>
  )
}
