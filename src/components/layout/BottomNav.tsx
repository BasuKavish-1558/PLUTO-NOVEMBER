import { Ellipsis } from 'lucide-react'
import { useState } from 'react'
import { NavLink, useLocation } from 'react-router'
import { cn } from '@/lib/utils'
import { MoreDrawer } from './MoreDrawer'
import { moreItems, phoneTabs, type NavItem } from './nav'
import { NavPill } from './NavPill'

const tabClass = 'relative flex h-16 flex-col items-center justify-center gap-1 text-xs font-medium'

function TabContent({ item, active }: { item: Pick<NavItem, 'icon' | 'label'>; active: boolean }) {
  const Icon = item.icon
  return (
    <>
      <span className="relative grid h-8 w-14 place-items-center">
        {active && <NavPill id="tab-pill" className="absolute inset-0 rounded-full bg-primary/15" />}
        <Icon className={cn('relative size-5', active ? 'text-primary' : 'text-muted-foreground')} />
      </span>
      <span className={active ? 'text-foreground' : 'text-muted-foreground'}>{item.label}</span>
    </>
  )
}

export function BottomNav() {
  const { pathname } = useLocation()
  const [moreOpen, setMoreOpen] = useState(false)
  const moreActive = moreItems.some((i) => pathname.startsWith(i.to))

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg md:hidden"
    >
      <div className="mx-auto grid max-w-md grid-cols-4">
        {phoneTabs.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.to === '/'} className={tabClass}>
            {({ isActive }) => <TabContent item={item} active={isActive} />}
          </NavLink>
        ))}
        <button type="button" className={tabClass} onClick={() => setMoreOpen(true)} aria-haspopup="dialog">
          <TabContent item={{ icon: Ellipsis, label: 'More' }} active={moreActive} />
        </button>
      </div>
      <MoreDrawer open={moreOpen} onOpenChange={setMoreOpen} />
    </nav>
  )
}
