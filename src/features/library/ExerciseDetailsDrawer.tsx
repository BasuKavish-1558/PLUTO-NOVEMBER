import { Archive, ArchiveRestore, Pencil } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { archiveExercise, restoreExercise } from '@/data/repos/exercises'
import { equipmentLabel, muscleName, type Exercise } from '@/domain/library'

type Props = { exercise: Exercise | null; open: boolean; onOpenChange: (open: boolean) => void; onEdit: (e: Exercise) => void }

export function ExerciseDetailsDrawer({ exercise, open, onOpenChange, onEdit }: Props) {
  const custom = !!exercise?.user_id

  async function toggleArchive(e: Exercise) {
    if (e.archived_at) {
      await restoreExercise(e.id)
      toast.success(`${e.name} is back in your library`)
    } else {
      await archiveExercise(e.id)
      toast(`Archived ${e.name}`, { description: 'Past workouts keep it. Restore it any time.', action: { label: 'Undo', onClick: () => void restoreExercise(e.id) } })
    }
    onOpenChange(false)
  }

  return (
    <Drawer open={open && !!exercise} onOpenChange={onOpenChange}>
      <DrawerContent className="mx-auto max-w-md">
        {exercise && (
          <>
            <DrawerHeader className="text-left">
              <DrawerTitle>{exercise.name}</DrawerTitle>
              <DrawerDescription>{custom ? 'Custom exercise' : 'Built-in exercise'}</DrawerDescription>
            </DrawerHeader>
            <dl className="mx-4 divide-y rounded-xl border text-sm">
              <Row label="Main muscle" value={muscleName(exercise.muscle_group_id)} />
              <Row
                label="Also works"
                value={exercise.secondary_muscle_group_ids.map(muscleName).join(', ') || '—'}
              />
              <Row label="Equipment" value={equipmentLabel(exercise.equipment)} />
            </dl>
            <div className="flex gap-3 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
              {custom ? (
                <>
                  <Button variant="outline" size="lg" className="flex-1" onClick={() => void toggleArchive(exercise)}>
                    {exercise.archived_at ? <ArchiveRestore /> : <Archive />}
                    {exercise.archived_at ? 'Restore' : 'Archive'}
                  </Button>
                  <Button size="lg" className="flex-1" onClick={() => onEdit(exercise)}>
                    <Pencil /> Edit
                  </Button>
                </>
              ) : (
                <Button variant="outline" size="lg" className="flex-1" onClick={() => onOpenChange(false)}>
                  Close
                </Button>
              )}
            </div>
          </>
        )}
      </DrawerContent>
    </Drawer>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 px-4 py-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right">{value}</dd>
    </div>
  )
}
