import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { moreItems } from './nav'

type Props = { open: boolean; onOpenChange: (open: boolean) => void }

export function MoreDrawer({ open, onOpenChange }: Props) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>More</DrawerTitle>
        </DrawerHeader>
        <ul className="space-y-2 px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
          {moreItems.map(({ to, label, hint, icon: Icon }) => (
            <li key={to}>
              <Link
                to={to}
                onClick={() => onOpenChange(false)}
                className="flex min-h-16 items-center gap-4 rounded-xl bg-muted/60 px-4 transition-[transform,background-color] active:scale-[0.98] active:bg-muted motion-reduce:active:scale-100"
              >
                <span className="grid size-10 place-items-center rounded-xl bg-background">
                  <Icon className="size-5 text-primary" />
                </span>
                <span className="flex-1">
                  <span className="block font-medium">{label}</span>
                  <span className="block text-sm text-muted-foreground">{hint}</span>
                </span>
                <ChevronRight className="size-5 text-muted-foreground" />
              </Link>
            </li>
          ))}
        </ul>
      </DrawerContent>
    </Drawer>
  )
}
