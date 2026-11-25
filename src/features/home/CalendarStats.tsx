import { CalendarCheck, Flame, type LucideIcon } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { Card } from '@/components/ui/card'
import type { YearMonth } from '@/domain/dates'
import type { Streak } from '@/domain/streak'
import { spring } from '@/lib/motion'
import { cn } from '@/lib/utils'

const streakCaption: Record<Streak['status'], string> = {
  active: 'Trained today',
  resting: 'Rest day · streak safe',
  at_risk: 'Train today to keep it',
  none: 'Log a workout to start one',
}

type Props = { streak: Streak; monthCount: number; month: YearMonth }

export function CalendarStats({ streak, monthCount, month }: Props) {
  const monthName = new Date(month.year, month.month).toLocaleDateString(undefined, { month: 'long' })

  return (
    <div className="grid grid-cols-2 gap-3">
      <Stat
        icon={Flame}
        highlight={streak.status === 'active' || streak.status === 'resting'}
        value={streak.length}
        label="day streak"
        caption={streakCaption[streak.status]}
      />
      <Stat
        icon={CalendarCheck}
        value={monthCount}
        label={monthCount === 1 ? 'workout' : 'workouts'}
        caption={`in ${monthName}`}
      />
    </div>
  )
}

type StatProps = { icon: LucideIcon; value: number; label: string; caption: string; highlight?: boolean }

function Stat({ icon: Icon, value, label, caption, highlight }: StatProps) {
  return (
    <Card className="p-4">
      <Icon className={cn('size-5', highlight ? 'text-primary' : 'text-muted-foreground')} />
      <div className="mt-3 flex items-baseline gap-1.5">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={value}
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -10, opacity: 0 }}
            transition={spring}
            className="text-3xl font-semibold tabular-nums tracking-tight"
          >
            {value}
          </motion.span>
        </AnimatePresence>
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{caption}</p>
    </Card>
  )
}
