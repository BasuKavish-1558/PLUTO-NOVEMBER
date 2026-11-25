import { MailCheck } from 'lucide-react'
import { useState, type FormEvent } from 'react'
// zod/mini: this form is on the first screen, so it shares the startup bundle's tiny Zod build.
import * as z from 'zod/mini'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { signIn, signUp } from '@/data/auth'
import { authErrorMessage } from './authErrors'

export type AuthMode = 'signUp' | 'signIn'

const MIN_PASSWORD = 8
const schemas = {
  signUp: z.object({
    email: z.email({ error: 'Enter a valid email address' }),
    password: z.string().check(z.minLength(MIN_PASSWORD, { error: `Use at least ${MIN_PASSWORD} characters` })),
  }),
  signIn: z.object({
    email: z.email({ error: 'Enter a valid email address' }),
    password: z.string().check(z.minLength(1, { error: 'Enter your password' })),
  }),
}

type Errors = Partial<Record<'email' | 'password' | 'form', string>>

type Props = { mode: AuthMode; onSwitch: (m: AuthMode) => void; onForgot: (email: string) => void }

export function AuthForm({ mode, onSwitch, onForgot }: Props) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<Errors>({})
  const [busy, setBusy] = useState(false)
  const [confirmSent, setConfirmSent] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    const parsed = schemas[mode].safeParse({ email: email.trim(), password })
    if (!parsed.success) {
      const first = (field: string) => parsed.error.issues.find((i) => i.path[0] === field)?.message
      return setErrors({ email: first('email'), password: first('password') })
    }
    setErrors({})
    setBusy(true)
    try {
      if (mode === 'signIn') await signIn(parsed.data.email, parsed.data.password)
      else if (await signUp(parsed.data.email, parsed.data.password)) setConfirmSent(true)
      // On success the session listener loads the profile and the route guard moves on.
    } catch (err) {
      setErrors({ form: authErrorMessage(err) })
    } finally {
      setBusy(false)
    }
  }

  if (confirmSent) {
    return (
      <div className="space-y-4 text-center">
        <MailCheck className="mx-auto size-10 text-primary" />
        <p className="text-sm text-muted-foreground">
          We sent a confirmation link to <span className="font-medium text-foreground">{email}</span>. Open it, then sign in.
        </p>
        <Button variant="outline" className="w-full" onClick={() => onSwitch('signIn')}>
          Go to sign in
        </Button>
      </div>
    )
  }

  return (
    <form noValidate onSubmit={onSubmit} className="space-y-4">
      <Field label="Email" htmlFor="email" error={errors.email}>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={!!errors.email}
        />
      </Field>
      <Field
        label="Password"
        htmlFor="password"
        error={errors.password}
        hint={mode === 'signUp' ? `At least ${MIN_PASSWORD} characters` : undefined}
      >
        <PasswordInput
          id="password"
          autoComplete={mode === 'signUp' ? 'new-password' : 'current-password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          aria-invalid={!!errors.password}
        />
      </Field>
      {errors.form && (
        <p role="alert" className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {errors.form}
        </p>
      )}
      <Button type="submit" size="lg" className="w-full" disabled={busy}>
        {busy ? 'Please wait…' : mode === 'signUp' ? 'Create account' : 'Sign in'}
      </Button>
      {mode === 'signIn' && (
        <Button type="button" variant="link" className="w-full" onClick={() => onForgot(email.trim())}>
          Forgot password?
        </Button>
      )}
    </form>
  )
}
