import { ChevronRight, Clock } from 'lucide-react'
import { Link } from 'react-router'
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { parseLocalDate, type LocalDate } from '@/domain/dates'
import { formatWeight, type WeightUnit } from '@/domain/units'
import { formatDuration } from '@/domain/workoutStats'
import { useExerciseMap } from '@/features/library/queries'
import { useProfile } from '@/features/profile/queries'
import { useWorkoutsOn, type WorkoutDetail } from '@/features/workout/queries'
import { DayPrs, DayProtein } from './DayExtras'
import { DayPhotos } from './DayPhotos'

type Props = { date: LocalDate | null; onClose: () => void }

/** CL-3: the full log for a tapped day. */
export function DayLogDrawer({ date, onClose }: Props) {
  const workouts = useWorkoutsOn(date) ?? []
  const unit = useProfile()?.weight_unit ?? 'kg'
  const title = date
    ? parseLocalDate(date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })
    : ''

  return (
    <Drawer open={date !== null} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="mx-auto max-h-[85dvh] max-w-2xl">
        <DrawerHeader className="text-left">
          <DrawerTitle>{title}</DrawerTitle>
          <DrawerDescription>
            {workouts.length
              ? `${workouts.length} workout${workouts.length === 1 ? '' : 's'} logged`
              : 'No workout logged on this day'}
          </DrawerDescription>
        </DrawerHeader>
        <div className="space-y-5 overflow-y-auto px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
          {workouts.map((w) => (
            <WorkoutLog key={w.workout.id} detail={w} unit={unit} />
          ))}
          {date && <DayPrs date={date} unit={unit} />}
          {date && <DayPhotos date={date} workouts={workouts} />}
          {date && <DayProtein date={date} />}
        </div>
      </DrawerContent>
    </Drawer>
  )
}

function WorkoutLog({ detail, unit }: { detail: WorkoutDetail; unit: WeightUnit }) {
  const names = useExerciseMap()
  const { workout } = detail

  return (
    <section className="space-y-3">
      <Link to={`/workout/${workout.id}`} className="flex min-h-11 items-center justify-between gap-3">
        <h3 className="font-semibold">{workout.title || 'Workout'}</h3>
        <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Clock className="size-4" /> {formatDuration(workout.duration_seconds)}
          <ChevronRight className="size-4" />
        </span>
      </Link>
      <ul className="divide-y rounded-xl border">
        {detail.exercises.map((ex) => (
          <li key={ex.id} className="px-4 py-3">
            <p className="text-sm font-medium">{names.get(ex.exercise_id)?.name ?? 'Exercise'}</p>
            <p className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-sm tabular-nums text-muted-foreground">
              {detail.sets
                .filter((s) => s.workout_exercise_id === ex.id)
                .map((s) => (
                  <span key={s.id} className={s.is_warmup ? 'opacity-60' : undefined}>
                    {s.is_warmup && 'W '}
                    {s.weight_kg ? formatWeight(s.weight_kg, unit) : 'BW'} × {s.reps}
                  </span>
                ))}
            </p>
          </li>
        ))}
      </ul>
      {workout.notes && <p className="text-sm whitespace-pre-wrap text-muted-foreground">{workout.notes}</p>}
    </section>
  )
}
