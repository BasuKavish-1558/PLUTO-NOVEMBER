import { Trash2 } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import type { NutritionEntry } from '@/data/db'
import { deleteEntry, restoreEntry } from '@/data/repos/nutrition'
import { spring } from '@/lib/motion'

export function EntryList({ entries, empty }: { entries: NutritionEntry[]; empty: string }) {
  async function remove(entry: NutritionEntry) {
    await deleteEntry(entry.id)
    toast(`Removed ${entry.amount} g`, { action: { label: 'Undo', onClick: () => void restoreEntry(entry) } })
  }

  if (!entries.length) return <p className="py-2 text-sm text-muted-foreground">{empty}</p>

  return (
    <ul className="divide-y rounded-xl border">
      <AnimatePresence initial={false}>
        {entries.map((e) => (
          <motion.li
            key={e.id}
            layout
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={spring}
            className="flex items-center gap-3 overflow-hidden pl-4"
          >
            <span className="min-w-0 flex-1 py-2">
              <span className="block truncate">{e.label ?? 'Protein'}</span>
              <span className="block text-xs text-muted-foreground">
                {new Date(e.created_at).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
              </span>
            </span>
            <span className="font-medium tabular-nums">{e.amount} g</span>
            <Button variant="ghost" size="icon" aria-label={`Delete ${e.label ?? 'entry'} ${e.amount} g`} onClick={() => void remove(e)} className="text-muted-foreground">
              <Trash2 />
            </Button>
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
  )
}
