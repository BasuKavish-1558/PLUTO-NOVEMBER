import { useState } from 'react'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { Card } from '@/components/ui/card'
import { Segmented } from '@/components/ui/segmented'
import { useSession } from '@/stores/session'
import { AuthForm, type AuthMode } from './AuthForm'
import { ForgotPasswordForm } from './ForgotPasswordForm'
import { NotConfigured } from './NotConfigured'

export function AuthPage() {
  const [mode, setMode] = useState<AuthMode>('signUp')
  const [forgot, setForgot] = useState<string | null>(null) // email to prefill while resetting
  const unconfigured = useSession((s) => s.status === 'unconfigured')

  return (
    <main className="relative grid min-h-dvh place-items-center px-4 py-10">
      <div className="absolute top-[calc(0.75rem+env(safe-area-inset-top))] right-3">
        <ThemeToggle />
      </div>
      {/* Slide only, no fade: text that starts invisible doesn't count as painted (LCP). CSS, so no Motion here. */}
      <div className="w-full max-w-sm animate-in space-y-8 duration-300 slide-in-from-bottom-3">
        <div className="flex flex-col items-center gap-3 text-center">
          <img src="/pluto.svg" alt="" className="size-14" />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Pluto</h1>
            <p className="mt-1 text-sm text-muted-foreground">Splits, sets and progress in one place.</p>
          </div>
        </div>
        {unconfigured ? (
          <NotConfigured />
        ) : (
          <Card className="space-y-6">
            {forgot !== null ? (
              <ForgotPasswordForm initialEmail={forgot} onBack={() => setForgot(null)} />
            ) : (
              <>
                <Segmented
                  label="Account"
                  value={mode}
                  options={[
                    { value: 'signUp', label: 'Create account' },
                    { value: 'signIn', label: 'Sign in' },
                  ]}
                  onChange={setMode}
                />
                <AuthForm key={mode} mode={mode} onSwitch={setMode} onForgot={setForgot} />
              </>
            )}
          </Card>
        )}
      </div>
    </main>
  )
}
