import { ChevronLeft } from 'lucide-react'
import { Link } from 'react-router'

export function BackLink({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      className="-ml-2 inline-flex h-11 items-center gap-1 rounded-xl pr-3 pl-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
    >
      <ChevronLeft className="size-5" /> {label}
    </Link>
  )
}
