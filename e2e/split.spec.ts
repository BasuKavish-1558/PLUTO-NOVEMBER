import { expect, test, type Page } from '@playwright/test'
import { fakeSupabase } from './support/fakeSupabase'
import { signUpAndOnboard } from './support/onboard'

const PPL_WEEK = ['Push', 'Pull', 'Legs', 'Push', 'Pull', 'Legs', null]
const todayIndex = (new Date().getDay() + 6) % 7 // Monday = 0

async function newSplit(page: Page) {
  await page.goto('/split')
  await page.getByRole('button', { name: 'New split' }).first().click()
}

test('a preset becomes the active split and drives today on Workout', async ({ page }) => {
  const server = await fakeSupabase(page)
  await signUpAndOnboard(page)
  await newSplit(page)
  await page.getByRole('button', { name: /Push \/ Pull \/ Legs/ }).click()

  await expect(page.getByRole('heading', { name: 'Push / Pull / Legs' })).toBeVisible()
  await expect(page.getByText("Active split: today's workout comes from here")).toBeVisible()

  await page.goto('/workout')
  const label = PPL_WEEK[todayIndex]
  await expect(page.getByRole('heading', { level: 2, name: label ?? 'Rest day' })).toBeVisible()
  if (label) await expect(page.getByRole('button', { name: `Start ${label}` })).toBeVisible()

  await expect.poll(() => server.tables.split_days!.length).toBe(7)
  await expect.poll(() => server.profile.active_split_id).toBe(server.tables.splits![0]?.id)
})

test('custom split: name a day, add exercises, set targets, reorder and remove', async ({ page }) => {
  const server = await fakeSupabase(page)
  await signUpAndOnboard(page)
  await newSplit(page)
  await page.getByLabel('Or build a custom split').fill('My plan')
  await page.getByRole('button', { name: 'Create' }).click()
  await expect(page.getByRole('heading', { name: 'My plan' })).toBeVisible()

  await page.getByRole('link', { name: /^Mon/ }).click()
  await page.getByLabel('Rest day').click()
  await page.getByLabel('Day name').fill('Push A')
  await page.getByLabel('Day name').press('Enter')

  await page.getByRole('button', { name: 'Add exercises' }).click()
  const picker = page.getByRole('dialog')
  await picker.getByLabel('Search exercises').fill('bench press')
  await picker.getByRole('button', { name: 'Add Bench Press' }).click()
  await picker.getByLabel('Search exercises').fill('dumbbell fly')
  await picker.getByRole('button', { name: 'Add Dumbbell Fly' }).click()
  await picker.getByRole('button', { name: 'Done' }).click()

  const rows = page.getByRole('listitem').filter({ has: page.getByRole('button', { name: /Move .* up/ }) })
  await expect(rows).toHaveCount(2)
  await expect(rows.first()).toContainText('Bench Press')

  await page.getByRole('button', { name: 'Move Dumbbell Fly up' }).click()
  await expect(rows.first()).toContainText('Dumbbell Fly')

  await rows.filter({ hasText: 'Bench Press' }).getByRole('button').first().click()
  await page.getByLabel('Sets').fill('3')
  await page.getByLabel('Reps from').fill('8')
  await page.getByLabel('Reps to').fill('12')
  await page.getByRole('button', { name: 'Save' }).click()
  await expect(rows.filter({ hasText: 'Bench Press' })).toContainText('3 × 8–12')

  await rows.filter({ hasText: 'Dumbbell Fly' }).getByRole('button').first().click()
  await page.getByRole('button', { name: 'Remove from this day' }).click()
  await expect(rows).toHaveCount(1)

  await expect.poll(() => server.tables.split_day_exercises!.map((r) => r.target_sets)).toEqual([3])
  await expect.poll(() => server.tables.split_days!.find((d) => d.weekday === 1)?.label).toBe('Push A')
})

test('several splits, one active', async ({ page }) => {
  await fakeSupabase(page)
  await signUpAndOnboard(page)
  await newSplit(page)
  await page.getByRole('button', { name: /Push \/ Pull \/ Legs/ }).click()
  await expect(page.getByText("Active split: today's workout comes from here")).toBeVisible()
  await newSplit(page)
  await page.getByRole('button', { name: /Upper \/ Lower/ }).click()
  await expect(page.getByRole('heading', { name: 'Upper / Lower' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Make active' })).toBeVisible()

  await page.goto('/split')
  await expect(page.getByRole('heading', { name: 'Push / Pull / Legs' })).toBeVisible()
  await page.getByRole('listitem').filter({ hasText: 'Upper / Lower' }).getByRole('button', { name: 'Make active' }).click()
  await expect(page.getByRole('heading', { name: 'Upper / Lower' })).toBeVisible()
  await expect(page.getByRole('listitem').filter({ hasText: 'Push / Pull / Legs' })).toBeVisible()
})
