import type { KeyboardEvent } from 'react'
import { cn } from '@/lib/utils'

type Option<T extends string> = { value: T; label: string }
type Props<T extends string> = {
  label: string
  value: T | null
  options: readonly Option<T>[]
  onChange: (value: T) => void
  className?: string
}

/**
 * Radio group with a sliding pill. Arrow keys move between options.
 * The pill is a CSS transform (no Motion), so screens using this stay out of the animation bundle.
 */
export function Segmented<T extends string>({ label, value, options, onChange, className }: Props<T>) {
  const index = options.findIndex((o) => o.value === value)

  const onKeyDown = (e: KeyboardEvent, index: number) => {
    const step = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0
    if (!step) return
    e.preventDefault()
    const next = options[(index + step + options.length) % options.length]!
    onChange(next.value)
    ;(e.currentTarget.parentElement?.children[options.indexOf(next)] as HTMLElement | undefined)?.focus()
  }

  return (
    <div role="radiogroup" aria-label={label} className={cn('relative flex rounded-xl bg-muted p-1', className)}>
      {index >= 0 && (
        <span
          aria-hidden
          className="absolute inset-y-1 left-1 rounded-lg bg-background shadow-sm transition-transform duration-300 ease-[cubic-bezier(0.34,1.4,0.64,1)] motion-reduce:transition-none"
          style={{ width: `calc((100% - 0.5rem) / ${options.length})`, transform: `translateX(${index * 100}%)` }}
        />
      )}
      {options.map((o, i) => {
        const checked = value === o.value
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={checked}
            tabIndex={checked || (value === null && i === 0) ? 0 : -1}
            onClick={() => onChange(o.value)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className="relative h-10 flex-1 rounded-lg px-3 text-sm font-medium outline-none after:absolute after:inset-x-0 after:-inset-y-1 after:content-[''] focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <span className={cn('relative transition-colors', !checked && 'text-muted-foreground')}>{o.label}</span>
          </button>
        )
      })}
    </div>
  )
}
