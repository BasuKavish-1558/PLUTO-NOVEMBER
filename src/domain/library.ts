/** Mirrors the muscle_groups seed (EL-1). Ids are the database ids. */
export const MUSCLE_GROUPS = [
  { id: 1, slug: 'chest', name: 'Chest' },
  { id: 2, slug: 'back', name: 'Back' },
  { id: 3, slug: 'shoulders', name: 'Shoulders' },
  { id: 4, slug: 'biceps', name: 'Biceps' },
  { id: 5, slug: 'triceps', name: 'Triceps' },
  { id: 6, slug: 'forearms', name: 'Forearms' },
  { id: 7, slug: 'quads', name: 'Quads' },
  { id: 8, slug: 'hamstrings', name: 'Hamstrings' },
  { id: 9, slug: 'glutes', name: 'Glutes' },
  { id: 10, slug: 'calves', name: 'Calves' },
  { id: 11, slug: 'abs_core', name: 'Abs/Core' },
] as const

export type MuscleGroup = (typeof MUSCLE_GROUPS)[number]
export type MuscleSlug = MuscleGroup['slug']

export const EQUIPMENT = ['barbell', 'dumbbell', 'machine', 'cable', 'bodyweight'] as const
export type Equipment = (typeof EQUIPMENT)[number]
export const equipmentLabel = (e: Equipment) => e[0]!.toUpperCase() + e.slice(1)

export type Exercise = {
  id: string
  user_id: string | null // null = built-in
  name: string
  muscle_group_id: number
  secondary_muscle_group_ids: number[]
  equipment: Equipment
  archived_at: string | null
}

export const muscleIdOf = (slug: MuscleSlug) => MUSCLE_GROUPS.find((m) => m.slug === slug)!.id
export const muscleName = (id: number) => MUSCLE_GROUPS.find((m) => m.id === id)?.name ?? 'Other'

/** Lowercase, no accents, punctuation as spaces: "Farmer's Carry" → "farmer s carry". */
export function normalizeName(s: string) {
  return s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

/** Every typed word must appear; "pullup" and "pull up" both find "Pull-Up". */
export function matchesQuery(name: string, query: string) {
  const tokens = normalizeName(query).split(' ').filter(Boolean)
  const spaced = normalizeName(name)
  const compact = spaced.replace(/ /g, '')
  return tokens.every((t) => spaced.includes(t) || compact.includes(t))
}

export type LibraryFilter = {
  query?: string
  muscleGroupId?: number | null
  equipment?: Equipment | null
  includeArchived?: boolean
}

export function filterExercises<T extends Exercise>(list: readonly T[], f: LibraryFilter = {}): T[] {
  return list
    .filter(
      (e) =>
        (f.includeArchived || !e.archived_at) &&
        (!f.muscleGroupId || e.muscle_group_id === f.muscleGroupId) &&
        (!f.equipment || e.equipment === f.equipment) &&
        (!f.query || matchesQuery(e.name, f.query)),
    )
    .sort((a, b) => a.name.localeCompare(b.name))
}

/** Sections in EL-1 order, empty groups left out. */
export function groupByMuscle<T extends Exercise>(list: readonly T[]) {
  return MUSCLE_GROUPS.map((group) => ({ group, exercises: list.filter((e) => e.muscle_group_id === group.id) })).filter(
    (s) => s.exercises.length > 0,
  )
}

/** Names are unique across built-ins and the user's own exercises, ignoring case and punctuation. */
export function nameTaken(list: readonly Exercise[], name: string, exceptId?: string) {
  const n = normalizeName(name)
  return list.some((e) => e.id !== exceptId && normalizeName(e.name) === n)
}
