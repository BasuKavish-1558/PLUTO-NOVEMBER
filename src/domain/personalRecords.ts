export type PrType = 'heaviest_weight' | 'most_reps_at_weight'
export type PrLike = { id: string; exercise_id: string; type: PrType; weight_kg: number; reps: number; created_at: string }

/** Weights compare on kg rounded to 3 decimals, so 225 lb always matches itself (PLAN A6). */
export const sameWeight = (a: number, b: number) => Math.round(a * 1000) === Math.round(b * 1000)

const earlier = (a: PrLike, b: PrLike) => a.created_at < b.created_at || (a.created_at === b.created_at && a.id < b.id)

/**
 * PR-5 / PLAN A6: the record this entry is measured against, computed (never stored), so edits and
 * deletes stay consistent. Only earlier PR entries for the same exercise and type count; set logs never do.
 *  - heaviest_weight: the earlier entry with the highest weight (ties: more reps, then the latest).
 *  - most_reps_at_weight: the earlier entry at the same weight with the most reps (ties: the latest).
 */
export function previousRecord<T extends PrLike>(pr: PrLike, all: readonly T[]): T | null {
  let best: T | null = null
  for (const p of all) {
    if (p.id === pr.id || p.exercise_id !== pr.exercise_id || p.type !== pr.type || !earlier(p, pr)) continue
    if (pr.type === 'most_reps_at_weight' && !sameWeight(p.weight_kg, pr.weight_kg)) continue
    if (!best || isBetter(p, best, pr.type) || (!isBetter(best, p, pr.type) && earlier(best, p))) best = p
  }
  return best
}

function isBetter(a: PrLike, b: PrLike, type: PrType) {
  if (type === 'most_reps_at_weight') return a.reps > b.reps
  return a.weight_kg > b.weight_kg || (sameWeight(a.weight_kg, b.weight_kg) && a.reps > b.reps)
}

/** Whether an entry tops its previous record. A first record always does. */
export function beatsPrevious(pr: Pick<PrLike, 'type' | 'weight_kg' | 'reps'>, previous: Pick<PrLike, 'weight_kg' | 'reps'> | null) {
  if (!previous) return true
  if (pr.type === 'most_reps_at_weight') return pr.reps > previous.reps
  return pr.weight_kg > previous.weight_kg && !sameWeight(pr.weight_kg, previous.weight_kg)
}
