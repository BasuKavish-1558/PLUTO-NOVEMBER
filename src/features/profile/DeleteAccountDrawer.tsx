import { useState } from 'react'
import { toast } from 'sonner'
import { FormDrawer } from '@/components/layout/FormDrawer'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { deleteAccount } from '@/data/auth'

const CONFIRM_WORD = 'DELETE'

type Props = { open: boolean; onOpenChange: (open: boolean) => void }

export function DeleteAccountDrawer({ open, onOpenChange }: Props) {
  const [typed, setTyped] = useState('')
  const [error, setError] = useState<string>()
  const [busy, setBusy] = useState(false)

  async function confirm() {
    if (typed.trim() !== CONFIRM_WORD) return setError(`Type ${CONFIRM_WORD} to confirm`)
    if (!navigator.onLine) return setError("You're offline. Deleting your account needs a connection.")
    setBusy(true)
    try {
      await deleteAccount()
      toast.success('Your account and all its data were deleted.')
    } catch {
      setError("Couldn't delete your account. Try again in a moment.")
      setBusy(false)
    }
  }

  return (
    <FormDrawer
      open={open}
      onOpenChange={onOpenChange}
      title="Delete account?"
      description="This permanently deletes your account, workouts, body weight history and photos from every device. It can't be undone."
      submitLabel={busy ? 'Deleting…' : 'Delete forever'}
      submitVariant="destructive"
      busy={busy}
      onSubmit={confirm}
    >
      <Field label={`Type ${CONFIRM_WORD} to confirm`} htmlFor="confirm-delete" error={error}>
        <Input
          id="confirm-delete"
          autoComplete="off"
          autoCapitalize="characters"
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          aria-invalid={!!error}
        />
      </Field>
    </FormDrawer>
  )
}
