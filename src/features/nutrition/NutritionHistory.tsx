import { ChevronRight } from 'lucide-react'
import { motion } from 'motion/react'
import { useState } from 'react'
import { useSheet } from '@/components/layout/useSheet'
import { Button } from '@/components/ui/button'
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import type { NutritionEntry } from '@/data/db'
import { parseLocalDate } from '@/domain/dates'
import { spring } from '@/lib/motion'
import { AddEntryDrawer } from './AddEntryDrawer'
import { EntryList } from './EntryList'

type Day = { date: string; total: number; goal: number | null }
type Props = { days: Day[]; entriesOn: (date: string) => NutritionEntry[] }

const PAGE = 14
const label = (date: string) => parseLocalDate(date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })

/** NT-4: past days are kept; tap one to see, add or remove its entries. */
export function NutritionHistory({ days, entriesOn }: Props) {
  const [open, setOpen] = useState<string | null>(null)
  const [limit, setLimit] = useState(PAGE)
  const add = useSheet()
  if (!days.length) return null
  const selected = days.find((d) => d.date === open)

  return (
    <section className="space-y-2">
      <h2 className="px-1 text-sm font-semibold">History</h2>
      <ul className="divide-y overflow-hidden rounded-xl border bg-card">
        {days.slice(0, limit).map((d) => {
          const ratio = d.goal ? Math.min(d.total / d.goal, 1) : 0
          return (
            <li key={d.date}>
              <button type="button" onClick={() => setOpen(d.date)} className="flex min-h-14 w-full items-center gap-3 px-5 py-2 text-left hover:bg-muted/50 active:bg-muted">
                <span className="w-24 shrink-0 text-sm">{label(d.date)}</span>
                <span className="h-2 flex-1 overflow-hidden rounded-full bg-cell">
                  <motion.span className="block h-full rounded-full bg-primary" initial={{ width: 0 }} animate={{ width: `${ratio * 100}%` }} transition={spring} />
                </span>
                <span className="w-24 shrink-0 text-right text-sm tabular-nums text-muted-foreground">
                  {d.total}
                  {d.goal ? ` / ${d.goal}` : ''} g
                </span>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
              </button>
            </li>
          )
        })}
      </ul>
      {days.length > limit && (
        <Button variant="ghost" className="w-full text-muted-foreground" onClick={() => setLimit((n) => n + PAGE)}>
          Show more
        </Button>
      )}
      <Drawer open={!!selected} onOpenChange={(o) => !o && setOpen(null)}>
        <DrawerContent className="mx-auto max-h-[85dvh] max-w-md">
          {selected && (
            <>
              <DrawerHeader className="text-left">
                <DrawerTitle>{label(selected.date)}</DrawerTitle>
                <DrawerDescription>
                  {selected.total} g{selected.goal ? ` of ${selected.goal} g` : ''}
                </DrawerDescription>
              </DrawerHeader>
              <div className="space-y-3 overflow-y-auto px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
                <EntryList entries={entriesOn(selected.date)} empty="No entries left on this day." />
                <Button variant="secondary" className="w-full" onClick={add.show}>
                  Add to this day
                </Button>
              </div>
            </>
          )}
        </DrawerContent>
      </Drawer>
      {open && <AddEntryDrawer key={add.key} date={open} open={add.open} onOpenChange={add.onOpenChange} />}
    </section>
  )
}
