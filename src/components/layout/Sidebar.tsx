import { NavLink } from 'react-router'
import { cn } from '@/lib/utils'
import { sidebarItems } from './nav'
import { NavPill } from './NavPill'

export function Sidebar() {
  return (
    <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r px-3 py-6 md:flex">
      <div className="flex items-center gap-2 px-3 pb-8">
        <img src="/pluto.svg" alt="" className="size-7" />
        <span className="text-lg font-semibold tracking-tight">Pluto</span>
      </div>
      <nav aria-label="Primary" className="flex flex-1 flex-col gap-1">
        {sidebarItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className="relative flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium"
          >
            {({ isActive }) => (
              <>
                {isActive && <NavPill id="side-pill" className="absolute inset-0 rounded-xl bg-muted" />}
                <Icon className={cn('relative size-5', isActive ? 'text-primary' : 'text-muted-foreground')} />
                <span className={cn('relative', !isActive && 'text-muted-foreground')}>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
