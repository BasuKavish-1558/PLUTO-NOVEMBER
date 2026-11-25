import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Chip, ChipRow } from '@/components/ui/chip'
import { addProtein } from '@/data/repos/nutrition'
import { useUser } from '@/stores/session'
import type { QuickItem } from './queries'

/** One tap logs a recent entry again; "Custom" opens the form. */
export function QuickAdd({ items, date, onCustom }: { items: QuickItem[]; date: string; onCustom: () => void }) {
  const { userId } = useUser()

  async function add({ amount, label }: QuickItem) {
    await addProtein(userId, amount, label, date)
    toast.success(`Added ${amount} g${label ? ` · ${label}` : ''}`)
  }

  return (
    <ChipRow role="group" aria-label="Quick add">
      {items.map((item) => (
        <Chip key={`${item.label}|${item.amount}`} selected={false} onClick={() => void add(item)}>
          +{item.amount} g{item.label && <span className="ml-1 max-w-32 truncate text-muted-foreground">· {item.label}</span>}
        </Chip>
      ))}
      <Chip selected={false} onClick={onCustom}>
        <Plus className="mr-1 size-4" /> Custom
      </Chip>
    </ChipRow>
  )
}
