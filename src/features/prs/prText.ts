import type { PersonalRecord } from '@/data/db'
import type { PrType } from '@/domain/personalRecords'
import { formatHold } from '@/domain/tracking'
import { formatWeight, type WeightUnit } from '@/domain/units'

/** Record types offered for weighted exercises. Bodyweight and timed exercises have just one kind. */
export const PR_TYPES: readonly { value: PrType; label: string }[] = [
  { value: 'heaviest_weight', label: 'Heaviest weight' },
  { value: 'most_reps_at_weight', label: 'Most reps' },
]

type PrValue = Pick<PersonalRecord, 'type' | 'weight_kg' | 'reps' | 'duration_seconds'>

/** "1:10" for a hold, "80 kg × 5" for a weighted record, "12 reps" for a bodyweight one. */
export const prValue = (pr: PrValue, unit: WeightUnit) => {
  if (pr.type === 'longest_hold') return formatHold(pr.duration_seconds ?? 0)
  if (pr.weight_kg) return `${formatWeight(pr.weight_kg, unit)} × ${pr.reps}`
  return `${pr.reps} ${pr.reps === 1 ? 'rep' : 'reps'}`
}

export const prTitle = (pr: Pick<PersonalRecord, 'type' | 'weight_kg'>, unit: WeightUnit) => {
  if (pr.type === 'longest_hold') return 'Longest hold'
  if (pr.type === 'heaviest_weight') return 'Heaviest weight'
  return pr.weight_kg ? `Most reps at ${formatWeight(pr.weight_kg, unit)}` : 'Most reps'
}

export const prDate = (iso: string) => new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
