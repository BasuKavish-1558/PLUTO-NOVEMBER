import { useState } from 'react'
import { FormDrawer } from '@/components/layout/FormDrawer'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import type { Profile } from '@/data/db'
import { updateProfile } from '@/data/repos/profile'
import { HeightField } from './UnitFields'
import { heightDraft, MAX_NAME, parseAge, parseHeight } from './vitalsForm'

type Props = { profile: Profile; open: boolean; onOpenChange: (open: boolean) => void }
type Errors = Partial<Record<'name' | 'age' | 'height', string>>

export function EditProfileDrawer({ profile, open, onOpenChange }: Props) {
  const [name, setName] = useState(profile.name)
  const [age, setAge] = useState(profile.age?.toString() ?? '')
  const [height, setHeight] = useState(heightDraft(profile.height_cm))
  const [errors, setErrors] = useState<Errors>({})

  async function save() {
    const n = name.trim()
    const a = parseAge(age)
    const h = parseHeight(height, profile.length_unit)
    if (!n || !a.ok || !h.ok) {
      return setErrors({ name: n ? undefined : 'Enter your name', age: a.ok ? undefined : a.error, height: h.ok ? undefined : h.error })
    }
    await updateProfile(profile.id, { name: n, age: a.value, height_cm: h.value })
    onOpenChange(false)
  }

  return (
    <FormDrawer open={open} onOpenChange={onOpenChange} title="Edit profile" submitLabel="Save" onSubmit={save}>
      <Field label="Name" htmlFor="edit-name" error={errors.name}>
        <Input id="edit-name" autoComplete="name" maxLength={MAX_NAME} value={name} onChange={(e) => setName(e.target.value)} aria-invalid={!!errors.name} />
      </Field>
      <Field label="Age" htmlFor="edit-age" error={errors.age}>
        <Input id="edit-age" inputMode="numeric" value={age} onChange={(e) => setAge(e.target.value)} aria-invalid={!!errors.age} />
      </Field>
      <HeightField id="edit-height" unit={profile.length_unit} value={height} error={errors.height} onChange={setHeight} />
    </FormDrawer>
  )
}
