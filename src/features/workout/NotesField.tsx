import { Field } from '@/components/ui/field'

const MAX_NOTES = 2000

/** WK-8: optional notes, saved with every keystroke like the rest of the workout. */
export function NotesField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <Field label="Notes" htmlFor="workout-notes">
      <textarea
        id="workout-notes"
        rows={3}
        maxLength={MAX_NOTES}
        placeholder="How did it feel? Anything to remember next time?"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full resize-y rounded-xl border bg-background px-4 py-3 text-base outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-input/30"
      />
    </Field>
  )
}
