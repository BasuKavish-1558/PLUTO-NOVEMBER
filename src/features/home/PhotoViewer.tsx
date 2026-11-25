import { ChevronLeft, ChevronRight, ImageOff, Trash2 } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import type { WorkoutPhoto } from '@/data/db'
import { deleteWorkoutPhoto } from '@/data/repos/photos'
import { useMediaUrl } from '@/features/profile/queries'
import { quick } from '@/lib/motion'

type Props = { photos: WorkoutPhoto[]; index: number | null; onIndexChange: (i: number | null) => void }

/** CL-6: full-size gallery for a day, with delete. */
export function PhotoViewer({ photos, index, onIndexChange }: Props) {
  const photo = index === null ? undefined : photos[index]
  const [confirm, setConfirm] = useState<string | null>(null)

  async function remove(p: WorkoutPhoto) {
    if (confirm !== p.id) return setConfirm(p.id)
    onIndexChange(photos.length > 1 ? Math.max(0, (index ?? 0) - 1) : null)
    setConfirm(null)
    await deleteWorkoutPhoto(p)
    toast('Photo deleted')
  }

  return (
    <Drawer open={!!photo} onOpenChange={(open) => !open && onIndexChange(null)}>
      <DrawerContent className="mx-auto max-h-[92dvh] max-w-2xl">
        <DrawerHeader className="text-left">
          <DrawerTitle>
            Photo {(index ?? 0) + 1} of {photos.length}
          </DrawerTitle>
          <DrawerDescription>Private. Only you can see it.</DrawerDescription>
        </DrawerHeader>
        {photo && (
          <div className="space-y-3 px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
            <div className="relative overflow-hidden rounded-xl bg-muted">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div key={photo.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={quick}>
                  <FullImage path={photo.storage_path} />
                </motion.div>
              </AnimatePresence>
              {photos.length > 1 && (
                <>
                  <NavButton side="left" disabled={index === 0} onClick={() => onIndexChange((index ?? 0) - 1)} />
                  <NavButton side="right" disabled={index === photos.length - 1} onClick={() => onIndexChange((index ?? 0) + 1)} />
                </>
              )}
            </div>
            <Button variant="ghost" size="lg" className="w-full text-destructive hover:text-destructive" onClick={() => void remove(photo)}>
              <Trash2 /> {confirm === photo.id ? 'Tap again to delete' : 'Delete photo'}
            </Button>
          </div>
        )}
      </DrawerContent>
    </Drawer>
  )
}

function FullImage({ path }: { path: string }) {
  const src = useMediaUrl(path)
  const [failed, setFailed] = useState(false)
  if (!src || failed) {
    return (
      <div className="grid aspect-square place-items-center text-sm text-muted-foreground">
        <span className="flex flex-col items-center gap-2">
          <ImageOff className="size-8" /> {navigator.onLine ? 'Loading…' : 'Available when online'}
        </span>
      </div>
    )
  }
  return <img src={src} alt="Workout photo" className="max-h-[60dvh] w-full object-contain" onError={() => setFailed(true)} />
}

function NavButton({ side, disabled, onClick }: { side: 'left' | 'right'; disabled: boolean; onClick: () => void }) {
  const Icon = side === 'left' ? ChevronLeft : ChevronRight
  return (
    <Button
      variant="secondary"
      size="icon"
      aria-label={side === 'left' ? 'Previous photo' : 'Next photo'}
      disabled={disabled}
      onClick={onClick}
      className={`absolute top-1/2 -translate-y-1/2 rounded-full bg-background/80 backdrop-blur ${side === 'left' ? 'left-2' : 'right-2'}`}
    >
      <Icon />
    </Button>
  )
}
