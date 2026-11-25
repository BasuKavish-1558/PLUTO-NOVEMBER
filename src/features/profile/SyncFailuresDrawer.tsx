import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { db, type SyncFailure } from '@/data/db'

const WHAT: Record<string, string> = {
  profiles: 'Profile change',
  body_vitals: 'Weight entry',
  exercises: 'Custom exercise',
  splits: 'Split',
  split_days: 'Split day',
  split_day_exercises: 'Split exercise',
  workouts: 'Workout',
  workout_exercises: 'Workout exercise',
  set_logs: 'Set',
  workout_photos: 'Photo',
  nutrition_goals: 'Protein goal',
  nutrition_entries: 'Protein entry',
  personal_records: 'Personal record',
  events: 'Activity record',
  storage: 'Photo file',
}

type Props = { failures: SyncFailure[]; open: boolean; onOpenChange: (open: boolean) => void }

/** Changes the server refused for good. They were set aside so everything else could sync. */
export function SyncFailuresDrawer({ failures, open, onOpenChange }: Props) {
  async function dismiss() {
    await db.syncFailures.clear()
    onOpenChange(false)
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="mx-auto max-h-[85dvh] max-w-md">
        <DrawerHeader className="text-left">
          <DrawerTitle>Changes that couldn't be saved</DrawerTitle>
          <DrawerDescription>
            The server refused these, so this device now shows the server's version instead. Everything else synced normally.
          </DrawerDescription>
        </DrawerHeader>
        <ul className="space-y-2 overflow-y-auto px-4">
          {failures.map((f) => (
            <li key={f.id} className="flex gap-3 rounded-xl bg-muted/60 px-4 py-3 text-sm">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
              <span className="min-w-0">
                <span className="block font-medium">
                  {WHAT[f.table] ?? f.table} · {new Date(f.at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                </span>
                <span className="block break-words text-muted-foreground">{f.error}</span>
              </span>
            </li>
          ))}
        </ul>
        <div className="p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <Button size="lg" className="w-full" onClick={() => void dismiss()}>
            Dismiss all
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
