import { addDays, parseLocalDate, type LocalDate } from '@/domain/dates'

/** "Today", "Yesterday", or "Tue, Nov 24". */
export function dayLabel(day: LocalDate, today: LocalDate) {
  if (day === today) return 'Today'
  if (day === addDays(today, -1)) return 'Yesterday'
  return parseLocalDate(day).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
}
