/** A calendar date in the user's local time zone, formatted YYYY-MM-DD. */
export type LocalDate = string

const pad = (n: number) => String(n).padStart(2, '0')

export function toLocalDate(d: Date): LocalDate {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** Parses at local noon so DST shifts never move the date. */
export function parseLocalDate(s: LocalDate): Date {
  const [y, m, d] = s.split('-').map(Number) as [number, number, number]
  return new Date(y, m - 1, d, 12)
}

export function addDays(s: LocalDate, days: number): LocalDate {
  const d = parseLocalDate(s)
  d.setDate(d.getDate() + days)
  return toLocalDate(d)
}

/** ISO weekday: 1 = Monday … 7 = Sunday. */
export function isoWeekday(s: LocalDate): number {
  return parseLocalDate(s).getDay() || 7
}

export type YearMonth = { year: number; month: number } // month: 0-11

export function addMonths({ year, month }: YearMonth, n: number): YearMonth {
  const total = year * 12 + month + n
  return { year: Math.floor(total / 12), month: ((total % 12) + 12) % 12 }
}

export function compareYearMonth(a: YearMonth, b: YearMonth): number {
  return a.year * 12 + a.month - (b.year * 12 + b.month)
}

export function isInMonth(s: LocalDate, { year, month }: YearMonth): boolean {
  return s.startsWith(`${year}-${pad(month + 1)}-`)
}

/**
 * Cells for a Monday-first month grid: leading/trailing nulls pad to whole weeks.
 */
export function monthGrid({ year, month }: YearMonth): (LocalDate | null)[] {
  const first = toLocalDate(new Date(year, month, 1, 12))
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (LocalDate | null)[] = Array(isoWeekday(first) - 1).fill(null)
  for (let i = 0; i < daysInMonth; i++) cells.push(addDays(first, i))
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}
