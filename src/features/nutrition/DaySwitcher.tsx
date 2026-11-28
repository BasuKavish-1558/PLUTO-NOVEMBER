import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { useRef } from 'react'
import { Button } from '@/components/ui/button'
import { addDays, type LocalDate } from '@/domain/dates'
import { dayLabel } from './dayLabel'

type Props = { day: LocalDate; today: LocalDate; onChange: (day: LocalDate) => void }

/** Step back to a day you forgot to log, or jump to one with the date picker. Never past today. */
export function DaySwitcher({ day, today, onChange }: Props) {
  const picker = useRef<HTMLInputElement>(null)
  const isToday = day === today

  function openPicker() {
    const input = picker.current
    if (!input) return
    try {
      input.showPicker()
    } catch {
      input.focus() // older browsers: the focused date input opens on tap
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="icon" aria-label="Previous day" onClick={() => onChange(addDays(day, -1))}>
        <ChevronLeft />
      </Button>
      <div className="relative flex-1">
        <button
          type="button"
          onClick={openPicker}
          aria-label={`${dayLabel(day, today)}, pick a day`}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-lg text-sm font-semibold hover:bg-muted/50 active:bg-muted"
        >
          <CalendarDays className="size-4 text-muted-foreground" />
          {dayLabel(day, today)}
        </button>
        {/* The native picker (it anchors under the button); only the button above is interactive. */}
        <input
          ref={picker}
          type="date"
          tabIndex={-1}
          aria-hidden
          max={today}
          value={day}
          onChange={(e) => e.target.value && onChange(e.target.value > today ? today : e.target.value)}
          className="pointer-events-none absolute inset-x-0 bottom-0 h-0 opacity-0"
        />
      </div>
      {!isToday && (
        <Button variant="ghost" size="sm" onClick={() => onChange(today)}>
          Today
        </Button>
      )}
      <Button variant="outline" size="icon" aria-label="Next day" disabled={isToday} onClick={() => onChange(addDays(day, 1))}>
        <ChevronRight />
      </Button>
    </div>
  )
}
