import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type Props = { label: string; htmlFor?: string; error?: string; hint?: string; className?: string; children: ReactNode }

/** Label + control + animated error line (CSS, no Motion). Pass the same id to the control and `htmlFor`. */
export function Field({ label, htmlFor, error, hint, className, children }: Props) {
  return (
    <div className={cn('space-y-2', className)}>
      <label htmlFor={htmlFor} className="block text-sm font-medium">
        {label}
      </label>
      {children}
      {(error || hint) && (
        <p
          key={error ? 'error' : 'hint'}
          id={htmlFor && `${htmlFor}-msg`}
          className={cn('animate-in fade-in-0 slide-in-from-top-1 text-sm duration-200', error ? 'text-destructive' : 'text-muted-foreground')}
        >
          {error ?? hint}
        </p>
      )}
    </div>
  )
}
