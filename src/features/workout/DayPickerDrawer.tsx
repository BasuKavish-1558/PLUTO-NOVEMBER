import { ChevronRight } from 'lucide-react'
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import type { SplitDetail } from '@/features/split/queries'
import { dayTitle, WEEKDAYS } from '@/features/split/splitText'
import { planFromDay, useStartWorkout } from './useStartWorkout'

type Props = { split: SplitDetail; open: boolean; onOpenChange: (open: boolean) => void }

/** PLAN A14: missed Monday's Push? Start any day of the active split. */
export function DayPickerDrawer({ split, open, onOpenChange }: Props) {
  const start = useStartWorkout()
  const days = split.days.filter((d) => !d.is_rest)

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="mx-auto max-w-md">
        <DrawerHeader className="text-left">
          <DrawerTitle>Start another day</DrawerTitle>
          <DrawerDescription>From {split.split.name}</DrawerDescription>
        </DrawerHeader>
        <ul className="space-y-2 px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
          {days.map((d) => (
            <li key={d.id}>
              <button
                type="button"
                onClick={() => {
                  onOpenChange(false)
                  void start(planFromDay(d))
                }}
                className="flex min-h-16 w-full items-center gap-3 rounded-xl bg-muted/60 px-4 py-3 text-left transition-[transform,background-color] active:scale-[0.98] active:bg-muted motion-reduce:active:scale-100"
              >
                <span className="flex-1">
                  <span className="block font-medium">{dayTitle(d)}</span>
                  <span className="block text-sm text-muted-foreground">
                    {WEEKDAYS[d.weekday - 1]} · {d.items.length} exercise{d.items.length === 1 ? '' : 's'}
                  </span>
                </span>
                <ChevronRight className="size-5 text-muted-foreground" />
              </button>
            </li>
          ))}
        </ul>
      </DrawerContent>
    </Drawer>
  )
}
