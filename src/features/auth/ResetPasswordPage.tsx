import { KeyRound, LinkIcon } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Field } from '@/components/ui/field'
import { PasswordInput } from '@/components/ui/password-input'
import { recoverySession, setNewPassword } from '@/data/auth'
import { authErrorMessage } from './authErrors'

const MIN_PASSWORD = 8

/** Errors Supabase appends to the redirect when a link is used twice or has expired. */
function linkError(): string | null {
  const params = new URLSearchParams(window.location.hash.slice(1) || window.location.search.slice(1))
  if (!params.get('error') && !params.get('error_code')) return null
  return params.get('error_code') === 'otp_expired'
    ? 'This reset link has expired or was already used.'
    : (params.get('error_description')?.replace(/\+/g, ' ') ?? 'This reset link is not valid.')
}

/**
 * Where the recovery email lands (`/reset-password`). supabase-js turns the link into a session;
 * the user then picks a new password and continues into the app, already signed in.
 */
export function ResetPasswordPage() {
  const navigate = useNavigate()
  const [state, setState] = useState<'checking' | 'ready' | 'invalid'>(() => (linkError() ? 'invalid' : 'checking'))
  const [invalidReason] = useState(linkError)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [errors, setErrors] = useState<{ password?: string; confirm?: string; form?: string }>({})
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (state !== 'checking') return
    let cancelled = false
    void recoverySession().then((ok) => !cancelled && setState(ok ? 'ready' : 'invalid'))
    return () => {
      cancelled = true
    }
  }, [state])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    const next = {
      password: password.length < MIN_PASSWORD ? `Use at least ${MIN_PASSWORD} characters` : undefined,
      confirm: confirm !== password ? "The passwords don't match" : undefined,
    }
    if (next.password || next.confirm) return setErrors(next)
    setErrors({})
    setBusy(true)
    try {
      await setNewPassword(password)
      toast.success('Password updated. You are signed in.')
      navigate('/', { replace: true })
    } catch (err) {
      setErrors({ form: authErrorMessage(err) })
      setBusy(false)
    }
  }

  return (
    <main className="grid min-h-dvh place-items-center px-4 py-10">
      <Card className="w-full max-w-sm space-y-5">
        {state === 'invalid' ? (
          <div className="space-y-4 text-center">
            <LinkIcon className="mx-auto size-10 text-muted-foreground" />
            <h1 className="font-semibold">Link not valid</h1>
            <p className="text-sm text-muted-foreground">{invalidReason ?? 'This reset link has expired or was already used.'} Request a new one.</p>
            <Button asChild className="w-full">
              <Link to="/auth">Back to sign in</Link>
            </Button>
          </div>
        ) : (
          <form noValidate onSubmit={onSubmit} className="space-y-4" aria-busy={state === 'checking'}>
            <div className="space-y-1">
              <KeyRound className="size-8 text-primary" />
              <h1 className="text-xl font-semibold">Choose a new password</h1>
              <p className="text-sm text-muted-foreground">At least {MIN_PASSWORD} characters.</p>
            </div>
            <Field label="New password" htmlFor="new-password" error={errors.password}>
              <PasswordInput id="new-password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} aria-invalid={!!errors.password} />
            </Field>
            <Field label="Confirm password" htmlFor="confirm-password" error={errors.confirm}>
              <PasswordInput id="confirm-password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} aria-invalid={!!errors.confirm} />
            </Field>
            {errors.form && (
              <p role="alert" className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {errors.form}
              </p>
            )}
            <Button type="submit" size="lg" className="w-full" disabled={busy || state === 'checking'}>
              {state === 'checking' ? 'Checking link…' : busy ? 'Saving…' : 'Save password'}
            </Button>
          </form>
        )}
      </Card>
    </main>
  )
}
