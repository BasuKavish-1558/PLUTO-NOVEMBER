import { motion } from 'motion/react'
import { formatWeight, type WeightUnit } from '@/domain/units'
import { formatDuration, type WorkoutSummary } from '@/domain/workoutStats'
import { spring } from '@/lib/motion'

/** WK-7: duration, exercises, working sets, volume (warm-ups excluded). */
export function SummaryStats({ summary, unit, animate = false }: { summary: WorkoutSummary; unit: WeightUnit; animate?: boolean }) {
  const stats = [
    { label: 'Duration', value: formatDuration(summary.durationSeconds) },
    { label: 'Exercises', value: String(summary.exerciseCount) },
    { label: 'Sets', value: String(summary.setCount), note: summary.warmupCount ? `+${summary.warmupCount} warm-up` : undefined },
    { label: 'Volume', value: formatWeight(summary.volumeKg, unit) },
  ]
  return (
    <dl className="grid grid-cols-2 gap-3">
      {stats.map((s, i) => (
        <motion.div
          key={s.label}
          initial={animate ? { opacity: 0, y: 12, scale: 0.96 } : false}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ ...spring, delay: animate ? i * 0.06 : 0 }}
          className="rounded-xl bg-muted/60 px-4 py-3"
        >
          <dt className="text-sm text-muted-foreground">{s.label}</dt>
          <dd className="mt-0.5 text-lg font-semibold tabular-nums">{s.value}</dd>
          {s.note && <dd className="text-xs text-muted-foreground">{s.note}</dd>}
        </motion.div>
      ))}
    </dl>
  )
}
