import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

export function Input({ className, ...props }: ComponentProps<'input'>) {
  return (
    <input
      data-slot="input"
      className={cn(
        'h-12 w-full min-w-0 rounded-xl border bg-background px-4 text-base outline-none transition-[box-shadow,border-color]',
        'placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
        'disabled:opacity-50 read-only:bg-muted read-only:text-muted-foreground aria-invalid:border-destructive',
        'dark:bg-input/30 tabular-nums',
        className,
      )}
      {...props}
    />
  )
}
