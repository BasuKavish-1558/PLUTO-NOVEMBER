import { motion } from 'motion/react'
import { formatDuration, type WorkoutSummary } from '@/domain/workoutStats'
import { spring } from '@/lib/motion'

/** Workout summary: duration, exercises, working sets (warm-ups noted separately). */
export function SummaryStats({ summary, animate = false }: { summary: WorkoutSummary; animate?: boolean }) {
  const stats = [
    { label: 'Duration', value: formatDuration(summary.durationSeconds) },
    { label: 'Exercises', value: String(summary.exerciseCount) },
    { label: 'Sets', value: String(summary.setCount), note: summary.warmupCount ? `+${summary.warmupCount} warm-up` : undefined },
  ]
  return (
    <dl className="grid grid-cols-3 gap-2">
      {stats.map((s, i) => (
        <motion.div
          key={s.label}
          initial={animate ? { opacity: 0, y: 12, scale: 0.96 } : false}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ ...spring, delay: animate ? i * 0.06 : 0 }}
          className="rounded-xl bg-muted/60 px-3 py-3"
        >
          <dt className="text-sm text-muted-foreground">{s.label}</dt>
          <dd className="mt-0.5 text-lg font-semibold tabular-nums">{s.value}</dd>
          {s.note && <dd className="text-xs text-muted-foreground">{s.note}</dd>}
        </motion.div>
      ))}
    </dl>
  )
}
