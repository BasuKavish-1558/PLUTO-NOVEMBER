import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { parseLocalDate } from '@/domain/dates'

export type ChartPoint = { date: string; value: number }
type Props = { title: string; points: ChartPoint[]; format: (v: number) => string; height?: number }

const shortDate = (d: string) => parseLocalDate(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
const longDate = (d: string) => parseLocalDate(d).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })

/**
 * One series, so no legend: the title names it. 2px line, 8px dots ringed with the surface,
 * recessive horizontal grid, crosshair + tooltip on hover/touch, and a table view for screen readers.
 */
export function ProgressChart({ title, points, format, height = 220 }: Props) {
  return (
    <figure className="space-y-2">
      <figcaption className="sr-only">{title}</figcaption>
      <div style={{ height }} aria-hidden>
        <ResponsiveContainer width="100%" height="100%">
          {/* Not focusable: the "Show as table" view below is the accessible version of this chart. */}
          <LineChart data={points} margin={{ top: 12, right: 12, bottom: 0, left: 0 }} accessibilityLayer={false}>
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis
              dataKey="date"
              tickFormatter={shortDate}
              tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              minTickGap={24}
            />
            <YAxis
              width={44}
              domain={['auto', 'auto']}
              tickFormatter={(v: number) => String(Math.round(v))}
              tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              cursor={{ stroke: 'var(--muted-foreground)', strokeWidth: 1, strokeDasharray: '3 3' }}
              content={({ active, payload }) => {
                const p = payload?.[0]?.payload as ChartPoint | undefined
                if (!active || !p) return null
                return (
                  <div className="rounded-lg border bg-popover px-3 py-2 text-sm shadow-md">
                    <p className="text-muted-foreground">{longDate(p.date)}</p>
                    <p className="font-semibold tabular-nums text-popover-foreground">{format(p.value)}</p>
                  </div>
                )
              }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="var(--chart-1)"
              strokeWidth={2}
              dot={{ r: 4, fill: 'var(--chart-1)', stroke: 'var(--card)', strokeWidth: 2 }}
              activeDot={{ r: 6, fill: 'var(--chart-1)', stroke: 'var(--card)', strokeWidth: 2 }}
              isAnimationActive={!window.matchMedia('(prefers-reduced-motion: reduce)').matches}
              animationDuration={400}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <details className="text-sm">
        <summary className="flex min-h-11 cursor-pointer items-center gap-1 text-muted-foreground select-none">Show as table</summary>
        <table className="w-full tabular-nums">
          <caption className="sr-only">{title}</caption>
          <thead>
            <tr className="text-left text-muted-foreground">
              <th className="py-1 font-medium">Date</th>
              <th className="py-1 text-right font-medium">{title}</th>
            </tr>
          </thead>
          <tbody>
            {[...points].reverse().map((p) => (
              <tr key={p.date} className="border-t">
                <td className="py-1.5">{longDate(p.date)}</td>
                <td className="py-1.5 text-right">{format(p.value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  )
}
