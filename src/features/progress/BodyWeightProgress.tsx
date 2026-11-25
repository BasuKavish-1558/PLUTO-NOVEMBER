import { Scale } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { Card } from '@/components/ui/card'
import { Segmented } from '@/components/ui/segmented'
import { bodyweightSeries, RANGES, type Range } from '@/domain/chartSeries'
import { toDisplayWeight, weightLabel, type WeightUnit } from '@/domain/units'
import { useWeightHistory } from '@/features/profile/queries'
import { ProgressChart } from './ProgressChart'
import { StatTiles } from './StatTiles'
import { PageSkeleton } from '@/components/ui/skeleton'

/** BV-5: dated body weight entries over time. */
export function BodyWeightProgress({ unit, today }: { unit: WeightUnit; today: string }) {
  const entries = useWeightHistory()
  const [range, setRange] = useState<Range>('3M')
  const points = useMemo(
    () => bodyweightSeries(entries ?? [], range, today).map((p) => ({ date: p.date, value: toDisplayWeight(p.weightKg, unit) })),
    [entries, range, today, unit],
  )
  const format = (v: number) => `${v} ${weightLabel(unit)}`
  if (!entries) return <PageSkeleton cards={1} />

  return (
    <Card className="space-y-4 p-4">
      <h2 className="text-sm font-semibold">Body weight</h2>
      {points.length ? (
        <>
          <StatTiles values={points.map((p) => p.value)} format={format} lowerIsBetter />
          <ProgressChart title={`Body weight (${weightLabel(unit)})`} points={points} format={format} />
        </>
      ) : (
        <p className="flex flex-col items-center gap-2 py-10 text-center text-sm text-muted-foreground">
          <Scale className="size-8" /> No weigh-ins in this range.
        </p>
      )}
      <Segmented label="Time range" value={range} options={RANGES.map((r) => ({ value: r, label: r }))} onChange={setRange} />
      <Link to="/profile" className="flex min-h-11 items-center justify-center text-sm font-medium text-primary">
        Log a weigh-in in Profile
      </Link>
    </Card>
  )
}
