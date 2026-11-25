import { MailCheck } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import * as z from 'zod/mini'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { requestPasswordReset } from '@/data/auth'
import { authErrorMessage } from './authErrors'

const emailSchema = z.email({ error: 'Enter a valid email address' })

/** Sends a recovery link that opens /reset-password, where a new password is set. */
export function ForgotPasswordForm({ initialEmail, onBack }: { initialEmail: string; onBack: () => void }) {
  const [email, setEmail] = useState(initialEmail)
  const [error, setError] = useState<string>()
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    const parsed = emailSchema.safeParse(email.trim())
    if (!parsed.success) return setError(parsed.error.issues[0]?.message)
    setError(undefined)
    setBusy(true)
    try {
      await requestPasswordReset(parsed.data)
      setSent(true)
    } catch (err) {
      setError(authErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  if (sent) {
    return (
      <div className="space-y-4 text-center" role="status">
        <MailCheck className="mx-auto size-10 text-primary" />
        <p className="text-sm text-muted-foreground">
          If an account exists for <span className="font-medium text-foreground">{email.trim()}</span>, a reset link is on its way. Open it
          on this device to choose a new password.
        </p>
        <Button variant="outline" className="w-full" onClick={onBack}>
          Back to sign in
        </Button>
      </div>
    )
  }

  return (
    <form noValidate onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-1">
        <h2 className="font-semibold">Reset your password</h2>
        <p className="text-sm text-muted-foreground">We'll email you a link to choose a new one.</p>
      </div>
      <Field label="Email" htmlFor="reset-email" error={error}>
        <Input id="reset-email" type="email" inputMode="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={!!error} />
      </Field>
      <Button type="submit" size="lg" className="w-full" disabled={busy}>
        {busy ? 'Sending…' : 'Send reset link'}
      </Button>
      <Button type="button" variant="ghost" className="w-full" onClick={onBack}>
        Back to sign in
      </Button>
    </form>
  )
}
