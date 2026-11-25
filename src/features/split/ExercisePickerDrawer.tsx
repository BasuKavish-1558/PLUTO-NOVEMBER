import { Check, Plus } from 'lucide-react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import type { Exercise } from '@/domain/library'
import { ExerciseList } from '@/features/library/ExerciseList'
import { LibraryFilters } from '@/features/library/LibraryFilters'
import { useLibraryFilter } from '@/features/library/useLibraryFilter'
import { useLibrary } from '@/features/library/queries'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  addedIds: ReadonlySet<string>
  onAdd: (exercise: Exercise) => void
}

/** SP-4: tap to add; the sheet stays open so several exercises can be added in a row. */
export function ExercisePickerDrawer({ open, onOpenChange, addedIds, onAdd }: Props) {
  const library = useLibrary()
  const filter = useLibraryFilter(library)

  return (
    <Drawer open={open} onOpenChange={onOpenChange} repositionInputs={false}>
      <DrawerContent className="mx-auto h-[90dvh] max-w-md">
        <DrawerHeader className="text-left">
          <DrawerTitle>Add exercises</DrawerTitle>
          <DrawerDescription>
            Missing one?{' '}
            <Link to="/split/library" className="font-medium text-primary underline-offset-4 hover:underline">
              Add it to the library
            </Link>
          </DrawerDescription>
        </DrawerHeader>
        <div className="px-4 pb-3">
          <LibraryFilters {...filter} />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
          <ExerciseList
            exercises={filter.results}
            onSelect={onAdd}
            selectLabel={(e) => `${addedIds.has(e.id) ? 'Add again' : 'Add'} ${e.name}`}
            trailing={(e) =>
              addedIds.has(e.id) ? <Check className="size-5 text-primary" /> : <Plus className="size-5 text-muted-foreground" />
            }
          />
        </div>
        <div className="border-t p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <Button size="lg" className="w-full" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
