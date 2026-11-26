import { History, Minus, Plus, Trash2, Trophy } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { formatWeight, weightLabel, type WeightUnit } from '@/domain/units'
import type { PreviousSession } from '@/domain/workoutHistory'
import { addSet, removeExercise, removeSet, toggleLogged, updateSet, updateSetAndFill, type Session, type SessionExercise } from '@/domain/workoutSession'
import type { PersonalRecord } from '@/data/db'
import { prValue } from '@/features/prs/prText'
import { SetRow } from './SetRow'

type Props = {
  exercise: SessionExercise
  name: string
  unit: WeightUnit
  previous?: PreviousSession
  mode: 'live' | 'edit'
  onChange: (change: (s: Session) => Session) => void
  /** Live mode: log a PR for this exercise (PR-4), and the PRs already logged this session. */
  onLogPr?: () => void
  prs?: PersonalRecord[]
}

const shortDate = (iso: string) => new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })

/** Set numbers count working sets only; warm-ups show as "W". */
function labels(sets: SessionExercise['sets']) {
  let n = 0
  return sets.map((s) => (s.isWarmup ? 'W' : String(++n)))
}

export function ExerciseCard({ exercise, name, unit, previous, mode, onChange, onLogPr, prs = [] }: Props) {
  const [optionsFor, setOptionsFor] = useState<string | null>(null)
  const optionsSet = exercise.sets.find((s) => s.id === optionsFor)
  const rowLabels = labels(exercise.sets)
  const live = mode === 'live'

  /** Removes the bottom row (logged or not), with Undo in case it was the wrong one. */
  function removeLastSet() {
    const last = exercise.sets.at(-1)
    if (!last) return
    onChange((s) => removeSet(s, exercise.id, last.id))
    toast(`Removed set ${rowLabels.at(-1)} of ${name}`, {
      action: {
        label: 'Undo',
        onClick: () =>
          onChange((s) => ({
            ...s,
            exercises: s.exercises.map((e) => (e.id === exercise.id && !e.sets.some((x) => x.id === last.id) ? { ...e, sets: [...e.sets, last] } : e)),
          })),
      },
    })
  }

  function remove() {
    const removed = exercise
    onChange((s) => removeExercise(s, removed.id))
    toast(`Removed ${name}`, {
      action: {
        label: 'Undo',
        onClick: () => onChange((s) => (s.exercises.some((e) => e.id === removed.id) ? s : { ...s, exercises: [...s.exercises, removed] })),
      },
    })
  }

  return (
    <Card className="space-y-3 p-3 sm:p-4">
      <div className="flex items-start justify-between gap-2 px-1">
        <div className="min-w-0">
          <h3 className="truncate font-semibold">{name}</h3>
          {previous ? (
            <p className="flex items-center gap-1 text-sm text-muted-foreground">
              <History className="size-3.5 shrink-0" />
              <span className="truncate">
                Last time ({shortDate(previous.startedAt)}):{' '}
                {previous.sets
                  .filter((s) => !s.isWarmup)
                  .map((s) => `${s.weightKg ? formatWeight(s.weightKg, unit) : 'BW'} × ${s.reps}`)
                  .join(', ') || 'warm-ups only'}
              </span>
            </p>
          ) : (
            live && <p className="text-sm text-muted-foreground">First time logging this</p>
          )}
        </div>
        <div className="-mt-1 -mr-1 flex shrink-0">
          {onLogPr && (
            <Button variant="ghost" size="icon" aria-label={`Log a PR for ${name}`} onClick={onLogPr} className="text-muted-foreground">
              <Trophy />
            </Button>
          )}
          <Button variant="ghost" size="icon" aria-label={`Remove ${name}`} onClick={remove} className="text-muted-foreground">
            <Trash2 />
          </Button>
        </div>
      </div>
      {prs.length > 0 && (
        <ul className="space-y-1 px-1">
          {prs.map((pr) => (
            <li key={pr.id} className="flex items-center gap-1.5 text-sm font-medium text-primary">
              <Trophy className="size-4" /> PR {prValue(pr, unit)}
            </li>
          ))}
        </ul>
      )}

      <div className="space-y-1">
        <div className={live ? 'grid grid-cols-[2.75rem_minmax(0,1fr)_minmax(0,1fr)_2.75rem] gap-1.5 px-1 text-xs font-medium text-muted-foreground' : 'grid grid-cols-[2.75rem_minmax(0,1fr)_minmax(0,1fr)] gap-1.5 px-1 text-xs font-medium text-muted-foreground'}>
          <span className="text-center">Set</span>
          <span className="text-center">{weightLabel(unit)}</span>
          <span className="text-center">Reps</span>
          {live && <span />}
        </div>
        {exercise.sets.map((set, i) => (
          <SetRow
            key={set.id}
            set={set}
            label={rowLabels[i]!}
            previous={previous?.sets[i]}
            unit={unit}
            showCheck={live}
            onPatch={(patch) => onChange((s) => (live ? updateSetAndFill : updateSet)(s, exercise.id, set.id, patch))}
            onToggle={() => onChange((s) => toggleLogged(s, exercise.id, set.id, new Date().toISOString()))}
            onOptions={() => setOptionsFor(set.id)}
          />
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="ghost"
          className="text-muted-foreground"
          onClick={() => onChange((s) => addSet(s, exercise.id, crypto.randomUUID(), previous?.sets, !live))}
        >
          <Plus /> Add set
        </Button>
        <Button variant="ghost" className="text-muted-foreground" disabled={!exercise.sets.length} onClick={removeLastSet}>
          <Minus /> Remove set
        </Button>
      </div>

      <Drawer open={!!optionsSet} onOpenChange={(open) => !open && setOptionsFor(null)}>
        <DrawerContent className="mx-auto max-w-md">
          <DrawerHeader className="text-left">
            <DrawerTitle>{name}</DrawerTitle>
            <DrawerDescription>Warm-up sets don't count toward your sets or charts.</DrawerDescription>
          </DrawerHeader>
          {optionsSet && (
            <div className="flex flex-col gap-2 px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
              <Button
                size="lg"
                variant="secondary"
                onClick={() => {
                  onChange((s) => updateSet(s, exercise.id, optionsSet.id, { isWarmup: !optionsSet.isWarmup }))
                  setOptionsFor(null)
                }}
              >
                {optionsSet.isWarmup ? 'Make it a working set' : 'Mark as warm-up'}
              </Button>
              <Button
                size="lg"
                variant="ghost"
                className="text-destructive hover:text-destructive"
                onClick={() => {
                  onChange((s) => removeSet(s, exercise.id, optionsSet.id))
                  setOptionsFor(null)
                }}
              >
                <Trash2 /> Delete set
              </Button>
            </div>
          )}
        </DrawerContent>
      </Drawer>
    </Card>
  )
}
