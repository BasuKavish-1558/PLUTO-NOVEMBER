import { Check } from 'lucide-react'
import { motion } from 'motion/react'
import { useState } from 'react'
import { formatHold, parseDuration, type Tracking } from '@/domain/tracking'
import { toDisplayWeight, toStoredWeight, weightLabel, type WeightUnit } from '@/domain/units'
import type { PreviousSet, SessionSet } from '@/domain/workoutSession'
import { spring } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { setGrid } from './setGrid'

type Patch = Partial<Pick<SessionSet, 'weightKg' | 'reps' | 'durationSeconds'>>

type Props = {
  set: SessionSet
  tracking: Tracking
  label: string // "1", "2", or "W"
  previous?: PreviousSet
  unit: WeightUnit
  showCheck: boolean
  onPatch: (patch: Patch) => void
  onToggle: () => void
  onOptions: () => void
}

const weightText = (kg: number | null, unit: WeightUnit) => (kg === null ? '' : String(toDisplayWeight(kg, unit)))
const repsText = (reps: number | null) => (reps === null ? '' : String(reps))
const timeText = (seconds: number | null) => (seconds === null ? '' : formatHold(seconds))

/** null for empty or invalid text; kg otherwise. */
function parseWeight(text: string, unit: WeightUnit) {
  const n = Number(text.replace(',', '.'))
  return text.trim() === '' || !Number.isFinite(n) || n < 0 ? null : toStoredWeight(n, unit)
}

function parseReps(text: string) {
  const n = Number(text)
  return text.trim() !== '' && Number.isInteger(n) && n > 0 ? n : null
}

const inputClass =
  'h-11 w-full min-w-0 rounded-lg border bg-background text-center text-base tabular-nums outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-input/30'

/**
 * One set: tap ✓ on the pre-filled row to log it (≤ 2 taps). Tap the set number for warm-up/delete.
 * Shows only what the exercise is measured by: weight and reps, reps only (bodyweight), or time.
 */
export function SetRow({ set, tracking, label, previous, unit, showCheck, onPatch, onToggle, onOptions }: Props) {
  // Local text keeps half-typed input like "82." or "1:" intact; the store only gets parsed values.
  const [weight, setWeight] = useState(() => weightText(set.weightKg, unit))
  const [reps, setReps] = useState(() => repsText(set.reps))
  const [time, setTime] = useState(() => timeText(set.durationSeconds))
  // Values can also change from outside (filled from the row above, unit switch): resync the text
  // unless it already means the same value, so typing "82." isn't rewritten to "82".
  const [seen, setSeen] = useState({ kg: set.weightKg, reps: set.reps, seconds: set.durationSeconds, unit })
  if (seen.kg !== set.weightKg || seen.reps !== set.reps || seen.seconds !== set.durationSeconds || seen.unit !== unit) {
    setSeen({ kg: set.weightKg, reps: set.reps, seconds: set.durationSeconds, unit })
    if (parseWeight(weight, unit) !== set.weightKg || seen.unit !== unit) setWeight(weightText(set.weightKg, unit))
    if (parseReps(reps) !== set.reps) setReps(repsText(set.reps))
    if (parseDuration(time) !== set.durationSeconds) setTime(timeText(set.durationSeconds))
  }
  const done = showCheck && set.done
  // Last session's numbers show as placeholders in empty boxes (no separate column).
  const weightHint = previous?.weightKg ? String(toDisplayWeight(previous.weightKg, unit)) : weightLabel(unit)
  const repsHint = previous && previous.reps > 0 && tracking !== 'time' ? String(previous.reps) : 'reps'
  const timeHint = previous?.durationSeconds ? formatHold(previous.durationSeconds) : 'm:ss'

  function changeWeight(text: string) {
    setWeight(text)
    const kg = parseWeight(text, unit)
    if (kg !== null || text.trim() === '') onPatch({ weightKg: kg })
  }

  function changeReps(text: string) {
    setReps(text)
    onPatch({ reps: parseReps(text) })
  }

  function changeTime(text: string) {
    setTime(text)
    onPatch({ durationSeconds: parseDuration(text) })
  }

  return (
    <div className={cn('grid items-center gap-1.5 rounded-lg px-1 py-1 transition-colors', setGrid(tracking, showCheck), done && 'bg-primary/10')}>
      <button
        type="button"
        onClick={onOptions}
        aria-label={`Set ${label === 'W' ? 'warm-up' : label} options`}
        className={cn('h-11 rounded-lg text-sm font-semibold', set.isWarmup ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground')}
      >
        {label}
      </button>
      {tracking === 'weight_reps' && (
        <input
          aria-label={`Weight (${weightLabel(unit)})`}
          inputMode="decimal"
          placeholder={weightHint}
          value={weight}
          onChange={(e) => changeWeight(e.target.value)}
          className={inputClass}
        />
      )}
      {tracking !== 'time' && (
        <input aria-label="Reps" inputMode="numeric" placeholder={repsHint} value={reps} onChange={(e) => changeReps(e.target.value)} className={inputClass} />
      )}
      {tracking === 'time' && (
        <input
          aria-label="Time (m:ss)"
          // A plain number is seconds, "1:30" is a minute and a half. The numeric pad has no colon on some phones.
          inputMode="text"
          autoComplete="off"
          placeholder={timeHint}
          value={time}
          onChange={(e) => changeTime(e.target.value)}
          className={inputClass}
        />
      )}
      {showCheck && (
        <motion.button
          type="button"
          onClick={onToggle}
          aria-label={set.done ? 'Undo set' : 'Log set'}
          aria-pressed={set.done}
          whileTap={{ scale: 0.88 }}
          transition={spring}
          className={cn(
            'grid size-11 place-items-center rounded-lg border transition-colors',
            set.done ? 'border-primary bg-primary text-primary-foreground' : 'text-muted-foreground',
          )}
        >
          <motion.span key={String(set.done)} initial={{ scale: set.done ? 0.4 : 1 }} animate={{ scale: 1 }} transition={spring}>
            <Check className="size-5" />
          </motion.span>
        </motion.button>
      )}
    </div>
  )
}
