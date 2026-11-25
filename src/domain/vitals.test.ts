import { describe, expect, it } from 'vitest'
import { bmi, bmiCategory, latestWeight, sortWeightHistory } from './vitals'

const entry = (id: string, measured_at: string, weight_kg: number) => ({ id, measured_at, weight_kg })

describe('latestWeight', () => {
  it('returns null without entries', () => {
    expect(latestWeight([])).toBeNull()
  })

  it('picks the most recently measured entry, not the last in the list', () => {
    const entries = [
      entry('b', '2026-11-20T08:00:00.000Z', 81),
      entry('a', '2026-11-22T08:00:00.000Z', 80.5),
      entry('c', '2026-10-01T08:00:00.000Z', 83),
    ]
    expect(latestWeight(entries)?.id).toBe('a')
  })
})

describe('sortWeightHistory', () => {
  it('sorts newest first without mutating the input', () => {
    const entries = [entry('a', '2026-11-01T00:00:00.000Z', 80), entry('b', '2026-11-03T00:00:00.000Z', 79)]
    expect(sortWeightHistory(entries).map((e) => e.id)).toEqual(['b', 'a'])
    expect(entries[0]?.id).toBe('a')
  })
})

describe('bmi', () => {
  it('computes kg/m² to one decimal', () => {
    expect(bmi(80, 180)).toBe(24.7)
    expect(bmi(70, 175)).toBe(22.9)
  })

  it('uses WHO categories at the boundaries', () => {
    expect(bmiCategory(18.4)).toBe('underweight')
    expect(bmiCategory(18.5)).toBe('healthy')
    expect(bmiCategory(24.9)).toBe('healthy')
    expect(bmiCategory(25)).toBe('overweight')
    expect(bmiCategory(30)).toBe('obese')
  })
})
