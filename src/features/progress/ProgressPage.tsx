import { useSearchParams } from 'react-router'
import { PageHeader } from '@/components/layout/PageHeader'
import { Segmented } from '@/components/ui/segmented'
import { PageSkeleton } from '@/components/ui/skeleton'
import { useProfile } from '@/features/profile/queries'
import { useToday } from '@/lib/useToday'
import { BodyWeightProgress } from './BodyWeightProgress'
import { ExerciseProgress } from './ExerciseProgress'
import { usePrs, useTrainingHistory } from './queries'

const TABS = [
  { value: 'exercises', label: 'Exercises' },
  { value: 'body', label: 'Body weight' },
] as const

/** Charts are derived from local history on every render; nothing is stored (rule 4). */
export function ProgressPage() {
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab') === 'body' ? 'body' : 'exercises'
  const history = useTrainingHistory()
  const prs = usePrs()
  const unit = useProfile()?.weight_unit ?? 'kg'
  const today = useToday()

  const set = (key: string, value: string) =>
    setParams((p) => {
      p.set(key, value)
      return p
    }, { replace: true })

  return (
    <div className="space-y-4">
      <PageHeader title="Progress" />
      <Segmented label="Progress view" value={tab} options={TABS} onChange={(t) => set('tab', t)} />
      {tab === 'body' ? (
        <BodyWeightProgress unit={unit} today={today} />
      ) : !history || !prs ? (
        <PageSkeleton cards={2} />
      ) : (
        history &&
        prs && (
          <ExerciseProgress
            exerciseId={params.get('exercise')}
            onExercise={(id) => set('exercise', id)}
            history={history}
            prs={prs}
            unit={unit}
            today={today}
          />
        )
      )}
    </div>
  )
}
