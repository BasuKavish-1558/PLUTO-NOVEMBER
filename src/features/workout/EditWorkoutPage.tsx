import { Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { BackLink } from '@/components/layout/BackLink'
import { useSheet } from '@/components/layout/useSheet'
import { Button } from '@/components/ui/button'
import { saveWorkoutEdits } from '@/data/repos/workouts'
import { diffWorkout, sessionFromRows } from '@/domain/workoutHistory'
import { addExercise, canLog, withoutEmptySets, type Session } from '@/domain/workoutSession'
import { useLibrary } from '@/features/library/queries'
import type { Exercise } from '@/domain/library'
import { trackingOf } from '@/domain/tracking'
import { useProfile } from '@/features/profile/queries'
import { ExercisePickerDrawer } from '@/features/split/ExercisePickerDrawer'
import { ExerciseCard } from './ExerciseCard'
import { NotesField } from './NotesField'
import { usePreviousPerformance, useWorkoutDetail, type WorkoutDetail } from './queries'
import { PageSkeleton } from '@/components/ui/skeleton'

export function EditWorkoutPage() {
  const { workoutId } = useParams()
  const detail = useWorkoutDetail(workoutId)
  const library = useLibrary() // each exercise's tracking comes from it, so wait until it is ready
  const exercises = useMemo(() => new Map((library ?? []).map((e) => [e.id, e])), [library])
  if (detail === null) return <Navigate to="/workout" replace />
  if (!detail || !library) return <PageSkeleton />
  // Handed down as a prop: another useLibrary() call would start empty and misread every exercise.
  return <Editor key={detail.workout.id} detail={detail} exercises={exercises} />
}

/** WK-10: the logger without a timer; every row counts as logged. */
function Editor({ detail, exercises }: { detail: WorkoutDetail; exercises: Map<string, Exercise> }) {
  const navigate = useNavigate()
  const unit = useProfile()?.weight_unit ?? 'kg'
  const [draft, setDraft] = useState<Session>(() =>
    sessionFromRows(detail.exercises, detail.sets, detail.workout.notes, (id) => {
      const exercise = exercises.get(id)
      return exercise ? trackingOf(exercise) : 'weight_reps'
    }),
  )
  const previous = usePreviousPerformance(draft.exercises.map((e) => e.exerciseId), detail.workout.id)
  const picker = useSheet()
  const [busy, setBusy] = useState(false)
  const back = `/workout/${detail.workout.id}`

  async function save() {
    const kept = withoutEmptySets(draft) // blank rows are ignored, not errors
    if (kept.exercises.some((e) => e.sets.some((s) => !canLog(s, e.tracking)))) {
      return toast.error('Every set needs its reps (or its time). Fill it in or remove the set.')
    }
    setBusy(true)
    await saveWorkoutEdits(detail.workout, diffWorkout(detail.exercises, detail.sets, kept), draft.notes)
    toast.success('Workout updated')
    navigate(back, { replace: true })
  }

  return (
    <div className="space-y-4">
      <BackLink to={back} label="Cancel" />
      <h1 className="text-2xl font-semibold tracking-tight">Edit {detail.workout.title || 'workout'}</h1>
      {draft.exercises.map((e) => (
        <ExerciseCard
          key={e.id}
          exercise={e}
          name={exercises.get(e.exerciseId)?.name ?? 'Exercise'}
          unit={unit}
          previous={previous?.get(e.exerciseId)}
          mode="edit"
          onChange={(change) => setDraft((d) => change(d))}
        />
      ))}
      <Button variant="secondary" size="lg" className="w-full" onClick={picker.show}>
        <Plus /> Add exercise
      </Button>
      <NotesField value={draft.notes} onChange={(notes) => setDraft((d) => ({ ...d, notes }))} />
      <div className="sticky bottom-[calc(5rem+env(safe-area-inset-bottom))] flex gap-3 md:bottom-4">
        <Button variant="outline" size="lg" className="flex-1 bg-background" onClick={() => navigate(back)}>
          Cancel
        </Button>
        <Button size="lg" className="flex-1" disabled={busy} onClick={() => void save()}>
          Save changes
        </Button>
      </div>
      <ExercisePickerDrawer
        key={picker.key}
        open={picker.open}
        onOpenChange={picker.onOpenChange}
        addedIds={new Set(draft.exercises.map((e) => e.exerciseId))}
        onAdd={(ex) =>
          setDraft((d) =>
            addExercise(d, {
              id: crypto.randomUUID(),
              exerciseId: ex.id,
              tracking: trackingOf(ex),
              sets: [{ id: crypto.randomUUID(), weightKg: null, reps: null, durationSeconds: null, isWarmup: false, done: true, loggedAt: null }],
            }),
          )
        }
      />
    </div>
  )
}
