import { useMemo } from 'react'
import { db, type NutritionEntry } from '@/data/db'
import { dailyTotal, dailyTotals, proteinGoalFor } from '@/domain/nutrition'
import { useLive } from '@/lib/useLive'
import { useSession } from '@/stores/session'

export type QuickItem = { amount: number; label: string | null }
const QUICK_LIMIT = 6
const DEFAULT_QUICK: QuickItem[] = [
  { amount: 10, label: null },
  { amount: 20, label: null },
  { amount: 30, label: null },
]

/** Everything Nutrition needs, from local data (works offline). */
export function useProtein(today: string) {
  const session = useSession()
  const userId = session.status === 'ready' ? session.userId : null
  const data = useLive(async () => {
    if (!userId) return null
    const [goals, weights, entries] = await Promise.all([
      db.nutrition_goals.where('user_id').equals(userId).filter((g) => g.nutrient === 'protein').toArray(),
      db.body_vitals.where('user_id').equals(userId).toArray(),
      db.nutrition_entries.where('user_id').equals(userId).filter((e) => e.nutrient === 'protein').toArray(),
    ])
    return { goals, weights, entries }
  }, [userId])

  return useMemo(() => {
    if (!data) return undefined
    const { goals, weights, entries } = data
    const byNewest = [...entries].sort((a, b) => b.created_at.localeCompare(a.created_at))
    return {
      goal: proteinGoalFor(today, goals, weights),
      total: dailyTotal(entries, today),
      todayEntries: byNewest.filter((e) => e.local_date === today),
      history: dailyTotals(entries).map((d) => ({ ...d, goal: proteinGoalFor(d.date, goals, weights)?.grams ?? null })),
      quick: recentQuickItems(byNewest),
    }
  }, [data, today])
}

/** One-tap repeats of what the user logs most recently ("Whey shake · 25 g"). */
function recentQuickItems(byNewest: NutritionEntry[]): QuickItem[] {
  const seen = new Set<string>()
  const items: QuickItem[] = []
  for (const e of byNewest) {
    const key = `${e.label ?? ''}|${e.amount}`
    if (seen.has(key)) continue
    seen.add(key)
    items.push({ amount: e.amount, label: e.label })
    if (items.length === QUICK_LIMIT) break
  }
  return items.length ? items : DEFAULT_QUICK
}
