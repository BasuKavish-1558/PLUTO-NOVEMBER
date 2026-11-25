export type WeightUnit = 'kg' | 'lb'
export type LengthUnit = 'cm' | 'ft_in'
export type FeetInches = { ft: number; in: number }

export const LB_PER_KG = 2.20462262185
export const CM_PER_IN = 2.54

const round = (value: number, decimals: number) => {
  const f = 10 ** decimals
  return Math.round(value * f) / f
}

export const kgToLb = (kg: number) => kg * LB_PER_KG
export const lbToKg = (lb: number) => lb / LB_PER_KG

/** Rounded to whole inches, carrying 12″ into a foot. */
export function cmToFtIn(cm: number): FeetInches {
  const totalIn = Math.round(cm / CM_PER_IN)
  return { ft: Math.floor(totalIn / 12), in: totalIn % 12 }
}

export const ftInToCm = ({ ft, in: inches }: FeetInches) => (ft * 12 + inches) * CM_PER_IN

/** Stored weight (kg) → number shown in an input, 1 decimal. */
export const toDisplayWeight = (kg: number, unit: WeightUnit) =>
  round(unit === 'kg' ? kg : kgToLb(kg), 1)

/** Typed weight → kg for storage, 3 decimals to match numeric(·,3). */
export const toStoredWeight = (value: number, unit: WeightUnit) =>
  round(unit === 'kg' ? value : lbToKg(value), 3)

/** Typed height → cm for storage, 1 decimal to match numeric(5,1). */
export function toStoredHeight(value: number | FeetInches, unit: LengthUnit) {
  if (unit === 'cm') return round(value as number, 1)
  return round(ftInToCm(value as FeetInches), 1)
}

export const formatWeight = (kg: number, unit: WeightUnit) => `${toDisplayWeight(kg, unit)} ${unit}`

export function formatHeight(cm: number, unit: LengthUnit) {
  if (unit === 'cm') return `${round(cm, 1)} cm`
  const { ft, in: inches } = cmToFtIn(cm)
  return `${ft}′ ${inches}″`
}
