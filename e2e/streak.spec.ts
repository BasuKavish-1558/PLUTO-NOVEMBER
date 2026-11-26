import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { fakeSupabase, USER_ID } from './support/fakeSupabase'
import { signUpAndOnboard } from './support/onboard'

const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const daysAgo = (n: number) => {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d
}
const workout = (d: Date) => ({
  id: crypto.randomUUID(),
  user_id: USER_ID,
  split_day_id: null,
  title: 'Seeded',
  local_date: ymd(d),
  started_at: new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12).toISOString(),
  ended_at: new Date(d.getFullYear(), d.getMonth(), d.getDate(), 13).toISOString(),
  duration_seconds: 3600,
  notes: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
})
const fmt = (d: Date, withYear: boolean) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', ...(withYear && { year: 'numeric' }) })

test('Home shows the longest streak with its dates, apart from the current one', async ({ page }) => {
  test.slow()
  const server = await fakeSupabase(page)
  // A 7-day run ending 14 days ago, then a break, then the current 3-day run (today and the 2 days before).
  server.tables.workouts = [...[20, 19, 18, 17, 16, 15, 14], 2, 1, 0].map((n) => workout(daysAgo(n)))
  await signUpAndOnboard(page)

  const card = page.locator('div.rounded-xl').filter({ hasText: 'Longest streak' }).last()
  await expect(card).toContainText('7 days', { timeout: 15_000 })
  const start = daysAgo(20)
  const end = daysAgo(14)
  const range = start.getFullYear() === end.getFullYear() ? `${fmt(start, false)} – ${fmt(end, true)}` : `${fmt(start, true)} – ${fmt(end, true)}`
  await expect(card).toContainText(range.normalize('NFKC'))
  await expect(card.getByText('Current')).toHaveCount(0) // the 3-day run now is not the longest
  await expect(page.getByText('3', { exact: true }).first()).toBeVisible() // current streak tile

  const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()
  expect(violations.map((v) => v.id)).toEqual([])
})

test('the current streak is flagged when it is the longest, and nothing shows without workouts', async ({ page }) => {
  const server = await fakeSupabase(page)
  await signUpAndOnboard(page)
  await expect(page.getByText('Longest streak')).toHaveCount(0) // a new account has no workouts

  server.tables.workouts = [4, 3, 2, 1, 0].map((n) => workout(daysAgo(n)))
  await page.reload()
  const card = page.locator('div.rounded-xl').filter({ hasText: 'Longest streak' }).last()
  await expect(card).toContainText('5 days', { timeout: 20_000 })
  await expect(card.getByText('Current')).toBeVisible()
})
