import { motion } from 'motion/react'
import { parseLocalDate, type LocalDate } from '@/domain/dates'
import { cn } from '@/lib/utils'

type Props = {
  date: LocalDate
  index: number
  worked: boolean
  isToday: boolean
  isFuture: boolean
  onSelect: (d: LocalDate) => void
}

/** One calendar day. Worked days fill in with a staggered spring (CL-2: binary shading). */
export function DayCell({ date, index, worked, isToday, isFuture, onSelect }: Props) {
  const day = Number(date.slice(8))
  const label = parseLocalDate(date).toLocaleDateString(undefined, { month: 'long', day: 'numeric' })

  return (
    <button
      type="button"
      disabled={isFuture}
      onClick={() => onSelect(date)}
      aria-label={`${label}${worked ? ', workout logged' : ''}`}
      className={cn(
        'relative aspect-square rounded-lg bg-cell text-xs font-medium tabular-nums transition-transform',
        // The hit area reaches halfway into the 6 px gaps: ≥ 44 px on a 360 px phone without overlapping.
        "after:absolute after:-inset-[3px] after:content-['']",
        'active:scale-90 motion-reduce:active:scale-100 disabled:opacity-40',
        isToday && 'ring-2 ring-foreground/70 ring-offset-2 ring-offset-card',
      )}
    >
      {worked && (
        <motion.span
          aria-hidden
          className="absolute inset-0 rounded-lg bg-primary"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 420, damping: 26, delay: 0.1 + index * 0.012 }}
        />
      )}
      <span className={cn('relative', worked ? 'text-primary-foreground' : 'text-muted-foreground')}>{day}</span>
    </button>
  )
}
