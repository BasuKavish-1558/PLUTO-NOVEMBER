import { Trash2, Trophy } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { FormDrawer } from '@/components/layout/FormDrawer'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Segmented } from '@/components/ui/segmented'
import type { PersonalRecord } from '@/data/db'
import { createPr, deletePr, updatePr } from '@/data/repos/prs'
import { PHOTO_MAX_PX } from '@/data/repos/photos'
import { beatsPrevious, previousRecord, type PrType } from '@/domain/personalRecords'
import { toDisplayWeight, toStoredWeight, weightLabel, type WeightUnit } from '@/domain/units'
import { PhotoButtons } from '@/features/profile/PhotoButtons'
import { useMediaUrl } from '@/features/profile/queries'
import { celebrate } from '@/lib/confetti'
import { useUser } from '@/stores/session'
import { PR_TYPES, prDate, prValue } from './prText'

type Props = {
  exerciseId: string
  exerciseName: string
  pr?: PersonalRecord // edit when set
  prefill?: { weightKg: number | null; reps: number | null }
  allPrs: readonly PersonalRecord[]
  unit: WeightUnit
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated?: (id: string) => void
}

/** PR-2/PR-3: exercise, type, weight and reps, optional note and photo. The date is the device clock. */
export function PrFormDrawer({ exerciseId, exerciseName, pr, prefill, allPrs, unit, open, onOpenChange, onCreated }: Props) {
  const { userId } = useUser()
  const [type, setType] = useState<PrType>(pr?.type ?? 'heaviest_weight')
  const [weight, setWeight] = useState(() => {
    const kg = pr?.weight_kg ?? prefill?.weightKg
    return kg === null || kg === undefined ? '' : String(toDisplayWeight(kg, unit))
  })
  const [reps, setReps] = useState(String(pr?.reps ?? prefill?.reps ?? ''))
  const [note, setNote] = useState(pr?.note ?? '')
  const [photo, setPhoto] = useState<Blob | null | undefined>(undefined) // undefined = unchanged
  const [errors, setErrors] = useState<{ weight?: string; reps?: string }>({})
  const [confirmAnyway, setConfirmAnyway] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [loggedAt] = useState(() => pr?.created_at ?? new Date().toISOString())

  const weightKg = weight.trim() === '' ? 0 : toStoredWeight(Number(weight.replace(',', '.')), unit)
  const repsN = Number(reps)
  const candidate = { id: pr?.id ?? 'new', exercise_id: exerciseId, type, weight_kg: weightKg, reps: repsN, created_at: loggedAt }
  const previous = previousRecord(candidate, allPrs)
  const beats = beatsPrevious(candidate, previous)

  async function save() {
    const next = {
      weight: !Number.isFinite(weightKg) || weightKg < 0 || weightKg > 1000 ? 'Enter a weight (empty = bodyweight)' : undefined,
      reps: !Number.isInteger(repsN) || repsN < 1 || repsN > 1000 ? 'Enter reps from 1 to 1000' : undefined,
    }
    if (next.weight || next.reps) return setErrors(next)
    if (!beats && !pr && !confirmAnyway) return setConfirmAnyway(true)
    const input = { type, weight_kg: weightKg, reps: repsN, note: note || null }
    if (pr) {
      await updatePr(pr, input, photo)
      toast.success('PR updated')
    } else {
      const id = await createPr(userId, { ...input, exercise_id: exerciseId }, photo ?? null)
      if (beats) celebrate()
      toast.success(beats ? `New PR! ${exerciseName} ${prValue(candidate, unit)}` : `Logged ${prValue(candidate, unit)}`, {
        icon: <Trophy className="size-4 text-primary" />,
      })
      onCreated?.(id)
    }
    onOpenChange(false)
  }

  async function remove() {
    if (!pr) return
    if (!confirmDelete) return setConfirmDelete(true)
    onOpenChange(false)
    await deletePr(pr)
    toast('PR deleted')
  }

  return (
    <FormDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={pr ? `Edit PR · ${exerciseName}` : `Log a PR · ${exerciseName}`}
      description={pr ? `Logged ${prDate(loggedAt)}` : 'Dated now, from this device.'}
      submitLabel={confirmAnyway ? 'Log anyway' : pr ? 'Save' : 'Log PR'}
      onSubmit={save}
    >
      <Segmented label="Record type" value={type} options={PR_TYPES} onChange={(t) => { setType(t); setConfirmAnyway(false) }} />
      <div className="grid grid-cols-2 gap-3">
        <Field label={`Weight (${weightLabel(unit)})`} htmlFor="pr-weight" error={errors.weight}>
          <Input id="pr-weight" inputMode="decimal" placeholder="BW" value={weight} onChange={(e) => { setWeight(e.target.value); setConfirmAnyway(false) }} aria-invalid={!!errors.weight} />
        </Field>
        <Field label="Reps" htmlFor="pr-reps" error={errors.reps}>
          <Input id="pr-reps" inputMode="numeric" value={reps} onChange={(e) => { setReps(e.target.value); setConfirmAnyway(false) }} aria-invalid={!!errors.reps} />
        </Field>
      </div>
      <p className={`rounded-xl px-4 py-3 text-sm ${beats ? 'bg-primary/10 text-primary-ink' : 'bg-muted text-muted-foreground'}`} role="status">
        {!previous
          ? 'Your first record of this kind.'
          : beats
            ? `Beats ${prValue(previous, unit)} (${prDate(previous.created_at)})`
            : `This doesn't beat ${prValue(previous, unit)} (${prDate(previous.created_at)}).${confirmAnyway ? ' Log it anyway?' : ''}`}
      </p>
      <Field label="Note (optional)" htmlFor="pr-note">
        <Input id="pr-note" maxLength={500} placeholder="e.g. Paused reps, belt" value={note} onChange={(e) => setNote(e.target.value)} />
      </Field>
      <PhotoField existingPath={photo === undefined ? (pr?.photo_path ?? null) : null} picked={photo ?? null} onPick={setPhoto} />
      {pr && (
        <Button type="button" variant="ghost" className="w-full text-destructive hover:text-destructive" onClick={() => void remove()}>
          <Trash2 /> {confirmDelete ? 'Tap again to delete' : 'Delete PR'}
        </Button>
      )}
    </FormDrawer>
  )
}

function PhotoField({ existingPath, picked, onPick }: { existingPath: string | null; picked: Blob | null; onPick: (b: Blob | null) => void }) {
  const remote = useMediaUrl(existingPath)
  const local = useMemo(() => (picked ? URL.createObjectURL(picked) : null), [picked])
  useEffect(() => () => void (local && URL.revokeObjectURL(local)), [local])
  const src = local ?? remote
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">Photo (optional)</p>
      {src && <img src={src} alt="PR photo" className="max-h-48 w-full rounded-xl object-cover" />}
      <PhotoButtons hasPhoto={!!src || !!existingPath} onPick={onPick} maxPx={PHOTO_MAX_PX} />
    </div>
  )
}
