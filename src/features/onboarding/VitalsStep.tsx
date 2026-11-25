import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import type { Profile } from '@/data/db'
import { updateProfile } from '@/data/repos/profile'
import { setProteinGoal } from '@/data/repos/nutrition'
import { addWeight } from '@/data/repos/vitals'
import { toLocalDate } from '@/domain/dates'
import { DEFAULT_MULTIPLIER } from '@/domain/nutrition'
import type { LengthUnit, WeightUnit } from '@/domain/units'
import { HeightField, UnitsPicker, WeightField } from '@/features/profile/UnitFields'
import {
  convertHeightDraft,
  convertWeightDraft,
  heightDraft,
  parseAge,
  parseHeight,
  parseWeight,
} from '@/features/profile/vitalsForm'
import { useTheme } from '@/stores/theme'

type Errors = Partial<Record<'age' | 'weight' | 'height', string>>

export function VitalsStep({ profile, onBack }: { profile: Profile; onBack: () => void }) {
  const [units, setUnits] = useState({ weight: profile.weight_unit, length: profile.length_unit })
  const [age, setAge] = useState(profile.age?.toString() ?? '')
  const [weight, setWeight] = useState('')
  const [height, setHeight] = useState(heightDraft(profile.height_cm))
  const [errors, setErrors] = useState<Errors>({})
  const [busy, setBusy] = useState(false)

  function changeUnits(w: WeightUnit, l: LengthUnit) {
    setWeight((text) => convertWeightDraft(text, units.weight, w))
    setHeight((draft) => convertHeightDraft(draft, units.length))
    setUnits({ weight: w, length: l })
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    const a = parseAge(age)
    const w = parseWeight(weight, units.weight)
    const h = parseHeight(height, units.length)
    if (!a.ok || !w.ok || !h.ok) {
      return setErrors({ age: a.ok ? undefined : a.error, weight: w.ok ? undefined : w.error, height: h.ok ? undefined : h.error })
    }
    setBusy(true)
    const today = toLocalDate(new Date())
    await addWeight(profile.id, w.value, today)
    await setProteinGoal(profile.id, DEFAULT_MULTIPLIER, 'maintain', today) // editable on Nutrition
    // Keep the theme chosen before sign-up; onboarded_at last so the guard moves to Home.
    await updateProfile(profile.id, {
      age: a.value,
      height_cm: h.value,
      weight_unit: units.weight,
      length_unit: units.length,
      theme_pref: useTheme.getState().pref,
      background: useTheme.getState().background,
      onboarded_at: new Date().toISOString(),
    })
  }

  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-1 flex-col">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Your body</h1>
        <p className="text-muted-foreground">Used for your protein goal and progress. You can change it any time.</p>
      </div>
      <div className="mt-8 space-y-5">
        <UnitsPicker weightUnit={units.weight} lengthUnit={units.length} onChange={changeUnits} />
        <Field label="Age" htmlFor="age" error={errors.age}>
          <Input id="age" inputMode="numeric" value={age} onChange={(e) => setAge(e.target.value)} aria-invalid={!!errors.age} />
        </Field>
        <WeightField id="weight" unit={units.weight} value={weight} error={errors.weight} onChange={setWeight} />
        <HeightField id="height" unit={units.length} value={height} error={errors.height} onChange={setHeight} />
      </div>
      <div className="mt-auto flex gap-3 pt-8">
        <Button type="button" variant="outline" size="lg" onClick={onBack}>
          Back
        </Button>
        <Button type="submit" size="lg" className="flex-1" disabled={busy}>
          Finish
        </Button>
      </div>
    </form>
  )
}
