import { Trash2 } from 'lucide-react'
import { useState } from 'react'
import { FormDrawer } from '@/components/layout/FormDrawer'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import type { SplitDayExercise } from '@/data/db'
import { removeFromDay, setTargets } from '@/data/repos/splits'
import { validateTargets } from '@/domain/split'

type Props = {
  item: SplitDayExercise
  name: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

const toText = (n: number | null) => (n === null ? '' : String(n))
const toNumber = (s: string) => (s.trim() === '' ? null : Number(s))

/** SP-4: optional target sets and a rep range; also where an exercise is removed from the day. */
export function TargetsDrawer({ item, name, open, onOpenChange }: Props) {
  const [sets, setSets] = useState(toText(item.target_sets))
  const [min, setMin] = useState(toText(item.target_reps_min))
  const [max, setMax] = useState(toText(item.target_reps_max))
  const [errors, setErrors] = useState<ReturnType<typeof validateTargets>>({})

  async function save() {
    const targets = { sets: toNumber(sets), repsMin: toNumber(min), repsMax: toNumber(max) }
    // A single rep value means "exactly this many".
    if (targets.repsMin === null) targets.repsMin = targets.repsMax
    if (targets.repsMax === null) targets.repsMax = targets.repsMin
    const next = validateTargets(targets)
    if (next.sets || next.reps) return setErrors(next)
    await setTargets(item.id, { target_sets: targets.sets, target_reps_min: targets.repsMin, target_reps_max: targets.repsMax })
    onOpenChange(false)
  }

  async function remove() {
    onOpenChange(false)
    await removeFromDay(item.id)
  }

  return (
    <FormDrawer open={open} onOpenChange={onOpenChange} title={name} description="Targets are optional." submitLabel="Save" onSubmit={save}>
      <Field label="Sets" htmlFor="target-sets" error={errors.sets}>
        <Input id="target-sets" inputMode="numeric" placeholder="e.g. 3" value={sets} onChange={(e) => setSets(e.target.value)} aria-invalid={!!errors.sets} />
      </Field>
      <Field label="Reps" htmlFor="target-reps-min" error={errors.reps}>
        <div className="flex items-center gap-3">
          <Input id="target-reps-min" aria-label="Reps from" inputMode="numeric" placeholder="8" value={min} onChange={(e) => setMin(e.target.value)} aria-invalid={!!errors.reps} />
          <span className="text-muted-foreground">to</span>
          <Input aria-label="Reps to" inputMode="numeric" placeholder="12" value={max} onChange={(e) => setMax(e.target.value)} aria-invalid={!!errors.reps} />
        </div>
      </Field>
      <Button type="button" variant="ghost" className="w-full text-destructive hover:text-destructive" onClick={() => void remove()}>
        <Trash2 /> Remove from this day
      </Button>
    </FormDrawer>
  )
}
