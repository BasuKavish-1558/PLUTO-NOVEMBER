import { Check, Pencil, Scale } from 'lucide-react'
import { motion } from 'motion/react'
import { Link } from 'react-router'
import { PageHeader } from '@/components/layout/PageHeader'
import { useSheet } from '@/components/layout/useSheet'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { formatWeight } from '@/domain/units'
import { useProfile } from '@/features/profile/queries'
import { spring } from '@/lib/motion'
import { useToday } from '@/lib/useToday'
import { AddEntryDrawer } from './AddEntryDrawer'
import { EntryList } from './EntryList'
import { GoalDrawer } from './GoalDrawer'
import { NutritionHistory } from './NutritionHistory'
import { ProteinRing } from './ProteinRing'
import { useProtein } from './queries'
import { QuickAdd } from './QuickAdd'
import { PageSkeleton } from '@/components/ui/skeleton'

export function NutritionPage() {
  const today = useToday() // totals reset at local midnight (NT-4)
  const protein = useProtein(today)
  const unit = useProfile()?.weight_unit ?? 'kg'
  const add = useSheet()
  const editGoal = useSheet()
  if (!protein) return <PageSkeleton />
  const { goal, total } = protein
  const left = goal ? Math.max(0, Math.round((goal.grams - total) * 10) / 10) : 0

  return (
    <div className="space-y-5">
      <PageHeader title="Nutrition" />

      <Card className="flex flex-col items-center gap-4 py-8">
        <ProteinRing consumed={total} goal={goal?.grams ?? 0} />
        {goal ? (
          left > 0 ? (
            <p className="text-sm text-muted-foreground tabular-nums">{left} g to go today</p>
          ) : (
            <motion.p initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ ...spring, damping: 14 }} className="flex items-center gap-1.5 text-sm font-medium text-primary">
              <Check className="size-4" /> Goal reached
            </motion.p>
          )
        ) : (
          <p className="max-w-xs text-center text-sm text-muted-foreground">
            Log your body weight in <Link to="/profile" className="font-medium text-primary">Profile</Link> to get a daily goal.
          </p>
        )}
        <div className="w-full px-5">
          <QuickAdd items={protein.quick} date={today} onCustom={add.show} />
        </div>
      </Card>

      {goal && (
        <Card className="flex items-center gap-4">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-muted">
            <Scale className="size-5 text-primary" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-medium tabular-nums">{goal.grams} g a day</p>
            <p className="text-sm text-muted-foreground tabular-nums">
              {formatWeight(goal.weightKg, unit)} × {goal.multiplier.toFixed(1)} g/kg
              {goal.goalType && ` · ${goal.goalType[0]!.toUpperCase()}${goal.goalType.slice(1)}`}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={editGoal.show}>
            <Pencil /> Edit
          </Button>
        </Card>
      )}

      <section className="space-y-2">
        <h2 className="px-1 text-sm font-semibold">Today</h2>
        <EntryList entries={protein.todayEntries} empty="Nothing logged yet today. Tap a quick-add above." />
      </section>

      <NutritionHistory days={protein.history.filter((d) => d.date !== today)} entriesOn={protein.entriesOn} />

      <AddEntryDrawer key={`add-${add.key}`} date={today} open={add.open} onOpenChange={add.onOpenChange} />
      {goal && <GoalDrawer key={`goal-${editGoal.key}`} goal={goal} unit={unit} today={today} open={editGoal.open} onOpenChange={editGoal.onOpenChange} />}
    </div>
  )
}
