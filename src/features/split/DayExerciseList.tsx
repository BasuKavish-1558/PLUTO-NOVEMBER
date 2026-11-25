import { ChevronDown, ChevronUp, GripVertical } from 'lucide-react'
import { Reorder, useDragControls } from 'motion/react'
import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import type { SplitDayExercise } from '@/data/db'
import { reorderDay } from '@/data/repos/splits'
import type { Exercise } from '@/domain/library'
import { formatTargets, moveItem } from '@/domain/split'
import { spring } from '@/lib/motion'

type Props = {
  dayId: string
  items: SplitDayExercise[]
  exercises: Map<string, Exercise>
  onEdit: (item: SplitDayExercise) => void
}

/**
 * SP-5: drag the handle to reorder (Motion Reorder), or use the up/down buttons.
 * Key it by the set of item ids: it resets when exercises are added or removed, but keeps
 * focus and local order across its own reorders.
 */
export function DayExerciseList({ dayId, items, exercises, onEdit }: Props) {
  const [order, setOrder] = useState(() => items.map((i) => i.id))
  const latest = useRef(order) // what onDragEnd saves; kept outside render
  const update = (ids: string[]) => {
    latest.current = ids
    setOrder(ids)
  }
  const byId = new Map(items.map((i) => [i.id, i]))

  const save = (ids: string[]) => void reorderDay(dayId, ids)
  const move = (from: number, to: number) => {
    const next = moveItem(order, from, to)
    update(next)
    save(next)
  }

  return (
    <Reorder.Group axis="y" values={order} onReorder={update} className="divide-y overflow-hidden rounded-xl border bg-card">
      {order.map((id, index) => {
        const item = byId.get(id)
        if (!item) return null
        return (
          <Row
            key={id}
            item={item}
            name={exercises.get(item.exercise_id)?.name ?? 'Unknown exercise'}
            archived={!!exercises.get(item.exercise_id)?.archived_at}
            first={index === 0}
            last={index === order.length - 1}
            onUp={() => move(index, index - 1)}
            onDown={() => move(index, index + 1)}
            onDrop={() => save(latest.current)}
            onEdit={() => onEdit(item)}
          />
        )
      })}
    </Reorder.Group>
  )
}

type RowProps = {
  item: SplitDayExercise
  name: string
  archived: boolean
  first: boolean
  last: boolean
  onUp: () => void
  onDown: () => void
  onDrop: () => void
  onEdit: () => void
}

function Row({ item, name, archived, first, last, onUp, onDown, onDrop, onEdit }: RowProps) {
  const controls = useDragControls()
  const targets = formatTargets({ sets: item.target_sets, repsMin: item.target_reps_min, repsMax: item.target_reps_max })

  return (
    <Reorder.Item
      value={item.id}
      dragListener={false}
      dragControls={controls}
      onDragEnd={onDrop}
      transition={spring}
      whileDrag={{ scale: 1.02, boxShadow: '0 8px 24px rgb(0 0 0 / 0.12)' }}
      className="relative flex items-center bg-card"
    >
      <span
        aria-hidden
        onPointerDown={(e) => controls.start(e)}
        className="grid h-14 w-11 shrink-0 cursor-grab touch-none place-items-center text-muted-foreground active:cursor-grabbing"
      >
        <GripVertical className="size-5" />
      </span>
      <button type="button" onClick={onEdit} className="min-h-14 min-w-0 flex-1 py-2 text-left">
        <span className="block truncate font-medium">{name}</span>
        <span className="block text-sm text-muted-foreground">
          {archived ? 'Archived · ' : ''}
          {targets || 'Tap to set targets'}
        </span>
      </button>
      <Button variant="ghost" size="icon" aria-label={`Move ${name} up`} disabled={first} onClick={onUp}>
        <ChevronUp />
      </Button>
      <Button variant="ghost" size="icon" aria-label={`Move ${name} down`} disabled={last} onClick={onDown}>
        <ChevronDown />
      </Button>
    </Reorder.Item>
  )
}
