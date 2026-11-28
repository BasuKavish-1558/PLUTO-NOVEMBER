import { useState } from 'react'
import { toast } from 'sonner'
import { FormDrawer } from '@/components/layout/FormDrawer'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { addDays, type LocalDate } from '@/domain/dates'
import { logMissedDay } from '@/data/repos/nutrition'
import { useUser } from '@/stores/session'
import { dayLabel } from './dayLabel'

const MAX_LABEL = 60
const MAX_AMOUNT = 1000

type Props = { today: LocalDate; open: boolean; onOpenChange: (open: boolean) => void }

/** History → Edit: pick a past day that was never logged and enter the protein eaten that day. */
export function MissedDayDrawer({ today, open, onOpenChange }: Props) {
  const { userId } = useUser()
  const yesterday = addDays(today, -1)
  const [date, setDate] = useState<LocalDate>(yesterday)
  const [amount, setAmount] = useState('')
  const [label, setLabel] = useState('')
  const [dateError, setDateError] = useState<string>()
  const [amountError, setAmountError] = useState<string>()

  async function save() {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date >= today) return setDateError('Pick a day before today')
    const n = Number(amount.replace(',', '.'))
    if (!amount.trim() || !Number.isFinite(n) || n <= 0 || n > MAX_AMOUNT) return setAmountError(`Enter grams from 1 to ${MAX_AMOUNT}`)
    const result = await logMissedDay(userId, n, label, date)
    if (result === 'already_logged') return setDateError(`Protein is already logged for ${dayLabel(date, today)}. Open that day from History to change it.`)
    toast.success(`Logged ${Math.round(n * 10) / 10} g for ${dayLabel(date, today)}`)
    onOpenChange(false)
  }

  return (
    <FormDrawer open={open} onOpenChange={onOpenChange} title="Log a missed day" submitLabel="Log" onSubmit={save}>
      <Field label="Date" htmlFor="missed-date" error={dateError}>
        <Input
          id="missed-date"
          type="date"
          max={yesterday}
          value={date}
          onChange={(e) => {
            setDate(e.target.value)
            setDateError(undefined)
          }}
          aria-invalid={!!dateError}
          aria-describedby={dateError ? 'missed-date-msg' : undefined}
        />
      </Field>
      <Field label="Protein" htmlFor="missed-amount" error={amountError}>
        <div className="relative">
          <Input
            id="missed-amount"
            inputMode="decimal"
            placeholder="120"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value)
              setAmountError(undefined)
            }}
            aria-invalid={!!amountError}
            className="pr-12"
          />
          <span className="pointer-events-none absolute inset-y-0 right-4 grid place-items-center text-sm text-muted-foreground">g</span>
        </div>
      </Field>
      <Field label="Label (optional)" htmlFor="missed-label">
        <Input id="missed-label" placeholder="e.g. Whole day" maxLength={MAX_LABEL} value={label} onChange={(e) => setLabel(e.target.value)} />
      </Field>
    </FormDrawer>
  )
}
