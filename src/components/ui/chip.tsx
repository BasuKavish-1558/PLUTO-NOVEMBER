import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

/** Toggle chip for filters and multi-selects. */
export function Chip({ selected, className, ...props }: ComponentProps<'button'> & { selected: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={cn(
        'inline-flex h-11 shrink-0 items-center rounded-full border px-4 text-sm font-medium whitespace-nowrap transition-[background-color,color,transform] duration-150',
        'outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 active:scale-95 motion-reduce:active:scale-100',
        selected ? 'border-primary bg-primary text-primary-foreground' : 'bg-background text-muted-foreground hover:text-foreground',
        className,
      )}
      {...props}
    />
  )
}

/** Horizontally scrolling chip row that bleeds to the screen edge on phones. */
export function ChipRow({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={cn('-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] md:mx-0 md:flex-wrap md:px-0', className)}
      {...props}
    />
  )
}
