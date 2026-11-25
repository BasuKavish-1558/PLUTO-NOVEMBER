import { useState } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { finishWorkout } from '@/data/repos/workouts'
import { finishedRows, isEmptySet, loggedSetCount, type ActiveWorkout } from '@/domain/workoutSession'
import { summarizeWorkout } from '@/domain/workoutStats'
import { useProfile } from '@/features/profile/queries'
import { useActiveWorkout } from '@/stores/activeWorkout'
import { SummaryStats } from './SummaryStats'

type Props = { workout: ActiveWorkout; open: boolean; onOpenChange: (open: boolean) => void }

export function FinishDrawer({ workout, open, onOpenChange }: Props) {
  const navigate = useNavigate()
  const clear = useActiveWorkout((s) => s.clear)
  const unit = useProfile()?.weight_unit ?? 'kg'
  const [confirmDiscard, setConfirmDiscard] = useState(false)
  const [busy, setBusy] = useState(false)

  const logged = loggedSetCount(workout)
  // Blank rows don't count: they're ignored, not "left out".
  const unlogged = workout.exercises.reduce((n, e) => n + e.sets.filter((x) => !x.done && !isEmptySet(x)).length, 0)
  // Preview with the same rules the saved workout will use (open the sheet = "now").
  const [openedAt] = useState(() => Date.now())
  const preview = finishedRows(workout, openedAt)
  const summary = summarizeWorkout(
    preview.exercises.map((e) => ({ sets: preview.sets.filter((s) => s.workout_exercise_id === e.id) })),
    preview.workout.duration_seconds,
  )

  async function finish() {
    setBusy(true)
    const { workoutId } = await finishWorkout(workout)
    // Leave the live page before clearing, so it doesn't redirect to /workout first.
    navigate(`/workout/${workoutId}`, { replace: true, state: { justFinished: true } })
    clear()
  }

  function discard() {
    if (!confirmDiscard) return setConfirmDiscard(true)
    navigate('/workout', { replace: true })
    clear({ discard: true })
    toast('Workout discarded')
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="mx-auto max-w-md">
        <DrawerHeader className="text-left">
          <DrawerTitle>{logged ? 'Finish workout?' : 'Nothing logged yet'}</DrawerTitle>
          <DrawerDescription>
            {logged
              ? unlogged
                ? `${unlogged} unticked row${unlogged === 1 ? '' : 's'} will be left out.`
                : 'Every row is logged.'
              : 'Tick ✓ on a set to log it, or discard this workout.'}
          </DrawerDescription>
        </DrawerHeader>
        <div className="space-y-4 px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
          {logged > 0 && <SummaryStats summary={summary} unit={unit} />}
          {logged > 0 && (
            <Button size="lg" className="w-full" disabled={busy} onClick={() => void finish()}>
              Finish and save
            </Button>
          )}
          <Button size="lg" variant="ghost" className="w-full text-destructive hover:text-destructive" onClick={discard}>
            {confirmDiscard ? 'Tap again to discard for good' : 'Discard workout'}
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
