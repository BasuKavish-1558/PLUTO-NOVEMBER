import { CloudOff, RotateCw } from 'lucide-react'
import { isRouteErrorResponse, useRouteError } from 'react-router'
import { Button } from '@/components/ui/button'

/** Shown instead of a blank crash, e.g. a screen whose code wasn't downloaded before going offline. */
export function RouteError() {
  const error = useRouteError()
  const chunk = error instanceof Error && /dynamically imported module|Importing a module script failed/i.test(error.message)
  const offline = !navigator.onLine

  return (
    <div className="grid min-h-[60dvh] place-items-center px-6">
      <div className="max-w-xs space-y-4 text-center">
        <CloudOff className="mx-auto size-10 text-muted-foreground" />
        <h1 className="font-semibold">{chunk && offline ? "This screen isn't available offline yet" : 'Something went wrong'}</h1>
        <p className="text-sm text-muted-foreground">
          {chunk && offline
            ? 'Connect once so Pluto can finish downloading. Your data is safe on this device.'
            : isRouteErrorResponse(error)
              ? error.statusText
              : 'Try again. Your data is safe on this device.'}
        </p>
        <Button onClick={() => window.location.reload()}>
          <RotateCw /> Try again
        </Button>
      </div>
    </div>
  )
}
