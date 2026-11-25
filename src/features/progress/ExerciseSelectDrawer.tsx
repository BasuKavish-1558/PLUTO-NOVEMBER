import { Chip, ChipRow } from '@/components/ui/chip'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import type { Exercise } from '@/domain/library'
import { ExerciseList } from '@/features/library/ExerciseList'
import { LibraryFilters } from '@/features/library/LibraryFilters'
import { useLibrary } from '@/features/library/queries'
import { useLibraryFilter } from '@/features/library/useLibraryFilter'

type Props = { recent: Exercise[]; open: boolean; onOpenChange: (open: boolean) => void; onSelect: (id: string) => void }

export function ExerciseSelectDrawer({ recent, open, onOpenChange, onSelect }: Props) {
  const library = useLibrary()
  const filter = useLibraryFilter(library, true)
  const pick = (id: string) => {
    onSelect(id)
    onOpenChange(false)
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange} repositionInputs={false}>
      <DrawerContent className="mx-auto h-[90dvh] max-w-md">
        <DrawerHeader className="text-left">
          <DrawerTitle>Choose an exercise</DrawerTitle>
        </DrawerHeader>
        <div className="space-y-3 px-4 pb-3">
          {recent.length > 0 && (
            <ChipRow role="group" aria-label="Recently trained">
              {recent.map((e) => (
                <Chip key={e.id} selected={false} onClick={() => pick(e.id)}>
                  {e.name}
                </Chip>
              ))}
            </ChipRow>
          )}
          <LibraryFilters {...filter} />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <ExerciseList exercises={filter.results} onSelect={(e) => pick(e.id)} />
        </div>
      </DrawerContent>
    </Drawer>
  )
}
