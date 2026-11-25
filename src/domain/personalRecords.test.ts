import { describe, expect, it } from 'vitest'
import { beatsPrevious, previousRecord, sameWeight, type PrLike } from './personalRecords'
import { toStoredWeight } from './units'

let n = 0
const pr = (type: PrLike['type'], weight_kg: number, reps: number, created_at: string, exercise_id = 'bench'): PrLike => ({
  id: `pr-${++n}`,
  exercise_id,
  type,
  weight_kg,
  reps,
  created_at,
})

describe('previousRecord: heaviest weight', () => {
  const a = pr('heaviest_weight', 90, 3, '2026-09-01T10:00:00Z')
  const b = pr('heaviest_weight', 100, 1, '2026-10-03T10:00:00Z')
  const c = pr('heaviest_weight', 95, 2, '2026-10-20T10:00:00Z')
  const d = pr('heaviest_weight', 105, 1, '2026-11-24T10:00:00Z')
  const other = pr('heaviest_weight', 200, 1, '2026-10-01T10:00:00Z', 'squat')
  const reps = pr('most_reps_at_weight', 150, 20, '2026-10-01T10:00:00Z')
  const all = [a, b, c, d, other, reps]

  it('is the earlier entry with the highest weight, same exercise and type only', () => {
    expect(previousRecord(d, all)).toBe(b)
    expect(previousRecord(c, all)).toBe(b) // 95 did not beat 100
  })

  it('is null for the first record', () => {
    expect(previousRecord(a, all)).toBeNull()
  })

  it('only looks at entries created before this one', () => {
    expect(previousRecord(b, all)).toBe(a)
  })

  it('updates when a record is deleted or edited (it is computed, not stored)', () => {
    expect(previousRecord(d, all.filter((p) => p !== b))).toBe(c)
    expect(previousRecord(d, all.map((p) => (p === c ? { ...c, weight_kg: 101 } : p)))?.id).toBe(c.id)
  })

  it('breaks weight ties by reps', () => {
    const x = pr('heaviest_weight', 100, 2, '2026-10-04T10:00:00Z')
    expect(previousRecord(d, [...all, x])).toBe(x)
  })
})

describe('previousRecord: most reps at a weight', () => {
  const at100a = pr('most_reps_at_weight', 100, 5, '2026-09-01T10:00:00Z')
  const at100b = pr('most_reps_at_weight', 100, 7, '2026-10-01T10:00:00Z')
  const at90 = pr('most_reps_at_weight', 90, 12, '2026-10-05T10:00:00Z')
  const now = pr('most_reps_at_weight', 100, 8, '2026-11-24T10:00:00Z')

  it('compares only entries at the same weight', () => {
    expect(previousRecord(now, [at100a, at100b, at90, now])).toBe(at100b)
    expect(previousRecord(at90, [at100a, at100b, at90, now])).toBeNull()
  })

  it('matches weights entered in lb deterministically', () => {
    const lbA = pr('most_reps_at_weight', toStoredWeight(225, 'lb'), 5, '2026-10-01T10:00:00Z')
    const lbB = pr('most_reps_at_weight', toStoredWeight(225, 'lb'), 6, '2026-11-01T10:00:00Z')
    expect(sameWeight(lbA.weight_kg, lbB.weight_kg)).toBe(true)
    expect(previousRecord(lbB, [lbA, lbB])).toBe(lbA)
  })
})

describe('beatsPrevious', () => {
  it('a first record always counts', () => {
    expect(beatsPrevious({ type: 'heaviest_weight', weight_kg: 50, reps: 1 }, null)).toBe(true)
  })

  it('heaviest needs more weight; most reps needs more reps', () => {
    expect(beatsPrevious({ type: 'heaviest_weight', weight_kg: 102.5, reps: 1 }, { weight_kg: 100, reps: 3 })).toBe(true)
    expect(beatsPrevious({ type: 'heaviest_weight', weight_kg: 100, reps: 5 }, { weight_kg: 100, reps: 3 })).toBe(false)
    expect(beatsPrevious({ type: 'most_reps_at_weight', weight_kg: 100, reps: 8 }, { weight_kg: 100, reps: 7 })).toBe(true)
    expect(beatsPrevious({ type: 'most_reps_at_weight', weight_kg: 100, reps: 7 }, { weight_kg: 100, reps: 7 })).toBe(false)
  })
})
