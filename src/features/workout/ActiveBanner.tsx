import { ChevronRight, Timer } from 'lucide-react'
import { motion } from 'motion/react'
import { Link } from 'react-router'
import { elapsedMs, loggedSetCount } from '@/domain/workoutSession'
import { formatClock } from '@/domain/workoutStats'
import { spring } from '@/lib/motion'
import { useActiveWorkout } from '@/stores/activeWorkout'
import { useNow } from './queries'

/** WK-9: a workout survives closing the app; this is the way back in. */
export function ActiveBanner() {
  const workout = useActiveWorkout((s) => s.workout)
  const now = useNow(!!workout && workout.timer.pausedAt === null)
  if (!workout) return null

  return (
    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={spring}>
      <Link
        to="/workout/live"
        className="flex min-h-16 items-center gap-4 rounded-xl bg-primary px-5 py-3 text-primary-foreground transition-transform active:scale-[0.98] motion-reduce:active:scale-100"
      >
        <Timer className="size-6 shrink-0" />
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold">{workout.title || 'Workout'} in progress</span>
          <span className="block text-sm tabular-nums">
            {formatClock(elapsedMs(workout.timer, now) / 1000)}
            {workout.timer.pausedAt !== null && ' · paused'} · {loggedSetCount(workout)} set{loggedSetCount(workout) === 1 ? '' : 's'} logged
          </span>
        </span>
        <span className="flex items-center gap-1 text-sm font-medium">
          Resume <ChevronRight className="size-5" />
        </span>
      </Link>
    </motion.div>
  )
}
