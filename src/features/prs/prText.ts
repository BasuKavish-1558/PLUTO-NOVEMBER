import type { PersonalRecord } from '@/data/db'
import type { PrType } from '@/domain/personalRecords'
import { formatWeight, type WeightUnit } from '@/domain/units'

export const PR_TYPES: readonly { value: PrType; label: string }[] = [
  { value: 'heaviest_weight', label: 'Heaviest weight' },
  { value: 'most_reps_at_weight', label: 'Most reps' },
]

export const prLoad = (kg: number, unit: WeightUnit) => (kg ? formatWeight(kg, unit) : 'Bodyweight')

export const prValue = (pr: Pick<PersonalRecord, 'weight_kg' | 'reps'>, unit: WeightUnit) => `${prLoad(pr.weight_kg, unit)} × ${pr.reps}`

export const prTitle = (pr: Pick<PersonalRecord, 'type' | 'weight_kg'>, unit: WeightUnit) =>
  pr.type === 'heaviest_weight' ? 'Heaviest weight' : `Most reps at ${prLoad(pr.weight_kg, unit)}`

export const prDate = (iso: string) => new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
