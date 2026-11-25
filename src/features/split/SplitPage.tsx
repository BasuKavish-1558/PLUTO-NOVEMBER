import { BookOpen, ChevronRight, Layers, Plus } from 'lucide-react'
import { Link } from 'react-router'
import { PageHeader } from '@/components/layout/PageHeader'
import { useSheet } from '@/components/layout/useSheet'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { activateSplit } from '@/data/repos/splits'
import { trainingDaysPerWeek } from '@/domain/split'
import { useProfile } from '@/features/profile/queries'
import { NewSplitDrawer } from './NewSplitDrawer'
import { useActiveSplit, useSplits } from './queries'
import { WeekOverview } from './WeekOverview'
import { PageSkeleton } from '@/components/ui/skeleton'

export function SplitPage() {
  const profile = useProfile()
  const splits = useSplits()
  const active = useActiveSplit()
  const create = useSheet()
  if (!profile || !splits || active === undefined) return <PageSkeleton />

  const others = splits.filter((s) => s.id !== profile.active_split_id)

  return (
    <div className="space-y-5">
      <PageHeader title="Split">
        <Button variant="secondary" onClick={create.show}>
          <Plus /> New split
        </Button>
      </PageHeader>

      {active ? (
        <Card className="p-0">
          <div className="flex items-center justify-between gap-3 border-b px-5 py-4">
            <div className="min-w-0">
              <p className="text-sm text-muted-foreground">Active split · {trainingDaysPerWeek(active.days)} days a week</p>
              <h2 className="truncate text-lg font-semibold">{active.split.name}</h2>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link to={`/split/${active.split.id}`}>Edit</Link>
            </Button>
          </div>
          <WeekOverview detail={active} />
        </Card>
      ) : (
        <Card className="flex flex-col items-center px-6 py-10 text-center">
          <span className="grid size-12 place-items-center rounded-2xl bg-muted">
            <Layers className="size-6 text-muted-foreground" />
          </span>
          <h2 className="mt-4 font-semibold">{splits.length ? 'No active split' : 'Pick your weekly routine'}</h2>
          <p className="mt-1 max-w-xs text-sm text-muted-foreground">
            {splits.length ? 'Make one of your splits active below.' : 'Start from a proven preset like Push / Pull / Legs, or build your own.'}
          </p>
          {!splits.length && (
            <Button className="mt-5" onClick={create.show}>
              <Plus /> New split
            </Button>
          )}
        </Card>
      )}

      {others.length > 0 && (
        <section className="space-y-2">
          <h2 className="px-1 text-sm font-semibold">Other splits</h2>
          <ul className="divide-y overflow-hidden rounded-xl border bg-card">
            {others.map((s) => (
              <li key={s.id} className="flex min-h-14 items-center gap-2 pr-3">
                <Link to={`/split/${s.id}`} className="flex min-h-14 min-w-0 flex-1 items-center px-5 font-medium">
                  <span className="truncate">{s.name}</span>
                </Link>
                <Button size="sm" variant="outline" onClick={() => void activateSplit(profile.id, s.id)}>
                  Make active
                </Button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Button variant="secondary" size="lg" className="w-full md:hidden" onClick={create.show}>
        <Plus /> New split
      </Button>

      <Link
        to="/split/library"
        className="flex min-h-16 items-center gap-4 rounded-xl border bg-card px-5 transition-colors hover:bg-muted/50 active:bg-muted"
      >
        <span className="grid size-10 place-items-center rounded-xl bg-muted">
          <BookOpen className="size-5 text-primary" />
        </span>
        <span className="flex-1">
          <span className="block font-medium">Exercise library</span>
          <span className="block text-sm text-muted-foreground">Browse, search and add your own exercises</span>
        </span>
        <ChevronRight className="size-5 text-muted-foreground" />
      </Link>

      <NewSplitDrawer key={create.key} profile={profile} open={create.open} onOpenChange={create.onOpenChange} />
    </div>
  )
}
