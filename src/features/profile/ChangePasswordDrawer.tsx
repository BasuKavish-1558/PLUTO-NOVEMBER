import { useState } from 'react'
import { toast } from 'sonner'
import { FormDrawer } from '@/components/layout/FormDrawer'
import { Field } from '@/components/ui/field'
import { PasswordInput } from '@/components/ui/password-input'
import { changePassword } from '@/data/auth'
import { authErrorMessage } from '@/features/auth/authErrors'
import { useUser } from '@/stores/session'

const MIN_PASSWORD = 8
type Errors = Partial<Record<'current' | 'next' | 'confirm' | 'form', string>>

/** Needs the current password (re-authentication) and a connection. */
export function ChangePasswordDrawer({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { email } = useUser()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [errors, setErrors] = useState<Errors>({})
  const [busy, setBusy] = useState(false)

  async function save() {
    const found: Errors = {
      current: current ? undefined : 'Enter your current password',
      next: next.length < MIN_PASSWORD ? `Use at least ${MIN_PASSWORD} characters` : next === current ? 'Choose a password different from your current one' : undefined,
      confirm: confirm !== next ? "The passwords don't match" : undefined,
    }
    if (found.current || found.next || found.confirm) return setErrors(found)
    if (!navigator.onLine) return setErrors({ form: "You're offline. Changing your password needs a connection." })
    setErrors({})
    setBusy(true)
    try {
      await changePassword(email, current, next)
      toast.success('Password changed')
      onOpenChange(false)
    } catch (err) {
      const message = authErrorMessage(err)
      setErrors((err as { code?: string }).code === 'wrong_current_password' ? { current: message } : { form: message })
      setBusy(false)
    }
  }

  return (
    <FormDrawer open={open} onOpenChange={onOpenChange} title="Change password" submitLabel={busy ? 'Saving…' : 'Change password'} busy={busy} onSubmit={save}>
      <Field label="Current password" htmlFor="current-password" error={errors.current}>
        <PasswordInput id="current-password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} aria-invalid={!!errors.current} />
      </Field>
      <Field label="New password" htmlFor="next-password" error={errors.next} hint={errors.next ? undefined : `At least ${MIN_PASSWORD} characters`}>
        <PasswordInput id="next-password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} aria-invalid={!!errors.next} />
      </Field>
      <Field label="Confirm new password" htmlFor="confirm-next-password" error={errors.confirm}>
        <PasswordInput id="confirm-next-password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} aria-invalid={!!errors.confirm} />
      </Field>
      {errors.form && (
        <p role="alert" className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {errors.form}
        </p>
      )}
    </FormDrawer>
  )
}
