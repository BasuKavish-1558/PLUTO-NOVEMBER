import type { LucideIcon } from 'lucide-react'
import { Card } from '@/components/ui/card'

type Props = { icon: LucideIcon; title: string; children: string }

export function EmptyState({ icon: Icon, title, children }: Props) {
  return (
    <Card className="flex flex-col items-center px-6 py-10 text-center">
      <span className="grid size-12 place-items-center rounded-2xl bg-muted">
        <Icon className="size-6 text-muted-foreground" />
      </span>
      <h2 className="mt-4 font-semibold">{title}</h2>
      <p className="mt-1 max-w-xs text-sm text-muted-foreground">{children}</p>
    </Card>
  )
}
