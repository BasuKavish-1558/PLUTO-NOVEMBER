import { CalendarDays, Layers, Play, Plus } from 'lucide-react'
import { Link } from 'react-router'
import { useSheet } from '@/components/layout/useSheet'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { toLocalDate } from '@/domain/dates'
import { formatTargets, splitDayFor } from '@/domain/split'
import { useExerciseMap } from '@/features/library/queries'
import { useActiveSplit } from '@/features/split/queries'
import { dayTitle } from '@/features/split/splitText'
import { DayPickerDrawer } from './DayPickerDrawer'
import { EMPTY_PLAN, planFromDay, useStartWorkout } from './useStartWorkout'
import { SPLIT_PATH } from '@/features/split/paths'

const PREVIEW = 6

/** SP-7: today's planned day from the active split, with quick start (placed on Workout, see PLAN A2). */
export function TodayCard() {
  const active = useActiveSplit()
  const exercises = useExerciseMap()
  const start = useStartWorkout()
  const picker = useSheet()
  const weekday = new Date().toLocaleDateString(undefined, { weekday: 'long' })
  if (active === undefined) return <Card className="h-48 animate-pulse motion-reduce:animate-none" />

  const day = active && splitDayFor(active.days, toLocalDate(new Date()))
  const training = day && !day.is_rest

  return (
    <Card className="space-y-4">
      <div>
        <p className="text-sm text-muted-foreground">
          Today · {weekday}
          {active && ` · ${active.split.name}`}
        </p>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight">
          {!active ? 'No active split' : training ? dayTitle(day) : 'Rest day'}
        </h2>
      </div>

      {training && day.items.length > 0 && (
        <ol className="space-y-1.5 text-sm">
          {day.items.slice(0, PREVIEW).map((item) => (
            <li key={item.id} className="flex justify-between gap-3">
              <span className="truncate">{exercises.get(item.exercise_id)?.name ?? 'Exercise'}</span>
              <span className="shrink-0 text-muted-foreground tabular-nums">
                {formatTargets({ sets: item.target_sets, repsMin: item.target_reps_min, repsMax: item.target_reps_max })}
              </span>
            </li>
          ))}
          {day.items.length > PREVIEW && <li className="text-muted-foreground">+{day.items.length - PREVIEW} more</li>}
        </ol>
      )}

      {!active ? (
        <>
          <p className="text-sm text-muted-foreground">Pick a split and today's workout shows up here.</p>
          <Button asChild size="lg" className="w-full">
            <Link to={SPLIT_PATH}>
              <Layers className="size-5" /> Choose a split
            </Link>
          </Button>
        </>
      ) : (
        <>
          {training && (
            <Button size="lg" className="w-full" onClick={() => void start(planFromDay(day))}>
              <Play className="size-5" /> Start {dayTitle(day)}
            </Button>
          )}
          <Button size="lg" variant={training ? 'outline' : 'default'} className="w-full" onClick={picker.show}>
            <CalendarDays className="size-5" /> {training ? 'Pick another day' : 'Train a split day anyway'}
          </Button>
          <DayPickerDrawer split={active} open={picker.open} onOpenChange={picker.onOpenChange} />
        </>
      )}
      <Button size="lg" variant="outline" className="w-full" onClick={() => void start(EMPTY_PLAN)}>
        <Plus className="size-5" /> Empty workout
      </Button>
    </Card>
  )
}
