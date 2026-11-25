import { useState } from 'react'
import { toast } from 'sonner'
import { FormDrawer } from '@/components/layout/FormDrawer'
import { Chip } from '@/components/ui/chip'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { createExercise, updateExercise } from '@/data/repos/exercises'
import { EQUIPMENT, equipmentLabel, MUSCLE_GROUPS, nameTaken, type Equipment, type Exercise } from '@/domain/library'
import { useUser } from '@/stores/session'

const MAX_NAME = 80

type Props = {
  exercise?: Exercise // edit when set, create otherwise
  library: readonly Exercise[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated?: (id: string) => void
}
type Errors = Partial<Record<'name' | 'muscle' | 'equipment', string>>

export function ExerciseFormDrawer({ exercise, library, open, onOpenChange, onCreated }: Props) {
  const { userId } = useUser()
  const [name, setName] = useState(exercise?.name ?? '')
  const [muscle, setMuscle] = useState<number | null>(exercise?.muscle_group_id ?? null)
  const [secondary, setSecondary] = useState<number[]>(exercise?.secondary_muscle_group_ids ?? [])
  const [equipment, setEquipment] = useState<Equipment | null>(exercise?.equipment ?? null)
  const [errors, setErrors] = useState<Errors>({})

  const toggleSecondary = (id: number) => setSecondary((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))

  async function save() {
    const n = name.trim().replace(/\s+/g, ' ')
    const next: Errors = {
      name: !n ? 'Enter a name' : nameTaken(library, n, exercise?.id) ? 'An exercise with this name already exists' : undefined,
      muscle: muscle === null ? 'Pick the main muscle group' : undefined,
      equipment: equipment === null ? 'Pick the equipment' : undefined,
    }
    if (next.name || next.muscle || next.equipment || muscle === null || equipment === null) return setErrors(next)
    const input = { name: n, muscle_group_id: muscle, secondary_muscle_group_ids: secondary.filter((id) => id !== muscle), equipment }
    if (exercise) {
      await updateExercise(exercise.id, input)
    } else {
      const id = await createExercise(userId, input)
      toast.success(`Added ${n} to your library`)
      onCreated?.(id)
    }
    onOpenChange(false)
  }

  return (
    <FormDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={exercise ? 'Edit exercise' : 'New exercise'}
      submitLabel={exercise ? 'Save' : 'Add exercise'}
      onSubmit={save}
    >
      <Field label="Name" htmlFor="exercise-name" error={errors.name}>
        <Input id="exercise-name" maxLength={MAX_NAME} value={name} onChange={(e) => setName(e.target.value)} aria-invalid={!!errors.name} />
      </Field>
      <Field label="Main muscle group" error={errors.muscle}>
        <div role="radiogroup" aria-label="Main muscle group" className="flex flex-wrap gap-2">
          {MUSCLE_GROUPS.map((m) => (
            <Chip key={m.id} role="radio" aria-pressed={undefined} aria-checked={muscle === m.id} selected={muscle === m.id} onClick={() => setMuscle(m.id)}>
              {m.name}
            </Chip>
          ))}
        </div>
      </Field>
      <Field label="Also works (optional)">
        <div role="group" aria-label="Secondary muscles" className="flex flex-wrap gap-2">
          {MUSCLE_GROUPS.filter((m) => m.id !== muscle).map((m) => (
            <Chip key={m.id} selected={secondary.includes(m.id)} onClick={() => toggleSecondary(m.id)}>
              {m.name}
            </Chip>
          ))}
        </div>
      </Field>
      <Field label="Equipment" error={errors.equipment}>
        <div role="radiogroup" aria-label="Equipment" className="flex flex-wrap gap-2">
          {EQUIPMENT.map((e) => (
            <Chip key={e} role="radio" aria-pressed={undefined} aria-checked={equipment === e} selected={equipment === e} onClick={() => setEquipment(e)}>
              {equipmentLabel(e)}
            </Chip>
          ))}
        </div>
      </Field>
    </FormDrawer>
  )
}
