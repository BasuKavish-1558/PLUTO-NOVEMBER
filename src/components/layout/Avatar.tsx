import { useState } from 'react'
import { cn } from '@/lib/utils'

type Props = { name: string; src?: string | null; className?: string }

export function Avatar({ name, src, className }: Props) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')

  return (
    <span
      aria-hidden // decorative: the surrounding control carries the name (e.g. "Profile")
      className={cn(
        'grid size-9 shrink-0 place-items-center overflow-hidden rounded-full bg-primary text-sm font-semibold text-primary-foreground',
        className,
      )}
    >
      {src && src !== failedSrc ? (
        <img src={src} alt="" className="size-full object-cover" onError={() => setFailedSrc(src)} />
      ) : (
        initials || '?'
      )}
    </span>
  )
}
