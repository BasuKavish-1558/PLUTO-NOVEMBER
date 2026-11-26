import { describe, expect, it } from 'vitest'
import { diffWorkout, previousPerformance, sessionFromRows } from './workoutHistory'
import { addSet, removeSet, updateSet } from './workoutSession'

const workouts = [
  { id: 'w1', started_at: '2026-11-17T17:00:00.000Z' },
  { id: 'w2', started_at: '2026-11-20T17:00:00.000Z' }, // most recent with bench
  { id: 'w3', started_at: '2026-11-22T17:00:00.000Z' }, // squat only
]
const exercises = [
  { id: 'we1', workout_id: 'w1', exercise_id: 'bench', position: 0 },
  { id: 'we2', workout_id: 'w2', exercise_id: 'bench', position: 1 },
  { id: 'we2b', workout_id: 'w2', exercise_id: 'bench', position: 3 },
  { id: 'we3', workout_id: 'w3', exercise_id: 'squat', position: 0 },
]
const sets = [
  { id: 's1', workout_exercise_id: 'we1', set_number: 1, weight_kg: 75, reps: 8, is_warmup: false },
  { id: 's3', workout_exercise_id: 'we2', set_number: 2, weight_kg: 80, reps: 6, is_warmup: false },
  { id: 's2', workout_exercise_id: 'we2', set_number: 1, weight_kg: 40, reps: 10, is_warmup: true },
  { id: 's4', workout_exercise_id: 'we2b', set_number: 1, weight_kg: 60, reps: 12, is_warmup: false },
  { id: 's5', workout_exercise_id: 'we3', set_number: 1, weight_kg: 120, reps: 5, is_warmup: false },
]

describe('previousPerformance', () => {
  it('takes the most recent workout with that exercise, first occurrence, sets in order', () => {
    const prev = previousPerformance(workouts, exercises, sets)
    expect(prev.get('bench')).toEqual({
      workoutId: 'w2',
      startedAt: '2026-11-20T17:00:00.000Z',
      sets: [
        { weightKg: 40, reps: 10, durationSeconds: null, isWarmup: true },
        { weightKg: 80, reps: 6, durationSeconds: null, isWarmup: false },
      ],
    })
    expect(prev.get('squat')?.workoutId).toBe('w3')
    expect(prev.has('deadlift')).toBe(false)
  })

  it('can skip the workout being edited', () => {
    expect(previousPerformance(workouts, exercises, sets, 'w2').get('bench')?.workoutId).toBe('w1')
  })
})

describe('editing a saved workout', () => {
  const draftFrom = () => sessionFromRows(exercises.filter((e) => e.workout_id === 'w2'), sets, 'ok')

  it('loads rows as a session with every set logged', () => {
    const s = draftFrom()
    expect(s.notes).toBe('ok')
    expect(s.exercises.map((e) => e.id)).toEqual(['we2', 'we2b'])
    expect(s.exercises[0]!.sets.map((x) => [x.id, x.done])).toEqual([['s2', true], ['s3', true]])
  })

  it('only renumbers positions for an untouched draft', () => {
    const ops = diffWorkout(exercises.filter((e) => e.workout_id === 'w2'), sets, draftFrom())
    expect(ops).toEqual({ insertExercises: [], patchExercises: [{ id: 'we2', position: 0 }, { id: 'we2b', position: 1 }], removeExercises: [], insertSets: [], patchSets: [], removeSets: [] })
  })

  it('patches changed fields, renumbers after a removal, inserts new sets and drops emptied exercises', () => {
    const rows = exercises.filter((e) => e.workout_id === 'w2')
    let draft = draftFrom()
    draft = removeSet(draft, 'we2', 's2') // warm-up gone → s3 becomes set 1
    draft = updateSet(draft, 'we2', 's3', { reps: 7 })
    draft = addSet(draft, 'we2', 'new', undefined, true)
    draft = removeSet(draft, 'we2b', 's4') // exercise now empty

    const ops = diffWorkout(rows, sets, draft)
    expect(ops.removeSets).toEqual(['s2'])
    expect(ops.patchSets).toEqual([{ id: 's3', changes: { set_number: 1, reps: 7 } }])
    expect(ops.insertSets).toEqual([{ id: 'new', workout_exercise_id: 'we2', set_number: 2, weight_kg: 80, reps: 7, is_warmup: false }])
    expect(ops.removeExercises).toEqual(['we2b'])
  })
})
