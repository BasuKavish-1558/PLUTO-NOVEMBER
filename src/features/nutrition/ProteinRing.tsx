import { motion } from 'motion/react'

type Props = { consumed: number; goal: number; size?: number }

/** NT-3: animated ring of grams consumed vs goal. */
export function ProteinRing({ consumed, goal, size = 200 }: Props) {
  const stroke = 14
  const r = (size - stroke) / 2
  const progress = goal > 0 ? Math.min(consumed / goal, 1) : 0

  return (
    <div
      className="relative"
      style={{ width: size, height: size }}
      role="img"
      aria-label={goal > 0 ? `${Math.round(consumed)} of ${Math.round(goal)} grams of protein` : `${Math.round(consumed)} grams of protein`}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-cell" />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          className="stroke-primary"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: progress }}
          transition={{ type: 'spring', stiffness: 60, damping: 18 }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <p className="text-4xl font-semibold tabular-nums tracking-tight">{Math.round(consumed)}</p>
          <p className="text-sm text-muted-foreground">{goal > 0 ? `of ${Math.round(goal)} g` : 'g today'}</p>
        </div>
      </div>
    </div>
  )
}
