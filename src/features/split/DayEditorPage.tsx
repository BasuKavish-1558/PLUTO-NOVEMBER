import { Plus } from 'lucide-react'
import { useState } from 'react'
import { Navigate, useParams } from 'react-router'
import { BackLink } from '@/components/layout/BackLink'
import { useSheet } from '@/components/layout/useSheet'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import type { SplitDayExercise } from '@/data/db'
import { addToDay, updateDay } from '@/data/repos/splits'
import { useExerciseMap } from '@/features/library/queries'
import { DayExerciseList } from './DayExerciseList'
import { ExercisePickerDrawer } from './ExercisePickerDrawer'
import { useSplitDetail, type DayWithItems } from './queries'
import { MAX_DAY_LABEL, WEEKDAYS } from './splitText'
import { TargetsDrawer } from './TargetsDrawer'
import { PageSkeleton } from '@/components/ui/skeleton'
import { SPLIT_PATH, splitPath } from '@/features/split/paths'

export function DayEditorPage() {
  const { splitId, weekday } = useParams()
  const detail = useSplitDetail(splitId)
  if (detail === null) return <Navigate to={SPLIT_PATH} replace />
  if (!detail) return <PageSkeleton />
  const day = detail.days.find((d) => d.weekday === Number(weekday))
  if (!day) return <Navigate to={splitPath(detail.split.id)} replace />
  return <DayEditor key={day.id} splitId={detail.split.id} splitName={detail.split.name} day={day} />
}

function DayEditor({ splitId, splitName, day }: { splitId: string; splitName: string; day: DayWithItems }) {
  const exercises = useExerciseMap()
  const [label, setLabel] = useState(day.label)
  const picker = useSheet()
  const targets = useSheet()
  const [editing, setEditing] = useState<SplitDayExercise | null>(null)

  const saveLabel = () => {
    const next = label.trim()
    if (next !== day.label) void updateDay(day.id, { label: next })
  }

  return (
    <div className="space-y-5">
      <BackLink to={splitPath(splitId)} label={splitName} />
      <h1 className="text-2xl font-semibold tracking-tight">{WEEKDAYS[day.weekday - 1]}</h1>

      <Card className="space-y-5">
        <Field label="Day name" htmlFor="day-label">
          <Input
            id="day-label"
            placeholder="e.g. Push A"
            maxLength={MAX_DAY_LABEL}
            value={label}
            disabled={day.is_rest}
            onChange={(e) => setLabel(e.target.value)}
            onBlur={saveLabel}
            onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
          />
        </Field>
        <div className="flex items-center justify-between gap-4">
          <label htmlFor="rest-day">Rest day</label>
          <Switch id="rest-day" checked={day.is_rest} onCheckedChange={(is_rest) => void updateDay(day.id, { is_rest })} />
        </div>
      </Card>

      {day.is_rest ? (
        <p className="text-center text-sm text-muted-foreground">
          {day.items.length
            ? `${day.items.length} exercises are kept and come back if you turn rest off.`
            : 'Turn rest off to add exercises.'}
        </p>
      ) : (
        <section className="space-y-3">
          <h2 className="px-1 text-sm font-semibold">Exercises</h2>
          {day.items.length > 0 ? (
            <DayExerciseList
              key={day.items.map((i) => i.id).sort().join()}
              dayId={day.id}
              items={day.items}
              exercises={exercises}
              onEdit={(item) => {
                setEditing(item)
                targets.show()
              }}
            />
          ) : (
            <p className="rounded-xl border border-dashed px-5 py-8 text-center text-sm text-muted-foreground">
              No exercises yet. Add some from the library.
            </p>
          )}
          <Button variant="secondary" size="lg" className="w-full" onClick={picker.show}>
            <Plus /> Add exercises
          </Button>
        </section>
      )}

      <ExercisePickerDrawer
        key={picker.key}
        open={picker.open}
        onOpenChange={picker.onOpenChange}
        addedIds={new Set(day.items.map((i) => i.exercise_id))}
        onAdd={(e) => void addToDay(day, e.id)}
      />
      {editing && (
        <TargetsDrawer
          key={targets.key}
          item={editing}
          name={exercises.get(editing.exercise_id)?.name ?? 'Exercise'}
          open={targets.open}
          onOpenChange={targets.onOpenChange}
        />
      )}
    </div>
  )
}
