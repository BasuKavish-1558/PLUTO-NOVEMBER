import { describe, expect, it } from 'vitest'
import seedSql from '../../supabase/migrations/20261125000002_seed_exercises.sql?raw'
import { BUILTIN_EXERCISES } from './library/builtinExercises'
import { buildCustomRows, buildPresetRows, PRESETS } from './presets'

let n = 0
const uuid = () => `id-${n++}`

describe('built-in library', () => {
  it('has about 150 exercises with unique ids and names', () => {
    expect(BUILTIN_EXERCISES.length).toBeGreaterThanOrEqual(140)
    expect(new Set(BUILTIN_EXERCISES.map((e) => e.id)).size).toBe(BUILTIN_EXERCISES.length)
    expect(new Set(BUILTIN_EXERCISES.map((e) => e.name.toLowerCase())).size).toBe(BUILTIN_EXERCISES.length)
  })

  it('matches the seed migration row for row', () => {
    const sql = seedSql
    for (const e of BUILTIN_EXERCISES) expect(sql).toContain(`('${e.id}', '${e.name.replace(/'/g, "''")}',`)
    expect(sql.match(/^ {2}\('/gm)).toHaveLength(BUILTIN_EXERCISES.length)
  })
})

describe('presets', () => {
  it('ships the six PRD presets', () => {
    expect(PRESETS.map((p) => p.key)).toEqual(['ppl', 'upper_lower', 'full_body_3', 'bro', 'arnold', 'phul'])
  })

  it.each(PRESETS.map((p) => [p.key, p] as const))('%s builds seven days from built-in exercises', (_key, preset) => {
    const rows = buildPresetRows(preset, 'user', uuid)
    expect(rows.days.map((d) => d.weekday)).toEqual([1, 2, 3, 4, 5, 6, 7])
    expect(rows.days.every((d) => d.split_id === rows.split.id && d.user_id === 'user')).toBe(true)
    expect(rows.items.length).toBeGreaterThan(0)
    for (const item of rows.items) {
      const day = rows.days.find((d) => d.id === item.split_day_id)!
      expect(day.is_rest).toBe(false)
      expect(item.target_reps_max! >= item.target_reps_min!).toBe(true)
    }
  })

  it('numbers exercises within each day from 0', () => {
    const rows = buildPresetRows(PRESETS[0]!, 'user', uuid)
    const monday = rows.items.filter((i) => i.split_day_id === rows.days[0]!.id).map((i) => i.position)
    expect(monday).toEqual([0, 1, 2, 3, 4, 5])
  })

  it('starts a custom split as seven rest days', () => {
    const rows = buildCustomRows('My split', 'user', uuid)
    expect(rows.split).toMatchObject({ name: 'My split', source_preset: null })
    expect(rows.days.every((d) => d.is_rest && d.label === '')).toBe(true)
  })
})
