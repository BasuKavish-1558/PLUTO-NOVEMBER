import { describe, expect, it } from 'vitest'
import { filterExercises, groupByMuscle, matchesQuery, nameTaken, normalizeName, type Exercise } from './library'

const ex = (id: string, name: string, muscle: number, equipment: Exercise['equipment'], archived = false): Exercise => ({
  id,
  name,
  user_id: null,
  muscle_group_id: muscle,
  secondary_muscle_group_ids: [],
  equipment,
  archived_at: archived ? '2026-11-01T00:00:00Z' : null,
})

const list = [
  ex('1', 'Bench Press', 1, 'barbell'),
  ex('2', 'Incline Dumbbell Press', 1, 'dumbbell'),
  ex('3', 'Pull-Up', 2, 'bodyweight'),
  ex('4', "Farmer's Carry", 6, 'dumbbell'),
  ex('5', 'Old Press', 1, 'machine', true),
]

describe('search', () => {
  it('normalizes case, accents and punctuation', () => {
    expect(normalizeName("Farmer's  Carry")).toBe('farmer s carry')
    expect(normalizeName('Développé')).toBe('developpe')
  })

  it('requires every word, in any order', () => {
    expect(matchesQuery('Incline Dumbbell Press', 'press incline')).toBe(true)
    expect(matchesQuery('Incline Dumbbell Press', 'incline barbell')).toBe(false)
  })

  it('ignores hyphens and spaces inside names', () => {
    expect(matchesQuery('Pull-Up', 'pullup')).toBe(true)
    expect(matchesQuery('Pull-Up', 'pull up')).toBe(true)
  })
})

describe('filterExercises', () => {
  it('hides archived exercises unless asked and sorts by name', () => {
    expect(filterExercises(list).map((e) => e.id)).toEqual(['1', '4', '2', '3'])
    expect(filterExercises(list, { includeArchived: true })).toHaveLength(5)
  })

  it('combines muscle group, equipment and query', () => {
    expect(filterExercises(list, { muscleGroupId: 1 }).map((e) => e.id)).toEqual(['1', '2'])
    expect(filterExercises(list, { equipment: 'dumbbell' }).map((e) => e.id)).toEqual(['4', '2'])
    expect(filterExercises(list, { muscleGroupId: 1, query: 'dumb' }).map((e) => e.id)).toEqual(['2'])
  })
})

describe('groupByMuscle', () => {
  it('keeps EL-1 order and drops empty groups', () => {
    expect(groupByMuscle(filterExercises(list)).map((s) => s.group.slug)).toEqual(['chest', 'back', 'forearms'])
  })
})

describe('nameTaken', () => {
  it('matches regardless of case and punctuation, except the exercise itself', () => {
    expect(nameTaken(list, 'bench press')).toBe(true)
    expect(nameTaken(list, 'pull up')).toBe(true)
    expect(nameTaken(list, 'Bench Press', '1')).toBe(false)
    expect(nameTaken(list, 'Cable Fly')).toBe(false)
  })
})
