import { Plus } from 'lucide-react'
import { useSheet } from '@/components/layout/useSheet'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import type { Profile } from '@/data/db'
import { formatHeight, formatWeight } from '@/domain/units'
import { bmi, bmiCategory } from '@/domain/vitals'
import { LogWeightDrawer } from './LogWeightDrawer'
import { useCurrentWeight } from './queries'
import { WeightHistory } from './WeightHistory'

const categoryLabel = { underweight: 'Underweight', healthy: 'Healthy range', overweight: 'Overweight', obese: 'Obese' }

export function BodyCard({ profile }: { profile: Profile }) {
  const current = useCurrentWeight()
  const log = useSheet()
  const bmiValue = profile.show_bmi && current && profile.height_cm ? bmi(current.weight_kg, profile.height_cm) : null

  return (
    <Card className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-semibold">Body</h2>
        <Button size="sm" variant="secondary" onClick={log.show}>
          <Plus /> Log weight
        </Button>
      </div>
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat label="Weight" value={current ? formatWeight(current.weight_kg, profile.weight_unit) : '—'} />
        <Stat label="Height" value={profile.height_cm ? formatHeight(profile.height_cm, profile.length_unit) : '—'} />
        {bmiValue !== null && <Stat label="BMI" value={String(bmiValue)} note={categoryLabel[bmiCategory(bmiValue)]} />}
      </dl>
      <WeightHistory unit={profile.weight_unit} />
      <LogWeightDrawer
        key={log.key}
        profile={profile}
        currentKg={current?.weight_kg ?? null}
        open={log.open}
        onOpenChange={log.onOpenChange}
      />
    </Card>
  )
}

function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="rounded-xl bg-muted/60 px-4 py-3">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-lg font-semibold tabular-nums">{value}</dd>
      {note && <dd className="text-xs text-muted-foreground">{note}</dd>}
    </div>
  )
}
