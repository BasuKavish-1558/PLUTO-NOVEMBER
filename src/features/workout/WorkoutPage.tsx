import { PageHeader } from '@/components/layout/PageHeader'
import { ActiveBanner } from './ActiveBanner'
import { SplitShortcut } from './SplitShortcut'
import { TodayCard } from './TodayCard'
import { WorkoutHistory } from './WorkoutHistory'

export function WorkoutPage() {
  return (
    <div className="space-y-5">
      <PageHeader title="Workout" />
      <ActiveBanner />
      <TodayCard />
      <SplitShortcut />
      <WorkoutHistory />
    </div>
  )
}
