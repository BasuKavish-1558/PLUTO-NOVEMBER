import { CloudOff } from 'lucide-react'
import { Navigate, Outlet } from 'react-router'
import { Splash } from '@/components/layout/Splash'
import { Button } from '@/components/ui/button'
import { loadProfile, signOut } from '@/data/auth'
import { useProfile } from '@/features/profile/queries'
import { useSession } from '@/stores/session'

type Need = 'guest' | 'onboarding' | 'app'

/** Route guard: signed out → /auth, signed in but not onboarded → /onboarding, else the app. */
export function Gate({ need }: { need: Need }) {
  const session = useSession()
  const profile = useProfile()

  if (session.status === 'loading') return <Splash />
  if (session.status === 'error') return <LoadError userId={session.userId} email={session.email} />
  if (session.status !== 'ready') return need === 'guest' ? <Outlet /> : <Navigate to="/auth" replace />
  if (!profile) return <Splash /> // first read from Dexie, or mid sign-out

  const home = profile.onboarded_at ? '/' : '/onboarding'
  if (need === 'guest') return <Navigate to={home} replace />
  if ((need === 'app') !== !!profile.onboarded_at) return <Navigate to={home} replace />
  return <Outlet />
}

function LoadError({ userId, email }: { userId: string; email: string }) {
  return (
    <div className="grid min-h-dvh place-items-center px-6">
      <div className="max-w-xs space-y-4 text-center">
        <CloudOff className="mx-auto size-10 text-muted-foreground" />
        <h1 className="font-semibold">Couldn't load your profile</h1>
        <p className="text-sm text-muted-foreground">
          The first sign-in on a device needs a connection. After that, Pluto works offline.
        </p>
        <div className="flex flex-col gap-2">
          <Button onClick={() => void loadProfile(userId, email)}>Try again</Button>
          <Button variant="ghost" onClick={() => void signOut().catch(() => {})}>
            Sign out
          </Button>
        </div>
      </div>
    </div>
  )
}
