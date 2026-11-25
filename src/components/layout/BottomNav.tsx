import { NavLink } from 'react-router'
import { cn } from '@/lib/utils'
import { phoneTabs } from './nav'
import { NavPill } from './NavPill'

export function BottomNav() {
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg md:hidden"
    >
      <div className="mx-auto grid max-w-md grid-cols-4">
        {phoneTabs.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className="relative flex h-16 flex-col items-center justify-center gap-1 text-xs font-medium"
          >
            {({ isActive }) => (
              <>
                <span className="relative grid h-8 w-14 place-items-center">
                  {isActive && <NavPill id="tab-pill" className="absolute inset-0 rounded-full bg-primary/15" />}
                  <Icon className={cn('relative size-5', isActive ? 'text-primary' : 'text-muted-foreground')} />
                </span>
                <span className={isActive ? 'text-foreground' : 'text-muted-foreground'}>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
