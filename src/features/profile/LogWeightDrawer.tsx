import { useState } from 'react'
import { toast } from 'sonner'
import { FormDrawer } from '@/components/layout/FormDrawer'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import type { Profile } from '@/data/db'
import { addWeight } from '@/data/repos/vitals'
import { toLocalDate } from '@/domain/dates'
import { formatWeight } from '@/domain/units'
import { WeightField } from './UnitFields'
import { parseWeight, weightDraft } from './vitalsForm'

type Props = { profile: Profile; currentKg: number | null; open: boolean; onOpenChange: (open: boolean) => void }

export function LogWeightDrawer({ profile, currentKg, open, onOpenChange }: Props) {
  const today = toLocalDate(new Date())
  const unit = profile.weight_unit
  const [weight, setWeight] = useState(weightDraft(currentKg, unit))
  const [date, setDate] = useState(today)
  const [errors, setErrors] = useState<{ weight?: string; date?: string }>({})

  async function save() {
    const w = parseWeight(weight, unit)
    const dateError = !/^\d{4}-\d{2}-\d{2}$/.test(date) ? 'Pick a date' : date > today ? "Can't log a future date" : undefined
    if (!w.ok || dateError) return setErrors({ weight: w.ok ? undefined : w.error, date: dateError })
    await addWeight(profile.id, w.value, date)
    toast.success(`Logged ${formatWeight(w.value, unit)}`)
    onOpenChange(false)
  }

  return (
    <FormDrawer open={open} onOpenChange={onOpenChange} title="Log weight" submitLabel="Save" onSubmit={save}>
      <WeightField id="log-weight" label="Weight" unit={unit} value={weight} error={errors.weight} onChange={setWeight} />
      <Field label="Date" htmlFor="log-date" error={errors.date}>
        <Input id="log-date" type="date" max={today} value={date} onChange={(e) => setDate(e.target.value)} aria-invalid={!!errors.date} />
      </Field>
    </FormDrawer>
  )
}
