import Dexie, { type EntityTable, type Table } from 'dexie'
import type { Exercise } from '@/domain/library'
import type { BackgroundId } from '@/lib/backgrounds'
import type { LengthUnit, WeightUnit } from '@/domain/units'
import type { ActiveWorkout } from '@/domain/workoutSession'
import type { ThemePref } from '@/stores/theme'

export type Profile = {
  id: string
  name: string
  avatar_path: string | null
  age: number | null
  height_cm: number | null
  weight_unit: WeightUnit
  length_unit: LengthUnit
  theme_pref: ThemePref
  background?: BackgroundId // optional: rows cached before the column existed
  show_bmi: boolean
  active_split_id: string | null
  onboarded_at: string | null
  created_at: string
  updated_at: string
}

export type BodyVital = {
  id: string
  user_id: string
  measured_at: string
  local_date: string
  weight_kg: number
  created_at: string
  updated_at: string
}

type Stamped = { created_at: string; updated_at: string }

/** Only the user's custom exercises are stored locally; built-ins ship in the bundle. */
export type ExerciseRow = Exercise & Stamped

export type PresetKey = 'ppl' | 'upper_lower' | 'full_body_3' | 'bro' | 'arnold' | 'phul'

export type Split = { id: string; user_id: string; name: string; source_preset: PresetKey | null } & Stamped

export type SplitDay = {
  id: string
  user_id: string
  split_id: string
  weekday: number // ISO, 1 = Monday
  label: string
  is_rest: boolean
} & Stamped

export type SplitDayExercise = {
  id: string
  user_id: string
  split_day_id: string
  exercise_id: string
  position: number
  target_sets: number | null
  target_reps_min: number | null
  target_reps_max: number | null
} & Stamped

export type Workout = {
  id: string
  user_id: string
  split_day_id: string | null
  title: string
  local_date: string
  started_at: string
  ended_at: string
  duration_seconds: number
  notes: string | null
} & Stamped

export type WorkoutExercise = { id: string; user_id: string; workout_id: string; exercise_id: string; position: number } & Stamped

export type SetLog = {
  id: string
  user_id: string
  workout_exercise_id: string
  set_number: number
  weight_kg: number // added load
  reps: number
  is_warmup: boolean
} & Stamped

export type WorkoutPhoto = {
  id: string
  user_id: string
  workout_id: string
  local_date: string
  storage_path: string
} & Stamped

export type NutritionGoal = {
  id: string
  user_id: string
  nutrient: 'protein' | 'calories'
  basis: 'per_kg_bodyweight' | 'absolute'
  multiplier: number | null
  target: number | null
  goal_type: 'cut' | 'maintain' | 'bulk' | null
  effective_from: string
} & Stamped

export type NutritionEntry = {
  id: string
  user_id: string
  local_date: string
  nutrient: 'protein' | 'calories'
  amount: number
  label: string | null
} & Stamped

export type PersonalRecord = {
  id: string
  user_id: string
  exercise_id: string
  type: 'heaviest_weight' | 'most_reps_at_weight'
  weight_kg: number
  reps: number
  note: string | null
  photo_path: string | null
  workout_id: string | null
  local_date: string
} & Stamped

export type EventType = 'workout_completed' | 'set_logged' | 'pr_logged' | 'protein_goal_met' | 'photo_added'

/** Row type of every table that syncs with Supabase. */
export type SyncedRows = {
  profiles: Profile
  body_vitals: BodyVital
  exercises: ExerciseRow
  splits: Split
  split_days: SplitDay
  split_day_exercises: SplitDayExercise
  workouts: Workout
  workout_exercises: WorkoutExercise
  set_logs: SetLog
  workout_photos: WorkoutPhoto
  nutrition_goals: NutritionGoal
  nutrition_entries: NutritionEntry
  personal_records: PersonalRecord
}
export type SyncedTable = keyof SyncedRows
export const SYNCED_TABLES: SyncedTable[] = [
  'profiles',
  'body_vitals',
  'exercises',
  'splits',
  'split_days',
  'split_day_exercises',
  'workouts',
  'workout_exercises',
  'set_logs',
  'workout_photos',
  'nutrition_goals',
  'nutrition_entries',
  'personal_records',
]

export type OutboxEntry = { seq?: number; rowId: string; lastError?: string } & (
  | { op: 'upsert' | 'update'; table: SyncedTable; payload: Record<string, unknown> }
  | { op: 'delete'; table: SyncedTable }
  | { op: 'upload' | 'remove'; table: 'storage' }
  | { op: 'insert'; table: 'events'; payload: Record<string, unknown> } // append-only, never pulled
)

/** Compressed images waiting to be uploaded; rowId of an 'upload' entry is the storage path. */
export type PendingUpload = { path: string; blob: Blob; contentType: string }

export type Meta = { key: string; value: string }

/** A change the server permanently refused; kept so the user can see what wasn't saved. */
export type SyncFailure = { id?: number; table: string; op: string; rowId: string; error: string; code?: string; at: string }

/** The single in-progress workout (key 'current'), auto-saved on every change. */
export type ActiveWorkoutRecord = { key: 'current'; workout: ActiveWorkout }

export const db = new Dexie('pluto') as Dexie & {
  profiles: EntityTable<Profile, 'id'>
  body_vitals: EntityTable<BodyVital, 'id'>
  exercises: EntityTable<ExerciseRow, 'id'>
  splits: EntityTable<Split, 'id'>
  split_days: EntityTable<SplitDay, 'id'>
  split_day_exercises: EntityTable<SplitDayExercise, 'id'>
  outbox: Table<OutboxEntry, number> // not EntityTable: its insert type collapses the union
  pendingUploads: EntityTable<PendingUpload, 'path'>
  meta: EntityTable<Meta, 'key'>
  workouts: EntityTable<Workout, 'id'>
  workout_exercises: EntityTable<WorkoutExercise, 'id'>
  set_logs: EntityTable<SetLog, 'id'>
  activeWorkout: EntityTable<ActiveWorkoutRecord, 'key'>
  workout_photos: EntityTable<WorkoutPhoto, 'id'>
  nutrition_goals: EntityTable<NutritionGoal, 'id'>
  nutrition_entries: EntityTable<NutritionEntry, 'id'>
  personal_records: EntityTable<PersonalRecord, 'id'>
  syncFailures: EntityTable<SyncFailure, 'id'>
}

db.version(1).stores({
  profiles: 'id',
  body_vitals: 'id, user_id, measured_at',
  outbox: '++seq, [table+rowId]',
  pendingUploads: 'path',
  meta: 'key',
})

db.version(2).stores({
  exercises: 'id, user_id',
  splits: 'id, user_id',
  split_days: 'id, split_id',
  split_day_exercises: 'id, split_day_id',
})

db.version(3).stores({
  workouts: 'id, user_id, local_date, started_at',
  workout_exercises: 'id, workout_id, exercise_id',
  set_logs: 'id, workout_exercise_id',
  activeWorkout: 'key',
})

db.version(4).stores({
  workout_photos: 'id, workout_id, local_date',
  nutrition_goals: 'id, user_id',
  nutrition_entries: 'id, user_id, local_date',
})

db.version(5).stores({
  personal_records: 'id, user_id, exercise_id, workout_id, local_date',
})

db.version(6).stores({ syncFailures: '++id' })

/** Sign-out and account deletion: nothing of the user's stays on the device. */
export async function wipeLocalData() {
  await db.transaction('rw', db.tables, () => Promise.all(db.tables.map((t) => t.clear())))
}
