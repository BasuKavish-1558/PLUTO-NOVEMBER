import { cn } from '@/lib/utils'

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-xl bg-muted motion-reduce:animate-none', className)} />
}

/** Generic page placeholder: a title bar and a few cards. Revealed only after 150 ms. */
export function PageSkeleton({ cards = 3 }: { cards?: number }) {
  return (
    <div role="status" className="skeleton-delayed space-y-4" aria-busy="true" aria-label="Loading">
      <Skeleton className="hidden h-8 w-40 md:block" />
      {Array.from({ length: cards }, (_, i) => (
        <Skeleton key={i} className={i === 0 ? 'h-40' : 'h-24'} />
      ))}
    </div>
  )
}
