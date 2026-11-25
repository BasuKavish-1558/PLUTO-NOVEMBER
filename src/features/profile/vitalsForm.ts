import { z } from 'zod'
import {
  cmToFtIn,
  toDisplayWeight,
  toStoredHeight,
  toStoredWeight,
  type LengthUnit,
  type WeightUnit,
} from '@/domain/units'

/** Limits mirror the database checks (profiles, body_vitals). */
export const MAX_NAME = 80
export const LIMITS = { age: [13, 120], weightKg: [20, 400], heightCm: [50, 272] } as const

type Parsed<T> = { ok: true; value: T } | { ok: false; error: string }
const fail = (error: string): Parsed<never> => ({ ok: false, error })

const number = z.coerce.number<string>().refine((n) => Number.isFinite(n))
const toNumber = (text: string) => (text.trim() === '' ? null : number.safeParse(text.replace(',', '.')).data ?? null)

export function parseAge(text: string): Parsed<number> {
  const n = toNumber(text)
  const [min, max] = LIMITS.age
  if (n === null || !Number.isInteger(n) || n < min || n > max) return fail(`Enter an age from ${min} to ${max}`)
  return { ok: true, value: n }
}

export function parseWeight(text: string, unit: WeightUnit): Parsed<number> {
  const n = toNumber(text)
  const kg = n === null ? null : toStoredWeight(n, unit)
  const [min, max] = LIMITS.weightKg
  if (kg === null || kg < min || kg > max) {
    return fail(`Enter a weight from ${Math.ceil(toDisplayWeight(min, unit))} to ${Math.floor(toDisplayWeight(max, unit))} ${unit}`)
  }
  return { ok: true, value: kg }
}

export const weightDraft = (kg: number | null, unit: WeightUnit) => (kg === null ? '' : String(toDisplayWeight(kg, unit)))

/** Both representations are kept so switching units mid-form converts instead of clearing. */
export type HeightDraft = { cm: string; ft: string; in: string }

export function heightDraft(cm: number | null): HeightDraft {
  if (cm === null) return { cm: '', ft: '', in: '' }
  const { ft, in: inches } = cmToFtIn(cm)
  return { cm: String(Math.round(cm * 10) / 10), ft: String(ft), in: String(inches) }
}

export function parseHeight(draft: HeightDraft, unit: LengthUnit): Parsed<number> {
  const [min, max] = LIMITS.heightCm
  let cm: number | null = null
  if (unit === 'cm') {
    const n = toNumber(draft.cm)
    cm = n === null ? null : toStoredHeight(n, 'cm')
  } else {
    const ft = toNumber(draft.ft)
    const inches = draft.in.trim() === '' ? 0 : toNumber(draft.in)
    if (ft !== null && inches !== null && inches >= 0 && inches < 12) cm = toStoredHeight({ ft, in: inches }, 'ft_in')
  }
  if (cm === null || cm < min || cm > max) {
    return fail(unit === 'cm' ? `Enter a height from ${min} to ${max} cm` : 'Enter a height from 1′ 8″ to 8′ 11″')
  }
  return { ok: true, value: cm }
}

/** Re-express a valid draft in the new unit; leave half-typed input alone. */
export function convertWeightDraft(text: string, from: WeightUnit, to: WeightUnit) {
  const parsed = parseWeight(text, from)
  return parsed.ok ? weightDraft(parsed.value, to) : text
}

export function convertHeightDraft(draft: HeightDraft, from: LengthUnit) {
  const parsed = parseHeight(draft, from)
  return parsed.ok ? heightDraft(parsed.value) : draft
}
