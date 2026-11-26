import { ChevronDown, LineChart, Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { EmptyState } from '@/components/layout/EmptyState'
import { useSheet } from '@/components/layout/useSheet'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Segmented } from '@/components/ui/segmented'
import type { PersonalRecord } from '@/data/db'
import { exerciseSeries, RANGES, type Range } from '@/domain/chartSeries'
import { toDisplayWeight, weightLabel, type WeightUnit } from '@/domain/units'
import { useExerciseMap } from '@/features/library/queries'
import { PrFormDrawer } from '@/features/prs/PrFormDrawer'
import { PrList } from '@/features/prs/PrList'
import { ExerciseSelectDrawer } from './ExerciseSelectDrawer'
import { ProgressChart } from './ProgressChart'
import type { TrainingHistory } from './queries'
import { StatTiles } from './StatTiles'

const METRICS = [
  { value: 'top', label: 'Weight' },
  { value: 'e1rm', label: '1RM' },
] as const
type Metric = (typeof METRICS)[number]['value']
const METRIC_TITLE: Record<Metric, string> = { top: 'Top working-set weight', e1rm: '1RM · estimated from your sets' }

type Props = {
  exerciseId: string | null
  onExercise: (id: string) => void
  history: TrainingHistory
  prs: PersonalRecord[]
  unit: WeightUnit
  today: string
}

export function ExerciseProgress({ exerciseId, onExercise, history, prs, unit, today }: Props) {
  const exercises = useExerciseMap()
  const [metric, setMetric] = useState<Metric>('top')
  const [range, setRange] = useState<Range>('3M')
  const select = useSheet()
  const logPr = useSheet()
  const [editing, setEditing] = useState<PersonalRecord | null>(null)

  const recent = useMemo(() => {
    const started = new Map(history.workouts.map((w) => [w.id, w.started_at]))
    const last = new Map<string, string>()
    for (const e of history.exercises) {
      const at = started.get(e.workout_id) ?? ''
      if (at > (last.get(e.exercise_id) ?? '')) last.set(e.exercise_id, at)
    }
    return [...last].sort((a, b) => b[1].localeCompare(a[1])).flatMap(([id]) => exercises.get(id) ?? []).slice(0, 8)
  }, [history, exercises])

  const id = exerciseId ?? recent[0]?.id ?? null
  const exercise = id ? exercises.get(id) : undefined
  const points = useMemo(
    () => (id ? exerciseSeries(id, history.workouts, history.exercises, history.sets, range, today) : []),
    [id, history, range, today],
  )
  const values = points.map((p) => toDisplayWeight(metric === 'top' ? p.topWeightKg : p.e1rmKg, unit))
  const format = (v: number) => `${Math.round(v * 10) / 10} ${weightLabel(unit)}`
  const exercisePrs = prs.filter((p) => p.exercise_id === id)

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={select.show}
        className="flex min-h-14 w-full items-center justify-between gap-3 rounded-xl border bg-card px-4 text-left"
      >
        <span className="min-w-0">
          <span className="block text-xs text-muted-foreground">Exercise</span>
          <span className="block truncate font-semibold">{exercise?.name ?? 'Choose an exercise'}</span>
          <span className="sr-only">, change</span>
        </span>
        <ChevronDown className="size-5 shrink-0 text-muted-foreground" />
      </button>

      {exercise && (
        <>
          <Card className="space-y-4 p-4">
            <Segmented label="Metric" value={metric} options={METRICS} onChange={setMetric} />
            <h2 className="text-sm font-semibold">{METRIC_TITLE[metric]}</h2>
            {points.length ? (
              <>
                <StatTiles values={values} format={format} />
                <ProgressChart title={`${exercise.name}: ${METRIC_TITLE[metric]} (${weightLabel(unit)})`} points={points.map((p, i) => ({ date: p.date, value: values[i]! }))} format={format} />
              </>
            ) : (
              <p className="flex flex-col items-center gap-2 py-10 text-center text-sm text-muted-foreground">
                <LineChart className="size-8" /> No working sets in this range yet.
              </p>
            )}
            <Segmented label="Time range" value={range} options={RANGES.map((r) => ({ value: r, label: r }))} onChange={setRange} />
          </Card>

          <section className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-sm font-semibold">Personal records</h2>
              <Button size="sm" variant="secondary" onClick={() => { setEditing(null); logPr.show() }}>
                <Plus /> Log PR
              </Button>
            </div>
            <PrList prs={exercisePrs} allPrs={prs} unit={unit} onSelect={(pr) => { setEditing(pr); logPr.show() }} />
          </section>

          <PrFormDrawer
            key={logPr.key}
            exerciseId={exercise.id}
            exerciseName={exercise.name}
            pr={editing ?? undefined}
            allPrs={prs}
            unit={unit}
            open={logPr.open}
            onOpenChange={logPr.onOpenChange}
          />
        </>
      )}
      {!exercise && (
        <EmptyState icon={LineChart} title="No progress to chart yet">
          Finish a workout and your weights and estimated 1RM show up here. You can also pick any exercise above.
        </EmptyState>
      )}
      <ExerciseSelectDrawer key={select.key} recent={recent} open={select.open} onOpenChange={select.onOpenChange} onSelect={onExercise} />
    </div>
  )
}
