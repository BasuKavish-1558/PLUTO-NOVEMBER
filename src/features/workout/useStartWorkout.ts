import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { startWorkout, type StartPlan } from '@/data/repos/workouts'
import type { DayWithItems } from '@/features/split/queries'
import { dayTitle } from '@/features/split/splitText'
import { useActiveWorkout } from '@/stores/activeWorkout'
import { useUser } from '@/stores/session'

type Plan = Omit<StartPlan, 'userId'>

export const planFromDay = (day: DayWithItems): Plan => ({
  title: dayTitle(day),
  splitDayId: day.id,
  items: day.items.map((i) => ({ exerciseId: i.exercise_id, targets: { sets: i.target_sets, repsMin: i.target_reps_min } })),
})

export const EMPTY_PLAN: Plan = { title: 'Workout', splitDayId: null, items: [] }

/** WK-1. Only one workout runs at a time; starting another resumes the current one. */
export function useStartWorkout() {
  const navigate = useNavigate()
  const { userId } = useUser()
  const active = useActiveWorkout((s) => s.workout)
  const begin = useActiveWorkout((s) => s.begin)

  return async (plan: Plan) => {
    if (active) {
      toast('You already have a workout going. Finish or discard it first.')
      navigate('/workout/live')
      return
    }
    begin(await startWorkout({ ...plan, userId }))
    navigate('/workout/live')
  }
}
