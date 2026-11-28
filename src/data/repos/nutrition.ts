import { crossesGoal, dailyTotal, proteinGoalFor, type GoalType } from '@/domain/nutrition'
import { db, type NutritionEntry } from '../db'
import { commit, type Writer } from './write'

/**
 * NT-5: the user only ever sets a multiplier (a goal type pre-fills it). Changes take effect from
 * `from` (today, or a past day the user forgot to update) until the next change; a second change
 * on the same day replaces that day's row (unique per effective_from).
 */
export function setProteinGoal(userId: string, multiplier: number, goalType: GoalType | null, from: string) {
  return commit(async (w) => {
    const existing = (await db.nutrition_goals.where('user_id').equals(userId).toArray()).find(
      (g) => g.nutrient === 'protein' && g.effective_from === from,
    )
    if (existing) return w.patch('nutrition_goals', existing.id, { multiplier, goal_type: goalType })
    await w.insert('nutrition_goals', {
      id: crypto.randomUUID(),
      user_id: userId,
      nutrient: 'protein',
      basis: 'per_kg_bodyweight',
      multiplier,
      target: null,
      goal_type: goalType,
      effective_from: from,
    })
  })
}

async function proteinOn(userId: string, date: string) {
  const [entries, goals, weights] = await Promise.all([
    db.nutrition_entries.where('local_date').equals(date).filter((e) => e.user_id === userId && e.nutrient === 'protein').toArray(),
    db.nutrition_goals.where('user_id').equals(userId).filter((g) => g.nutrient === 'protein').toArray(),
    db.body_vitals.where('user_id').equals(userId).toArray(),
  ])
  return { total: dailyTotal(entries, date), goal: proteinGoalFor(date, goals, weights)?.grams ?? 0 }
}

/** Rule 6: protein_goal_met once per day per device, when an entry takes the day over the goal. */
async function maybeGoalMet(w: Writer, userId: string, date: string, before: number, now: Date) {
  const { total, goal } = await proteinOn(userId, date)
  const key = `protein_goal_met:${userId}:${date}`
  if (!crossesGoal(before, total, goal) || (await db.meta.get(key))) return
  await db.meta.put({ key, value: now.toISOString() })
  await w.event(userId, 'protein_goal_met', { local_date: date, total_g: total, goal_g: goal }, now.toISOString())
}

/** NT-2: an entry with an optional label ("Whey shake", 25 g). */
export function addProtein(userId: string, amount: number, label: string | null, date: string, now = new Date()) {
  return commit(async (w) => {
    const before = (await proteinOn(userId, date)).total
    await w.insert('nutrition_entries', {
      id: crypto.randomUUID(),
      user_id: userId,
      local_date: date,
      nutrient: 'protein',
      amount: Math.round(amount * 10) / 10,
      label: label?.trim() || null,
    })
    await maybeGoalMet(w, userId, date, before, now)
  })
}

/**
 * History → Edit: fill in a day the user forgot to log. Refuses ('already_logged') a day that
 * already has protein entries, so a missed day can't double-count; that day is edited in place instead.
 */
export function logMissedDay(userId: string, amount: number, label: string | null, date: string, now = new Date()) {
  return commit(async (w) => {
    const before = (await proteinOn(userId, date)).total
    const hasEntries = await db.nutrition_entries
      .where('local_date')
      .equals(date)
      .filter((e) => e.user_id === userId && e.nutrient === 'protein')
      .count()
    if (hasEntries) return 'already_logged' as const
    await w.insert('nutrition_entries', {
      id: crypto.randomUUID(),
      user_id: userId,
      local_date: date,
      nutrient: 'protein',
      amount: Math.round(amount * 10) / 10,
      label: label?.trim() || null,
    })
    await maybeGoalMet(w, userId, date, before, now)
    return 'ok' as const
  })
}

export const deleteEntry =(id: string) => commit((w) => w.remove('nutrition_entries', id))

/** Undo for deleteEntry: same id, so other devices converge. */
export const restoreEntry = (e: NutritionEntry) =>
  commit((w) =>
    w.insert('nutrition_entries', {
      id: e.id,
      user_id: e.user_id,
      local_date: e.local_date,
      nutrient: e.nutrient,
      amount: e.amount,
      label: e.label,
    }),
  )
