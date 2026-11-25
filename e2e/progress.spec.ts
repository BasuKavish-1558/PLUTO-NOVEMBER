import { expect, test, type Page } from '@playwright/test'
import { fakeSupabase } from './support/fakeSupabase'
import { signUpAndOnboard } from './support/onboard'

const card = (page: Page, name: string) =>
  page.locator('div.rounded-xl').filter({ has: page.getByRole('heading', { name, exact: true }) }).last()

/** An empty workout with one Bench Press set; leaves the workout open unless `finish`. */
async function benchWorkout(page: Page, weight: string, reps: string, finish = true) {
  await page.goto('/workout')
  await page.getByRole('button', { name: 'Empty workout' }).click()
  await page.getByRole('button', { name: 'Add exercise' }).click()
  const picker = page.getByRole('dialog')
  await picker.getByLabel('Search exercises').fill('bench press')
  await picker.getByRole('button', { name: 'Add Bench Press' }).click()
  await picker.getByRole('button', { name: 'Done' }).click()
  await card(page, 'Bench Press').getByLabel('Weight (kg)').fill(weight)
  await card(page, 'Bench Press').getByLabel('Reps').fill(reps)
  await card(page, 'Bench Press').getByRole('button', { name: 'Log set' }).click()
  if (!finish) return
  await page.getByRole('button', { name: 'Finish', exact: true }).click()
  await page.getByRole('button', { name: 'Finish and save' }).click()
  await expect(page.getByText('Workout saved. Nice work!')).toBeVisible()
}

test('per-exercise charts: weight, volume and estimated 1RM with a table view', async ({ page }) => {
  await fakeSupabase(page)
  await signUpAndOnboard(page)
  await benchWorkout(page, '80', '5')
  await benchWorkout(page, '90', '3')

  await page.goto('/progress')
  await expect(page.getByRole('button', { name: /Exercise Bench Press/ })).toBeVisible() // most recent exercise
  await expect(page.getByRole('heading', { name: 'Top working-set weight' })).toBeVisible()
  await page.getByText('Show as table').click()
  await expect(page.getByRole('table')).toContainText('90 kg')
  await expect(page.getByRole('table').getByRole('row')).toHaveCount(3) // header + 2 sessions

  await page.getByRole('radio', { name: 'Volume' }).click()
  await expect(page.getByRole('table')).toContainText('400 kg') // 80 × 5
  await page.getByRole('radio', { name: 'Est. 1RM' }).click()
  await expect(page.getByRole('table')).toContainText('99 kg') // 90 × (1 + 3/30)

  for (const r of ['1M', '6M', '1Y', 'All']) await page.getByRole('radio', { name: r, exact: true }).click()
  await expect(page.getByRole('table').getByRole('row')).toHaveCount(3)
})

test('manual PRs: first record, log anyway, previous record beaten, edit and delete', async ({ page }) => {
  const server = await fakeSupabase(page)
  await signUpAndOnboard(page)
  await benchWorkout(page, '80', '5')
  await page.goto('/progress')

  const logPr = async (weight: string, reps: string) => {
    await page.getByRole('button', { name: 'Log PR' }).click()
    await page.getByRole('dialog').getByLabel('Weight (kg)').fill(weight)
    await page.getByRole('dialog').getByLabel('Reps', { exact: true }).fill(reps)
  }

  await logPr('100', '1')
  await expect(page.getByRole('status').filter({ hasText: 'first record' })).toBeVisible()
  await page.getByRole('button', { name: 'Log PR', exact: true }).last().click()
  await expect(page.getByText('First record', { exact: true })).toBeVisible()

  await logPr('95', '1')
  await expect(page.getByRole('status').filter({ hasText: "doesn't beat 100 kg × 1" })).toBeVisible()
  await page.getByRole('button', { name: 'Log PR', exact: true }).last().click()
  await page.getByRole('button', { name: 'Log anyway' }).click()
  await expect(page.getByText(/Didn't beat 100 kg × 1/)).toBeVisible()

  await page.getByRole('button', { name: /95 kg × 1/ }).click()
  await page.getByRole('dialog').getByLabel('Weight (kg)').fill('105')
  await page.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByText(/^Beat 100 kg × 1/)).toBeVisible()
  await expect.poll(() => server.tables.personal_records!.map((p) => p.weight_kg).sort()).toEqual([100, 105])

  await page.getByRole('button', { name: /105 kg × 1/ }).click()
  await page.getByRole('button', { name: 'Delete PR' }).click()
  await page.getByRole('button', { name: 'Tap again to delete' }).click()
  await expect(page.getByRole('button', { name: /105 kg × 1/ })).toHaveCount(0)
  await expect.poll(() => server.events()).toContain('pr_logged')
})

test('a PR logged mid-workout appears in the workout summary and the day sheet', async ({ page }) => {
  const server = await fakeSupabase(page)
  await signUpAndOnboard(page)
  await benchWorkout(page, '100', '3', false)

  await page.getByRole('button', { name: 'Log a PR for Bench Press' }).click()
  const sheet = page.getByRole('dialog')
  await expect(sheet.getByLabel('Weight (kg)')).toHaveValue('100')
  await expect(sheet.getByLabel('Reps', { exact: true })).toHaveValue('3')
  await page.getByRole('button', { name: 'Log PR', exact: true }).click()
  await expect(card(page, 'Bench Press')).toContainText('PR 100 kg × 3')

  await page.getByRole('button', { name: 'Finish', exact: true }).click()
  await page.getByRole('button', { name: 'Finish and save' }).click()
  await expect(page.getByRole('heading', { name: 'Personal records' })).toBeVisible()
  await expect(page.getByRole('link', { name: /Bench Press.*100 kg × 3/ })).toBeVisible()
  await expect.poll(() => server.tables.personal_records![0]?.workout_id).toBe(server.tables.workouts![0]?.id)

  await page.goto('/nutrition')
  await page.getByRole('group', { name: 'Quick add' }).getByRole('button', { name: '+30 g' }).click()
  await expect(page.getByRole('img', { name: /^30 of 128 grams/ })).toBeVisible() // saved before navigating away
  await page.goto('/')
  await page.getByRole('button', { name: /workout logged/ }).click()
  const day = page.getByRole('dialog')
  await expect(day.getByRole('heading', { name: 'Personal records' })).toBeVisible()
  await expect(day.getByRole('heading', { name: 'Protein' })).toBeVisible()
  await expect(day).toContainText('30 g of 128 g')
})

test('body weight chart', async ({ page }) => {
  await fakeSupabase(page)
  await signUpAndOnboard(page)
  await page.goto('/progress?tab=body')
  await page.getByText('Show as table').click()
  await expect(page.getByRole('table').getByRole('row')).toHaveCount(2)
  await expect(page.getByRole('table')).toContainText('80 kg')
})
