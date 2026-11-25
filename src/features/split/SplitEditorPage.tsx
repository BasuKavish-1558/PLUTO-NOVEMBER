import { Check, Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { BackLink } from '@/components/layout/BackLink'
import { FormDrawer } from '@/components/layout/FormDrawer'
import { useSheet } from '@/components/layout/useSheet'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { activateSplit, deleteSplit, renameSplit } from '@/data/repos/splits'
import { trainingDaysPerWeek } from '@/domain/split'
import { useProfile } from '@/features/profile/queries'
import { useSplitDetail } from './queries'
import { MAX_SPLIT_NAME } from './splitText'
import { WeekOverview } from './WeekOverview'
import { PageSkeleton } from '@/components/ui/skeleton'
import { SPLIT_PATH } from '@/features/split/paths'

export function SplitEditorPage() {
  const { splitId } = useParams()
  const navigate = useNavigate()
  const profile = useProfile()
  const detail = useSplitDetail(splitId)
  const rename = useSheet()
  const remove = useSheet()

  if (detail === null) return <Navigate to={SPLIT_PATH} replace />
  if (!detail || !profile) return <PageSkeleton />
  const { split } = detail
  const isActive = profile.active_split_id === split.id

  async function onDelete() {
    navigate(SPLIT_PATH, { replace: true })
    await deleteSplit(split.id, profile!)
    toast(`Deleted ${split.name}`)
  }

  return (
    <div className="space-y-5">
      <BackLink to={SPLIT_PATH} label="Split" />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight break-words">{split.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{trainingDaysPerWeek(detail.days)} training days a week</p>
        </div>
        <Button variant="ghost" size="icon" aria-label="Rename split" onClick={rename.show}>
          <Pencil />
        </Button>
      </div>

      {isActive ? (
        <p className="flex h-11 items-center gap-2 rounded-xl bg-primary/10 px-4 text-sm font-medium text-primary-ink">
          <Check className="size-4" /> Active split: today's workout comes from here
        </p>
      ) : (
        <Button className="w-full" onClick={() => void activateSplit(profile.id, split.id).then(() => toast.success(`${split.name} is now active`))}>
          Make active
        </Button>
      )}

      <Card className="p-0">
        <WeekOverview detail={detail} />
      </Card>

      <Button variant="ghost" className="w-full text-destructive hover:text-destructive" onClick={remove.show}>
        <Trash2 /> Delete split
      </Button>

      <RenameDrawer key={rename.key} name={split.name} open={rename.open} onOpenChange={rename.onOpenChange} onSave={(n) => renameSplit(split.id, n)} />
      <FormDrawer
        open={remove.open}
        onOpenChange={remove.onOpenChange}
        title={`Delete ${split.name}?`}
        submitLabel="Delete split"
        submitVariant="destructive"
        onSubmit={onDelete}
      >
        <p className="text-sm text-muted-foreground">
          The split and its days are removed. Workouts you already logged are kept.
        </p>
      </FormDrawer>
    </div>
  )
}

type RenameProps = { name: string; open: boolean; onOpenChange: (open: boolean) => void; onSave: (name: string) => Promise<void> }

function RenameDrawer({ name: initial, open, onOpenChange, onSave }: RenameProps) {
  const [name, setName] = useState(initial)
  const [error, setError] = useState<string>()

  async function save() {
    const n = name.trim()
    if (!n) return setError('Name your split')
    await onSave(n)
    onOpenChange(false)
  }

  return (
    <FormDrawer open={open} onOpenChange={onOpenChange} title="Rename split" submitLabel="Save" onSubmit={save}>
      <Field label="Name" htmlFor="split-name" error={error}>
        <Input id="split-name" maxLength={MAX_SPLIT_NAME} value={name} onChange={(e) => setName(e.target.value)} aria-invalid={!!error} />
      </Field>
    </FormDrawer>
  )
}
