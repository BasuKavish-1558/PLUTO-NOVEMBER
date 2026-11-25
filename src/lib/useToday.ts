import { useEffect, useState } from 'react'
import { toLocalDate, type LocalDate } from '@/domain/dates'

const msToNextMidnight = (now = new Date()) =>
  new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime() - now.getTime()

/** The local date, re-rendering at local midnight (NT-4 reset) and when the tab becomes visible. */
export function useToday(): LocalDate {
  const [today, setToday] = useState(() => toLocalDate(new Date()))
  useEffect(() => {
    const refresh = () => setToday(toLocalDate(new Date()))
    const timer = setTimeout(refresh, msToNextMidnight() + 500)
    document.addEventListener('visibilitychange', refresh)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('visibilitychange', refresh)
    }
  }, [today])
  return today
}
