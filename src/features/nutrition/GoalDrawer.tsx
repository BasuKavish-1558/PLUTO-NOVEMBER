import { Minus, Plus } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { FormDrawer } from '@/components/layout/FormDrawer'
import { Button } from '@/components/ui/button'
import { Segmented } from '@/components/ui/segmented'
import { setProteinGoal } from '@/data/repos/nutrition'
import { clampMultiplier, GOAL_PRESETS, MULTIPLIER_RANGE, type GoalType, type ProteinGoal } from '@/domain/nutrition'
import { formatWeight, type WeightUnit } from '@/domain/units'
import { useUser } from '@/stores/session'

type Props = {
  goal: ProteinGoal
  unit: WeightUnit
  /** The day the change takes effect: today, or a past day picked on Nutrition. */
  from: string
  /** "Tue, Nov 24" when backdating; null for today. */
  fromLabel: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const TYPES = [
  { value: 'cut', label: 'Cut' },
  { value: 'maintain', label: 'Maintain' },
  { value: 'bulk', label: 'Bulk' },
] as const

/** NT-5: pick a goal type (pre-fills a multiplier) and adjust the multiplier. Grams are only ever shown. */
export function GoalDrawer({ goal, unit, from, fromLabel, open, onOpenChange }: Props) {
  const { userId } = useUser()
  const [type, setType] = useState<GoalType | null>(goal.goalType)
  const [multiplier, setMultiplier] = useState(goal.multiplier)
  const grams = Math.round(goal.weightKg * multiplier)
  const { min, max, step } = MULTIPLIER_RANGE

  const nudge = (d: number) => setMultiplier((m) => clampMultiplier(m + d))

  async function save() {
    await setProteinGoal(userId, multiplier, type, from)
    toast.success(`Daily goal: ${grams} g${fromLabel ? ` from ${fromLabel}` : ''}`)
    onOpenChange(false)
  }

  return (
    <FormDrawer open={open} onOpenChange={onOpenChange} title="Protein goal" description={fromLabel ? `Applies from ${fromLabel} onward, until a later change.` : 'Your goal follows your body weight.'} submitLabel="Save goal" onSubmit={save}>
      <Segmented
        label="Goal type"
        value={type}
        options={TYPES}
        onChange={(t) => {
          setType(t)
          setMultiplier(GOAL_PRESETS[t])
        }}
      />
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <Button type="button" variant="outline" size="icon" aria-label="Decrease multiplier" disabled={multiplier <= min} onClick={() => nudge(-step)}>
            <Minus />
          </Button>
          <p className="text-center">
            <span className="block text-3xl font-semibold tabular-nums" aria-live="polite">
              {multiplier.toFixed(1)}
            </span>
            <span className="text-sm text-muted-foreground">g per kg of body weight</span>
          </p>
          <Button type="button" variant="outline" size="icon" aria-label="Increase multiplier" disabled={multiplier >= max} onClick={() => nudge(step)}>
            <Plus />
          </Button>
        </div>
        <input
          type="range"
          aria-label="Multiplier"
          min={min}
          max={max}
          step={step}
          value={multiplier}
          onChange={(e) => setMultiplier(clampMultiplier(Number(e.target.value)))}
          className="w-full accent-[var(--primary)]"
        />
      </div>
      <p className="rounded-xl bg-muted/60 px-4 py-3 text-center text-sm">
        {formatWeight(goal.weightKg, unit)} × {multiplier.toFixed(1)} g/kg ={' '}
        <span className="font-semibold tabular-nums">{grams} g a day</span>
      </p>
    </FormDrawer>
  )
}
