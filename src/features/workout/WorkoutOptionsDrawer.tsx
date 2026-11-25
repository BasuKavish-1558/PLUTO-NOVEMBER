import { RotateCcw, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { resetTimer } from '@/domain/workoutSession'
import { useActiveWorkout } from '@/stores/activeWorkout'

type Props = { open: boolean; onOpenChange: (open: boolean) => void }

/** For a workout started by accident: zero the clock, or throw the whole workout away. */
export function WorkoutOptionsDrawer({ open, onOpenChange }: Props) {
  const navigate = useNavigate()
  const update = useActiveWorkout((s) => s.update)
  const clear = useActiveWorkout((s) => s.clear)
  const [confirmDiscard, setConfirmDiscard] = useState(false)

  function reset() {
    update((w) => ({ ...w, timer: resetTimer(w.timer, Date.now()) }))
    onOpenChange(false)
    toast('Timer reset to 0:00')
  }

  function discard() {
    if (!confirmDiscard) return setConfirmDiscard(true)
    onOpenChange(false)
    navigate('/workout', { replace: true }) // leave the live page before clearing it
    clear({ discard: true })
    toast('Workout discarded')
  }

  return (
    <Drawer
      open={open}
      onOpenChange={(o) => {
        if (!o) setConfirmDiscard(false)
        onOpenChange(o)
      }}
    >
      <DrawerContent className="mx-auto max-w-md">
        <DrawerHeader className="text-left">
          <DrawerTitle>Workout options</DrawerTitle>
          <DrawerDescription>Started it by accident? Reset the clock, or discard the workout.</DrawerDescription>
        </DrawerHeader>
        <div className="flex flex-col gap-2 px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
          <Button size="lg" variant="secondary" onClick={reset}>
            <RotateCcw /> Reset timer to 0:00
          </Button>
          <p className="px-1 text-sm text-muted-foreground">Keeps every set you've logged.</p>
          <Button size="lg" variant="ghost" className="mt-2 text-destructive hover:text-destructive" onClick={discard}>
            <Trash2 /> {confirmDiscard ? 'Tap again to discard for good' : 'Discard workout'}
          </Button>
          <p className="px-1 text-sm text-muted-foreground">Deletes the timer and all logged sets. Nothing is saved.</p>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
