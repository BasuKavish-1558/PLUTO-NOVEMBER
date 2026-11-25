import type { ReactNode } from 'react'
import { seriesSummary } from '@/domain/chartSeries'

/** Latest, best and change over the selected range. Direction is the +/− sign, never color. */
export function StatTiles({ values, format, lowerIsBetter = false }: { values: number[]; format: (v: number) => string; lowerIsBetter?: boolean }) {
  const summary = seriesSummary(values)
  if (!summary) return null
  const { latest, best, change } = summary
  const sign = change > 0 ? '+' : change < 0 ? '−' : '±'
  return (
    <dl className="grid grid-cols-3 gap-2">
      <Tile label="Latest" value={format(latest)} />
      <Tile label={lowerIsBetter ? 'Highest' : 'Best'} value={format(best)} />
      <Tile
        label="Change"
        value={`${sign}${format(Math.abs(change))}`}
      />
    </dl>
  )
}

function Tile({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-xl bg-muted/60 px-3 py-2.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 truncate font-semibold tabular-nums">{value}</dd>
    </div>
  )
}
