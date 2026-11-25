import { Plus } from 'lucide-react'
import { useState } from 'react'
import { BackLink } from '@/components/layout/BackLink'
import { PageHeader } from '@/components/layout/PageHeader'
import { useSheet } from '@/components/layout/useSheet'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import type { Exercise } from '@/domain/library'
import { ExerciseDetailsDrawer } from './ExerciseDetailsDrawer'
import { ExerciseFormDrawer } from './ExerciseFormDrawer'
import { ExerciseList } from './ExerciseList'
import { LibraryFilters } from './LibraryFilters'
import { useLibrary } from './queries'
import { useLibraryFilter } from './useLibraryFilter'

export function LibraryPage() {
  const library = useLibrary()
  const [showArchived, setShowArchived] = useState(false)
  const filter = useLibraryFilter(library, showArchived)
  const [selected, setSelected] = useState<Exercise | null>(null)
  const [editing, setEditing] = useState<Exercise | undefined>()
  const form = useSheet()
  const details = useSheet()
  const archivedCount = library?.filter((e) => e.archived_at).length ?? 0

  const openDetails = (exercise: Exercise) => {
    setSelected(exercise)
    details.show()
  }
  const openForm = (exercise?: Exercise) => {
    details.onOpenChange(false)
    setEditing(exercise)
    form.show()
  }

  return (
    <div className="space-y-5">
      <BackLink to="/split" label="Split" />
      <PageHeader title="Exercise library" />
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground tabular-nums">{filter.results.length} exercises</p>
        <Button size="sm" variant="secondary" onClick={() => openForm()}>
          <Plus /> New exercise
        </Button>
      </div>
      <LibraryFilters {...filter} />
      {archivedCount > 0 && (
        <label className="flex items-center justify-between gap-3 text-sm">
          <span>Show archived ({archivedCount})</span>
          <Switch checked={showArchived} onCheckedChange={setShowArchived} aria-label="Show archived" />
        </label>
      )}
      {library && <ExerciseList exercises={filter.results} onSelect={openDetails} />}
      <ExerciseDetailsDrawer exercise={selected} open={details.open} onOpenChange={details.onOpenChange} onEdit={openForm} />
      <ExerciseFormDrawer
        key={form.key}
        exercise={editing}
        library={library ?? []}
        open={form.open}
        onOpenChange={form.onOpenChange}
      />
    </div>
  )
}
