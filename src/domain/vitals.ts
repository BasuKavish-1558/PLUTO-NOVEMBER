export type WeightEntry = { id: string; measured_at: string; weight_kg: number }
export type BmiCategory = 'underweight' | 'healthy' | 'overweight' | 'obese'

/** "Current weight" = the entry measured most recently (not the one created last). */
export function latestWeight<T extends WeightEntry>(entries: readonly T[]): T | null {
  let latest: T | null = null
  for (const e of entries) if (!latest || e.measured_at > latest.measured_at) latest = e
  return latest
}

/** Newest first. Ties keep a stable order by id. */
export function sortWeightHistory<T extends WeightEntry>(entries: readonly T[]): T[] {
  return [...entries].sort((a, b) =>
    a.measured_at === b.measured_at ? a.id.localeCompare(b.id) : b.measured_at.localeCompare(a.measured_at),
  )
}

/** kg / m², one decimal. */
export function bmi(weightKg: number, heightCm: number): number {
  const m = heightCm / 100
  return Math.round((weightKg / (m * m)) * 10) / 10
}

/** WHO adult cut-offs. */
export function bmiCategory(value: number): BmiCategory {
  if (value < 18.5) return 'underweight'
  if (value < 25) return 'healthy'
  if (value < 30) return 'overweight'
  return 'obese'
}
