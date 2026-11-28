import { useState } from 'react'
import { toast } from 'sonner'
import { FormDrawer } from '@/components/layout/FormDrawer'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { addProtein } from '@/data/repos/nutrition'
import { useUser } from '@/stores/session'

const MAX_LABEL = 60
const MAX_AMOUNT = 1000

type Props = { date: string; title?: string; open: boolean; onOpenChange: (open: boolean) => void }

/** NT-2: grams eaten plus an optional label. (These are intake grams, not the goal; the goal is never typed.) */
export function AddEntryDrawer({ date, title = 'Add protein', open, onOpenChange }: Props) {
  const { userId } = useUser()
  const [amount, setAmount] = useState('')
  const [label, setLabel] = useState('')
  const [error, setError] = useState<string>()

  async function save() {
    const n = Number(amount.replace(',', '.'))
    if (!amount.trim() || !Number.isFinite(n) || n <= 0 || n > MAX_AMOUNT) return setError(`Enter grams from 1 to ${MAX_AMOUNT}`)
    await addProtein(userId, n, label, date)
    toast.success(`Added ${Math.round(n * 10) / 10} g${label.trim() ? ` · ${label.trim()}` : ''}`)
    onOpenChange(false)
  }

  return (
    <FormDrawer open={open} onOpenChange={onOpenChange} title={title} submitLabel="Add" onSubmit={save}>
      <Field label="Protein" htmlFor="entry-amount" error={error}>
        <div className="relative">
          <Input
            id="entry-amount"
            inputMode="decimal"
            placeholder="25"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value)
              setError(undefined)
            }}
            aria-invalid={!!error}
            className="pr-12"
          />
          <span className="pointer-events-none absolute inset-y-0 right-4 grid place-items-center text-sm text-muted-foreground">g</span>
        </div>
      </Field>
      <Field label="Label (optional)" htmlFor="entry-label">
        <Input id="entry-label" placeholder="e.g. Whey shake" maxLength={MAX_LABEL} value={label} onChange={(e) => setLabel(e.target.value)} />
      </Field>
    </FormDrawer>
  )
}
