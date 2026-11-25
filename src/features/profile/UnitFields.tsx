import type { ComponentProps } from 'react'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Segmented } from '@/components/ui/segmented'
import { weightLabel, type LengthUnit, type WeightUnit } from '@/domain/units'
import type { HeightDraft } from './vitalsForm'

function Suffixed({ suffix, ...props }: ComponentProps<typeof Input> & { suffix: string }) {
  return (
    <div className="relative flex-1">
      <Input inputMode="decimal" className="pr-12" {...props} />
      <span className="pointer-events-none absolute inset-y-0 right-4 grid place-items-center text-sm text-muted-foreground">
        {suffix}
      </span>
    </div>
  )
}

type WeightProps = { id: string; label?: string; unit: WeightUnit; value: string; error?: string; onChange: (v: string) => void }

export function WeightField({ id, label = 'Body weight', unit, value, error, onChange }: WeightProps) {
  return (
    <Field label={label} htmlFor={id} error={error}>
      <Suffixed
        id={id}
        suffix={weightLabel(unit)}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-msg` : undefined}
      />
    </Field>
  )
}

type HeightProps = { id: string; unit: LengthUnit; value: HeightDraft; error?: string; onChange: (v: HeightDraft) => void }

export function HeightField({ id, unit, value, error, onChange }: HeightProps) {
  const invalid = { 'aria-invalid': !!error, 'aria-describedby': error ? `${id}-msg` : undefined }
  return (
    <Field label="Height" htmlFor={id} error={error}>
      {unit === 'cm' ? (
        <Suffixed id={id} suffix="cm" value={value.cm} onChange={(e) => onChange({ ...value, cm: e.target.value })} {...invalid} />
      ) : (
        <div className="flex gap-3">
          <Suffixed id={id} suffix="ft" inputMode="numeric" value={value.ft} onChange={(e) => onChange({ ...value, ft: e.target.value })} {...invalid} />
          <Suffixed aria-label="Inches" suffix="in" inputMode="numeric" value={value.in} onChange={(e) => onChange({ ...value, in: e.target.value })} {...invalid} />
        </div>
      )}
    </Field>
  )
}

type UnitsProps = { weightUnit: WeightUnit; lengthUnit: LengthUnit; onChange: (w: WeightUnit, l: LengthUnit) => void }

/** One-tap Metric/Imperial preset plus the two independent switches (kg + ft-in is common). */
export function UnitsPicker({ weightUnit, lengthUnit, onChange }: UnitsProps) {
  const preset = weightUnit === 'kg' && lengthUnit === 'cm' ? 'metric' : weightUnit === 'lb' && lengthUnit === 'ft_in' ? 'imperial' : null
  return (
    <div className="space-y-3">
      <Segmented
        label="Unit system"
        value={preset}
        options={[{ value: 'metric', label: 'Metric' }, { value: 'imperial', label: 'Imperial' }]}
        onChange={(p) => (p === 'metric' ? onChange('kg', 'cm') : onChange('lb', 'ft_in'))}
      />
      <div className="grid grid-cols-2 gap-3">
        <Segmented
          label="Weight unit"
          value={weightUnit}
          options={[{ value: 'kg', label: 'kg' }, { value: 'lb', label: 'lbs' }]}
          onChange={(w) => onChange(w, lengthUnit)}
        />
        <Segmented
          label="Height unit"
          value={lengthUnit}
          options={[{ value: 'cm', label: 'cm' }, { value: 'ft_in', label: 'ft · in' }]}
          onChange={(l) => onChange(weightUnit, l)}
        />
      </div>
    </div>
  )
}
