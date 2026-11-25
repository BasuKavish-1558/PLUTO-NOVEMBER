import { Pause, Play, Plus } from 'lucide-react'
import { useState } from 'react'
import { Navigate } from 'react-router'
import { useSheet } from '@/components/layout/useSheet'
import { Button } from '@/components/ui/button'
import { loadPrevious } from '@/data/repos/workouts'
import { addExercise, elapsedMs, initialSets, pauseTimer, resumeTimer, type ActiveWorkout, type SessionExercise } from '@/domain/workoutSession'
import { formatClock } from '@/domain/workoutStats'
import { useExerciseMap } from '@/features/library/queries'
import { useProfile } from '@/features/profile/queries'
import { ExercisePickerDrawer } from '@/features/split/ExercisePickerDrawer'
import { useActiveWorkout } from '@/stores/activeWorkout'
import { PrFormDrawer } from '@/features/prs/PrFormDrawer'
import { usePrs } from '@/features/progress/queries'
import { ExerciseCard } from './ExerciseCard'
import { FinishDrawer } from './FinishDrawer'
import { NotesField } from './NotesField'
import { useNow, usePreviousPerformance } from './queries'
import { PageSkeleton } from '@/components/ui/skeleton'

export function LiveWorkoutPage() {
  const workout = useActiveWorkout((s) => s.workout)
  // Redirect only when opened without a workout; after Finish/Discard the drawer navigates itself.
  const [hadWorkout, setHadWorkout] = useState(!!workout)
  if (workout && !hadWorkout) setHadWorkout(true)
  if (workout === undefined) return <PageSkeleton />
  if (!workout) return hadWorkout ? null : <Navigate to="/workout" replace />
  return <Live workout={workout} />
}

function Live({ workout }: { workout: ActiveWorkout }) {
  const update = useActiveWorkout((s) => s.update)
  const profile = useProfile()
  const exercises = useExerciseMap()
  const previous = usePreviousPerformance(workout.exercises.map((e) => e.exerciseId))
  const paused = workout.timer.pausedAt !== null
  const now = useNow(!paused)
  const picker = useSheet()
  const finish = useSheet()
  const unit = profile?.weight_unit ?? 'kg'
  const allPrs = usePrs() ?? []
  const sessionPrs = allPrs.filter((p) => workout.prIds?.includes(p.id))
  const prSheet = useSheet()
  const [prFor, setPrFor] = useState<SessionExercise | null>(null)
  // Pre-fill with the heaviest set logged so far (else the last row).
  const prefillFor = (e: SessionExercise) => {
    const best = e.sets.filter((s) => s.done && !s.isWarmup).sort((a, b) => (b.weightKg ?? 0) - (a.weightKg ?? 0))[0] ?? e.sets.at(-1)
    return { weightKg: best?.weightKg ?? null, reps: best?.reps ?? null }
  }

  const togglePause = () =>
    update((w) => ({ ...w, timer: paused ? resumeTimer(w.timer, Date.now()) : pauseTimer(w.timer, Date.now()) }))

  return (
    <div className="space-y-4">
      <div className="sticky top-[calc(3.5rem+env(safe-area-inset-top))] z-20 -mx-4 flex items-center gap-3 border-b bg-background/90 px-4 py-2 backdrop-blur-lg md:top-0 md:mx-0 md:rounded-xl md:border">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm text-muted-foreground">{workout.title || 'Workout'}</p>
          <p role="timer" aria-label="Workout time" className="text-2xl font-semibold tabular-nums">
            {formatClock(elapsedMs(workout.timer, now) / 1000)}
            {paused && <span className="ml-2 align-middle text-sm font-medium text-amber-600 dark:text-amber-400">Paused</span>}
          </p>
        </div>
        <Button variant="outline" size="icon" aria-label={paused ? 'Resume timer' : 'Pause timer'} onClick={togglePause}>
          {paused ? <Play /> : <Pause />}
        </Button>
        <Button onClick={finish.show}>Finish</Button>
      </div>

      {workout.exercises.map((e) => (
        <ExerciseCard
          key={e.id}
          exercise={e}
          name={exercises.get(e.exerciseId)?.name ?? 'Exercise'}
          unit={unit}
          previous={previous?.get(e.exerciseId)}
          mode="live"
          onChange={(change) => update((w) => ({ ...w, ...change(w) }))}
          prs={sessionPrs.filter((p) => p.exercise_id === e.exerciseId)}
          onLogPr={() => {
            setPrFor(e)
            prSheet.show()
          }}
        />
      ))}

      {!workout.exercises.length && (
        <p className="rounded-xl border border-dashed px-5 py-8 text-center text-sm text-muted-foreground">
          Add your first exercise to start logging.
        </p>
      )}

      <Button variant="secondary" size="lg" className="w-full" onClick={picker.show}>
        <Plus /> Add exercise
      </Button>

      <NotesField value={workout.notes} onChange={(notes) => update((w) => ({ ...w, notes }))} />

      <ExercisePickerDrawer
        key={picker.key}
        open={picker.open}
        onOpenChange={picker.onOpenChange}
        addedIds={new Set(workout.exercises.map((e) => e.exerciseId))}
        onAdd={async (ex) => {
          const prev = (await loadPrevious([ex.id])).get(ex.id)
          const uuid = () => crypto.randomUUID()
          update((w) => addExercise(w, { id: uuid(), exerciseId: ex.id, sets: initialSets(prev?.sets, undefined, uuid) }))
        }}
      />
      {prFor && (
        <PrFormDrawer
          key={`pr-${prSheet.key}`}
          exerciseId={prFor.exerciseId}
          exerciseName={exercises.get(prFor.exerciseId)?.name ?? 'Exercise'}
          prefill={prefillFor(prFor)}
          allPrs={allPrs}
          unit={unit}
          open={prSheet.open}
          onOpenChange={prSheet.onOpenChange}
          onCreated={(id) => update((w) => ({ ...w, prIds: [...(w.prIds ?? []), id] }))}
        />
      )}
      <FinishDrawer key={finish.key} workout={workout} open={finish.open} onOpenChange={finish.onOpenChange} />
    </div>
  )
}
