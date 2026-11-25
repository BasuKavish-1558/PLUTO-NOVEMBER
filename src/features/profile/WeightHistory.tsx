import { Trash2 } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import type { BodyVital } from '@/data/db'
import { deleteWeight, restoreWeight } from '@/data/repos/vitals'
import { parseLocalDate } from '@/domain/dates'
import { formatWeight, type WeightUnit } from '@/domain/units'
import { spring } from '@/lib/motion'
import { useWeightHistory } from './queries'

const PREVIEW = 5

export function WeightHistory({ unit }: { unit: WeightUnit }) {
  const history = useWeightHistory() ?? []
  const [showAll, setShowAll] = useState(false)
  const shown = showAll ? history : history.slice(0, PREVIEW)

  async function remove(entry: BodyVital) {
    await deleteWeight(entry.id)
    toast(`Deleted ${formatWeight(entry.weight_kg, unit)}`, {
      action: { label: 'Undo', onClick: () => void restoreWeight(entry) },
    })
  }

  if (!history.length) return <p className="text-sm text-muted-foreground">No weight entries yet.</p>

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-muted-foreground">History</h3>
      <ul className="divide-y rounded-xl border">
        <AnimatePresence initial={false}>
          {shown.map((entry) => (
            <motion.li
              key={entry.id}
              layout
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={spring}
              className="flex items-center justify-between gap-3 overflow-hidden pl-4"
            >
              <span className="text-sm">
                {parseLocalDate(entry.local_date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
              <span className="flex items-center gap-1">
                <span className="font-medium tabular-nums">{formatWeight(entry.weight_kg, unit)}</span>
                <Button variant="ghost" size="icon" onClick={() => void remove(entry)} aria-label="Delete entry" className="text-muted-foreground">
                  <Trash2 />
                </Button>
              </span>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
      {history.length > PREVIEW && (
        <Button variant="ghost" className="w-full text-muted-foreground" onClick={() => setShowAll((v) => !v)}>
          {showAll ? 'Show less' : `Show all ${history.length}`}
        </Button>
      )}
    </div>
  )
}
