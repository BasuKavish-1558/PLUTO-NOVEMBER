import type { PresetKey, Split, SplitDay, SplitDayExercise } from './db'
import { BUILTIN_EXERCISES } from './library/builtinExercises'

/** [exercise name, sets, reps min, reps max]. Names must match the built-in library. */
type Item = [name: string, sets: number, min: number, max: number]
type Day = { label: string; items: Item[] }
export type Preset = { key: PresetKey; name: string; summary: string; week: (Day | null)[] } // Mon..Sun, null = rest

const push: Day = { label: 'Push', items: [['Bench Press', 4, 6, 8], ['Overhead Press', 3, 8, 10], ['Incline Dumbbell Press', 3, 8, 12], ['Cable Lateral Raise', 3, 12, 15], ['Triceps Pushdown', 3, 10, 12], ['Overhead Cable Triceps Extension', 3, 10, 12]] }
const pull: Day = { label: 'Pull', items: [['Deadlift', 3, 5, 5], ['Pull-Up', 3, 6, 10], ['Barbell Row', 3, 8, 10], ['Face Pull', 3, 12, 15], ['Hammer Curl', 3, 10, 12], ['Barbell Curl', 3, 8, 12]] }
const legs: Day = { label: 'Legs', items: [['Back Squat', 4, 6, 8], ['Romanian Deadlift', 3, 8, 10], ['Leg Press', 3, 10, 12], ['Lying Leg Curl', 3, 10, 12], ['Standing Calf Raise', 4, 10, 15]] }

const upper: Day = { label: 'Upper', items: [['Bench Press', 4, 6, 8], ['Barbell Row', 4, 6, 8], ['Seated Dumbbell Shoulder Press', 3, 8, 10], ['Lat Pulldown', 3, 8, 12], ['Dumbbell Curl', 2, 10, 12], ['Triceps Pushdown', 2, 10, 12]] }
const lower: Day = { label: 'Lower', items: [['Back Squat', 4, 6, 8], ['Romanian Deadlift', 3, 8, 10], ['Leg Press', 3, 10, 12], ['Seated Leg Curl', 3, 10, 12], ['Standing Calf Raise', 3, 10, 15], ['Hanging Leg Raise', 3, 10, 15]] }

const fullA: Day = { label: 'Full Body A', items: [['Back Squat', 3, 5, 8], ['Bench Press', 3, 5, 8], ['Barbell Row', 3, 6, 10], ['Dumbbell Lateral Raise', 2, 12, 15], ['Cable Crunch', 2, 10, 15]] }
const fullB: Day = { label: 'Full Body B', items: [['Deadlift', 3, 5, 5], ['Overhead Press', 3, 6, 8], ['Pull-Up', 3, 6, 10], ['Bulgarian Split Squat', 2, 8, 10], ['Hammer Curl', 2, 10, 12]] }
const fullC: Day = { label: 'Full Body C', items: [['Front Squat', 3, 6, 8], ['Incline Dumbbell Press', 3, 8, 10], ['Seated Cable Row', 3, 8, 12], ['Lying Leg Curl', 2, 10, 12], ['Triceps Pushdown', 2, 10, 12]] }

const broChest: Day = { label: 'Chest', items: [['Bench Press', 4, 6, 8], ['Incline Dumbbell Press', 3, 8, 10], ['Machine Chest Press', 3, 10, 12], ['Cable Crossover', 3, 12, 15]] }
const broBack: Day = { label: 'Back', items: [['Deadlift', 3, 5, 5], ['Pull-Up', 3, 6, 10], ['Barbell Row', 3, 8, 10], ['Seated Cable Row', 3, 10, 12], ['Straight-Arm Pulldown', 3, 12, 15]] }
const broShoulders: Day = { label: 'Shoulders', items: [['Overhead Press', 4, 6, 8], ['Dumbbell Lateral Raise', 4, 12, 15], ['Rear Delt Fly', 3, 12, 15], ['Barbell Shrug', 3, 10, 12]] }
const broArms: Day = { label: 'Arms', items: [['Barbell Curl', 3, 8, 10], ['Close-Grip Bench Press', 3, 6, 8], ['Incline Dumbbell Curl', 3, 10, 12], ['Skull Crusher', 3, 8, 10], ['Hammer Curl', 3, 10, 12], ['Rope Pushdown', 3, 10, 12]] }
const broLegs: Day = { label: 'Legs', items: [['Back Squat', 4, 6, 8], ['Leg Press', 3, 10, 12], ['Romanian Deadlift', 3, 8, 10], ['Leg Extension', 3, 12, 15], ['Lying Leg Curl', 3, 10, 12], ['Standing Calf Raise', 4, 10, 15]] }

const chestBack: Day = { label: 'Chest & Back', items: [['Bench Press', 4, 6, 8], ['Pull-Up', 4, 6, 10], ['Incline Dumbbell Press', 3, 8, 10], ['Barbell Row', 3, 8, 10], ['Dumbbell Fly', 3, 10, 12], ['Dumbbell Pullover', 3, 10, 12]] }
const shouldersArms: Day = { label: 'Shoulders & Arms', items: [['Arnold Press', 4, 8, 10], ['Dumbbell Lateral Raise', 3, 12, 15], ['Barbell Curl', 3, 8, 10], ['Skull Crusher', 3, 8, 10], ['Concentration Curl', 3, 10, 12], ['Triceps Pushdown', 3, 10, 12]] }
const arnoldLegs: Day = { label: 'Legs', items: [['Back Squat', 4, 6, 8], ['Romanian Deadlift', 3, 8, 10], ['Walking Lunge', 3, 10, 12], ['Leg Extension', 3, 12, 15], ['Lying Leg Curl', 3, 10, 12], ['Standing Calf Raise', 4, 10, 15], ['Crunch', 3, 15, 20]] }

const upperPower: Day = { label: 'Upper Power', items: [['Bench Press', 4, 3, 5], ['Barbell Row', 4, 3, 5], ['Overhead Press', 3, 5, 8], ['Lat Pulldown', 3, 6, 10], ['Barbell Curl', 2, 6, 10], ['Skull Crusher', 2, 6, 10]] }
const lowerPower: Day = { label: 'Lower Power', items: [['Back Squat', 4, 3, 5], ['Deadlift', 3, 3, 5], ['Leg Press', 3, 10, 15], ['Lying Leg Curl', 3, 6, 10], ['Standing Calf Raise', 4, 6, 10]] }
const upperHyp: Day = { label: 'Upper Hypertrophy', items: [['Incline Dumbbell Press', 4, 8, 12], ['Seated Cable Row', 4, 8, 12], ['Cable Crossover', 3, 12, 15], ['Dumbbell Lateral Raise', 3, 12, 15], ['Incline Dumbbell Curl', 3, 10, 12], ['Rope Pushdown', 3, 10, 12]] }
const lowerHyp: Day = { label: 'Lower Hypertrophy', items: [['Front Squat', 4, 8, 12], ['Bulgarian Split Squat', 3, 8, 12], ['Leg Extension', 3, 10, 15], ['Seated Leg Curl', 3, 10, 15], ['Seated Calf Raise', 4, 10, 15]] }

export const PRESETS: readonly Preset[] = [
  { key: 'ppl', name: 'Push / Pull / Legs', summary: '6 days · each muscle twice a week', week: [push, pull, legs, push, pull, legs, null] },
  { key: 'upper_lower', name: 'Upper / Lower', summary: '4 days · balanced and simple', week: [upper, lower, null, upper, lower, null, null] },
  { key: 'full_body_3', name: 'Full Body', summary: '3 days · great for beginners', week: [fullA, null, fullB, null, fullC, null, null] },
  { key: 'bro', name: 'Bro Split', summary: '5 days · one muscle group per day', week: [broChest, broBack, broShoulders, broArms, broLegs, null, null] },
  { key: 'arnold', name: 'Arnold Split', summary: '6 days · chest & back, shoulders & arms, legs', week: [chestBack, shouldersArms, arnoldLegs, chestBack, shouldersArms, arnoldLegs, null] },
  { key: 'phul', name: 'PHUL', summary: '4 days · power and hypertrophy, upper and lower', week: [upperPower, lowerPower, null, upperHyp, lowerHyp, null, null] },
]

const idByName = new Map(BUILTIN_EXERCISES.map((e) => [e.name, e.id]))

type Rows<T> = Omit<T, 'created_at' | 'updated_at'>
export type SplitRows = { split: Rows<Split>; days: Rows<SplitDay>[]; items: Rows<SplitDayExercise>[] }

/** A user-owned, fully editable copy of a preset (SP-2). */
export function buildPresetRows(preset: Preset, userId: string, uuid: () => string = () => crypto.randomUUID()): SplitRows {
  const split = { id: uuid(), user_id: userId, name: preset.name, source_preset: preset.key }
  const days: SplitRows['days'] = []
  const items: SplitRows['items'] = []
  preset.week.forEach((day, i) => {
    const dayRow = { id: uuid(), user_id: userId, split_id: split.id, weekday: i + 1, label: day?.label ?? '', is_rest: !day }
    days.push(dayRow)
    day?.items.forEach(([name, sets, min, max], position) => {
      const exerciseId = idByName.get(name)
      if (!exerciseId) throw new Error(`Preset ${preset.key} uses unknown exercise "${name}"`)
      items.push({
        id: uuid(),
        user_id: userId,
        split_day_id: dayRow.id,
        exercise_id: exerciseId,
        position,
        target_sets: sets,
        target_reps_min: min,
        target_reps_max: max,
      })
    })
  })
  return { split, days, items }
}

/** A blank custom split: seven rest days to name and fill (SP-3). */
export function buildCustomRows(name: string, userId: string, uuid: () => string = () => crypto.randomUUID()): SplitRows {
  const split = { id: uuid(), user_id: userId, name, source_preset: null }
  const days = Array.from({ length: 7 }, (_, i) => ({ id: uuid(), user_id: userId, split_id: split.id, weekday: i + 1, label: '', is_rest: true }))
  return { split, days, items: [] }
}
