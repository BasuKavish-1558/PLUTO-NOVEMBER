import { PartyPopper, Pencil, Trash2, Trophy } from 'lucide-react'
import { motion } from 'motion/react'
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { BackLink } from '@/components/layout/BackLink'
import { FormDrawer } from '@/components/layout/FormDrawer'
import { useSheet } from '@/components/layout/useSheet'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { deleteWorkout } from '@/data/repos/workouts'
import { parseLocalDate } from '@/domain/dates'
import { formatWeight } from '@/domain/units'
import { useExerciseMap } from '@/features/library/queries'
import { useProfile } from '@/features/profile/queries'
import { usePrs } from '@/features/progress/queries'
import { prTitle, prValue } from '@/features/prs/prText'
import { spring } from '@/lib/motion'
import { summaryOf, useWorkoutDetail } from './queries'
import { SummaryStats } from './SummaryStats'
import { PageSkeleton } from '@/components/ui/skeleton'

export function WorkoutDetailPage() {
  const { workoutId } = useParams()
  const navigate = useNavigate()
  const justFinished = (useLocation().state as { justFinished?: boolean } | null)?.justFinished
  const detail = useWorkoutDetail(workoutId)
  const exercises = useExerciseMap()
  const unit = useProfile()?.weight_unit ?? 'kg'
  const confirm = useSheet()
  const prs = (usePrs() ?? []).filter((p) => p.workout_id === workoutId)

  if (detail === null) return <Navigate to="/workout" replace />
  if (!detail) return <PageSkeleton cards={4} />
  const { workout } = detail

  async function remove() {
    navigate('/workout', { replace: true })
    await deleteWorkout(workout.id)
    toast('Workout deleted')
  }

  return (
    <div className="space-y-5">
      <BackLink to="/workout" label="Workout" />
      {justFinished && (
        <motion.p
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ ...spring, stiffness: 400, damping: 18 }}
          className="flex items-center gap-2 rounded-xl bg-primary/10 px-4 py-3 font-medium text-primary-ink"
        >
          <PartyPopper className="size-5" /> Workout saved. Nice work!
        </motion.p>
      )}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{workout.title || 'Workout'}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {parseLocalDate(workout.local_date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
          {' · '}
          {new Date(workout.started_at).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
        </p>
      </div>

      <SummaryStats summary={summaryOf(detail)} unit={unit} animate={justFinished} />

      {prs.length > 0 && (
        <Card className="space-y-2">
          <h2 className="flex items-center gap-2 font-semibold">
            <Trophy className="size-5 text-primary" /> Personal records
          </h2>
          <ul className="space-y-1 text-sm">
            {prs.map((pr) => (
              <li key={pr.id}>
                <Link to={`/progress?exercise=${pr.exercise_id}`} className="flex min-h-11 flex-wrap items-center gap-x-2">
                  <span className="font-medium">{exercises.get(pr.exercise_id)?.name ?? 'Exercise'}</span>
                  <span className="text-muted-foreground tabular-nums">
                    {prValue(pr, unit)} · {prTitle(pr, unit)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {detail.exercises.map((e) => {
        let n = 0
        return (
          <Card key={e.id} className="space-y-2">
            <h2 className="font-semibold">{exercises.get(e.exercise_id)?.name ?? 'Exercise'}</h2>
            <ol className="space-y-1 text-sm tabular-nums">
              {detail.sets
                .filter((s) => s.workout_exercise_id === e.id)
                .map((s) => (
                  <li key={s.id} className={s.is_warmup ? 'flex gap-3 text-muted-foreground' : 'flex gap-3'}>
                    <span className="w-6 font-medium text-muted-foreground">{s.is_warmup ? 'W' : ++n}</span>
                    <span>
                      {s.weight_kg ? formatWeight(s.weight_kg, unit) : 'Bodyweight'} × {s.reps}
                    </span>
                  </li>
                ))}
            </ol>
          </Card>
        )
      })}

      {workout.notes && (
        <Card>
          <h2 className="mb-1 text-sm font-semibold">Notes</h2>
          <p className="text-sm whitespace-pre-wrap text-muted-foreground">{workout.notes}</p>
        </Card>
      )}

      <div className="flex gap-3">
        <Button asChild variant="outline" size="lg" className="flex-1">
          <Link to={`/workout/${workout.id}/edit`}>
            <Pencil /> Edit
          </Link>
        </Button>
        <Button variant="ghost" size="lg" className="flex-1 text-destructive hover:text-destructive" onClick={confirm.show}>
          <Trash2 /> Delete
        </Button>
      </div>

      <FormDrawer
        open={confirm.open}
        onOpenChange={confirm.onOpenChange}
        title="Delete this workout?"
        submitLabel="Delete"
        submitVariant="destructive"
        onSubmit={remove}
      >
        <p className="text-sm text-muted-foreground">Its sets are removed from your history and charts. This can't be undone.</p>
      </FormDrawer>
    </div>
  )
}
