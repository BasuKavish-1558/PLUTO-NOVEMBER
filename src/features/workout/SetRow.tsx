import { Check } from 'lucide-react'
import { motion } from 'motion/react'
import { useState } from 'react'
import { toDisplayWeight, toStoredWeight, weightLabel, type WeightUnit } from '@/domain/units'
import type { PreviousSet, SessionSet } from '@/domain/workoutSession'
import { spring } from '@/lib/motion'
import { cn } from '@/lib/utils'

type Props = {
  set: SessionSet
  label: string // "1", "2", or "W"
  previous?: PreviousSet
  unit: WeightUnit
  showCheck: boolean
  onPatch: (patch: Partial<Pick<SessionSet, 'weightKg' | 'reps'>>) => void
  onToggle: () => void
  onOptions: () => void
}

const weightText = (kg: number | null, unit: WeightUnit) => (kg === null ? '' : String(toDisplayWeight(kg, unit)))

/** null for empty or invalid text; kg otherwise. */
function parseWeight(text: string, unit: WeightUnit) {
  const n = Number(text.replace(',', '.'))
  return text.trim() === '' || !Number.isFinite(n) || n < 0 ? null : toStoredWeight(n, unit)
}

function parseReps(text: string) {
  const n = Number(text)
  return text.trim() !== '' && Number.isInteger(n) && n > 0 ? n : null
}

/** One set: tap ✓ on the pre-filled row to log it (≤ 2 taps). Tap the set number for warm-up/delete. */
export function SetRow({ set, label, previous, unit, showCheck, onPatch, onToggle, onOptions }: Props) {
  // Local text keeps half-typed input like "82." intact; the store only gets parsed values.
  const [weight, setWeight] = useState(() => weightText(set.weightKg, unit))
  const [reps, setReps] = useState(() => (set.reps === null ? '' : String(set.reps)))
  // Values can also change from outside (filled from the row above, unit switch): resync the text
  // unless it already means the same number, so typing "82." isn't rewritten to "82".
  const [seen, setSeen] = useState({ kg: set.weightKg, reps: set.reps, unit })
  if (seen.kg !== set.weightKg || seen.reps !== set.reps || seen.unit !== unit) {
    setSeen({ kg: set.weightKg, reps: set.reps, unit })
    if (parseWeight(weight, unit) !== set.weightKg || seen.unit !== unit) setWeight(weightText(set.weightKg, unit))
    if (parseReps(reps) !== set.reps) setReps(set.reps === null ? '' : String(set.reps))
  }
  const done = showCheck && set.done
  const prevText = previous ? `${previous.weightKg ? toDisplayWeight(previous.weightKg, unit) : 'BW'} × ${previous.reps}` : '—'

  function changeWeight(text: string) {
    setWeight(text)
    const kg = parseWeight(text, unit)
    if (kg !== null || text.trim() === '') onPatch({ weightKg: kg })
  }

  function changeReps(text: string) {
    setReps(text)
    onPatch({ reps: parseReps(text) })
  }

  const input =
    'h-11 w-full min-w-0 rounded-lg border bg-background text-center text-base tabular-nums outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-input/30'

  return (
    <div
      className={cn(
        'grid items-center gap-1.5 rounded-lg px-1 py-1 transition-colors',
        showCheck ? 'grid-cols-[2.75rem_minmax(0,1fr)_minmax(3.25rem,4.5rem)_minmax(2.75rem,3.75rem)_2.75rem]' : 'grid-cols-[2.75rem_minmax(0,1fr)_minmax(3.25rem,4.5rem)_minmax(2.75rem,3.75rem)]',
        done && 'bg-primary/10',
      )}
    >
      <button
        type="button"
        onClick={onOptions}
        aria-label={`Set ${label === 'W' ? 'warm-up' : label} options`}
        className={cn('h-11 rounded-lg text-sm font-semibold', set.isWarmup ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground')}
      >
        {label}
      </button>
      <span className="truncate text-sm text-muted-foreground tabular-nums">{prevText}</span>
      <input
        aria-label={`Weight (${weightLabel(unit)})`}
        inputMode="decimal"
        placeholder={weightLabel(unit)}
        value={weight}
        onChange={(e) => changeWeight(e.target.value)}
        className={input}
      />
      <input
        aria-label="Reps"
        inputMode="numeric"
        placeholder="reps"
        value={reps}
        onChange={(e) => changeReps(e.target.value)}
        className={input}
      />
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
