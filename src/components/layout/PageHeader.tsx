import type { ReactNode } from 'react'

/** Desktop page title; on phones the sticky header shows the title instead. */
export function PageHeader({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="mb-6 hidden items-end justify-between gap-4 md:flex">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      {children}
    </div>
  )
}
