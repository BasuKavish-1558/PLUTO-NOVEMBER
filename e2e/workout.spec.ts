import { expect, test, type Page } from '@playwright/test'
import { fakeSupabase } from './support/fakeSupabase'
import { signUpAndOnboard } from './support/onboard'

async function startEmptyWithBench(page: Page) {
  await page.goto('/workout')
  await page.getByRole('button', { name: 'Empty workout' }).click()
  await expect(page.getByRole('timer', { name: 'Workout time' })).toBeVisible()
  await page.getByRole('button', { name: 'Add exercise' }).click()
  const picker = page.getByRole('dialog')
  await picker.getByLabel('Search exercises').fill('bench press')
  await picker.getByRole('button', { name: 'Add Bench Press' }).click()
  await picker.getByRole('button', { name: 'Done' }).click()
}

/** The exercise card whose heading is `name`. */
const card = (page: Page, name: string) =>
  page.locator('div.rounded-xl').filter({ has: page.getByRole('heading', { name, exact: true }) }).last()

async function finish(page: Page) {
  await page.getByRole('button', { name: 'Finish', exact: true }).click()
  await page.getByRole('button', { name: 'Finish and save' }).click()
  await expect(page.getByText('Workout saved. Nice work!')).toBeVisible()
}

test('log sets in two taps, warm-up, pause, notes and finish with a summary', async ({ page }) => {
  const server = await fakeSupabase(page)
  await signUpAndOnboard(page)
  await startEmptyWithBench(page)

  const bench = card(page, 'Bench Press')
  await bench.getByLabel('Weight (kg)').fill('60')
  await bench.getByLabel('Reps').fill('10')
  await bench.getByRole('button', { name: 'Log set' }).click()

  // Next set: one tap adds a pre-filled row, one tap logs it.
  await bench.getByRole('button', { name: 'Add set' }).click()
  await expect(bench.getByLabel('Weight (kg)').nth(1)).toHaveValue('60')
  await bench.getByLabel('Weight (kg)').nth(1).fill('80')
  await bench.getByLabel('Reps').nth(1).fill('8')
  await bench.getByRole('button', { name: 'Log set' }).click()
  await expect(bench.getByRole('button', { name: 'Undo set' })).toHaveCount(2)

  await bench.getByRole('button', { name: 'Set 1 options' }).click()
  await page.getByRole('button', { name: 'Mark as warm-up' }).click()
  await expect(bench.getByRole('button', { name: 'Set warm-up options' })).toBeVisible()

  await page.getByRole('button', { name: 'Pause timer' }).click()
  await expect(page.getByRole('timer')).toContainText('Paused')
  await page.getByRole('button', { name: 'Resume timer' }).click()

  await page.getByLabel('Notes').fill('Felt strong')
  await finish(page)

  await expect(page.getByText('+1 warm-up')).toBeVisible()
  await expect(page.getByText('640 kg')).toBeVisible() // warm-up excluded: 80 × 8
  await expect(page.getByText('Felt strong')).toBeVisible()

  await expect.poll(() => server.tables.set_logs!.length).toBe(2)
  await expect.poll(() => server.tables.events!.map((e) => e.type).sort()).toEqual(['set_logged', 'set_logged', 'workout_completed'])
})

test('the in-progress workout survives a reload', async ({ page }) => {
  await fakeSupabase(page)
  await signUpAndOnboard(page)
  await startEmptyWithBench(page)
  const bench = card(page, 'Bench Press')
  await bench.getByLabel('Weight (kg)').fill('70')
  await bench.getByLabel('Reps').fill('5')
  await bench.getByRole('button', { name: 'Log set' }).click()

  await page.goto('/workout')
  await page.getByRole('link', { name: /in progress/ }).click()
  await expect(card(page, 'Bench Press').getByLabel('Weight (kg)')).toHaveValue('70')
  await expect(card(page, 'Bench Press').getByRole('button', { name: 'Undo set' })).toBeVisible()
})

test('a split day starts pre-filled and shows last session (WK-5)', async ({ page }) => {
  await fakeSupabase(page)
  await signUpAndOnboard(page)
  await page.goto('/split')
  await page.getByRole('button', { name: 'New split' }).first().click()
  await page.getByRole('button', { name: /Push \/ Pull \/ Legs/ }).click()
  await expect(page.getByText("Active split: today's workout comes from here")).toBeVisible()

  const startPush = async () => {
    await page.goto('/workout')
    await page.getByRole('button', { name: /Pick another day|Train a split day anyway/ }).click()
    await page.getByRole('button', { name: /^Push/ }).first().click()
    await expect(page.getByRole('timer')).toBeVisible()
  }
  await startPush()
  const bench = card(page, 'Bench Press')
  await expect(bench.getByLabel('Reps')).toHaveCount(4) // target 4 × 6–8
  await expect(bench.getByLabel('Reps').first()).toHaveValue('6')
  await bench.getByLabel('Weight (kg)').first().fill('90')
  await bench.getByRole('button', { name: 'Log set' }).first().click()
  await finish(page)

  await startPush()
  await expect(card(page, 'Bench Press')).toContainText('Last time')
  await expect(card(page, 'Bench Press')).toContainText('90 kg × 6')
  await expect(card(page, 'Bench Press').getByLabel('Weight (kg)').first()).toHaveValue('90')
})

test('edit and delete a past workout', async ({ page }) => {
  await fakeSupabase(page)
  await signUpAndOnboard(page)
  await startEmptyWithBench(page)
  await card(page, 'Bench Press').getByLabel('Weight (kg)').fill('50')
  await card(page, 'Bench Press').getByLabel('Reps').fill('12')
  await card(page, 'Bench Press').getByRole('button', { name: 'Log set' }).click()
  await finish(page)

  await page.getByRole('link', { name: 'Edit' }).click()
  await card(page, 'Bench Press').getByLabel('Reps').fill('15')
  await page.getByRole('button', { name: 'Save changes' }).click()
  await expect(page.getByText('50 kg × 15')).toBeVisible()

  await page.getByRole('button', { name: 'Delete' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Delete' }).click()
  await expect(page).toHaveURL(/\/workout$/)
  await expect(page.getByText('No workouts yet')).toBeVisible()
})

test('logs offline and syncs when the connection returns', async ({ page, context }) => {
  const server = await fakeSupabase(page)
  await signUpAndOnboard(page)
  await startEmptyWithBench(page)
  await context.setOffline(true)

  await card(page, 'Bench Press').getByLabel('Weight (kg)').fill('100')
  await card(page, 'Bench Press').getByLabel('Reps').fill('3')
  await card(page, 'Bench Press').getByRole('button', { name: 'Log set' }).click()
  await finish(page)
  await page.waitForTimeout(500)
  expect(server.tables.workouts).toHaveLength(0)

  await context.setOffline(false)
  await expect.poll(() => server.tables.workouts!.length, { timeout: 10_000 }).toBe(1)
  await expect.poll(() => server.tables.set_logs!.map((s) => s.weight_kg)).toEqual([100])
})

test('an accidentally started timer can be reset to 0:00, keeping logged sets', async ({ page }) => {
  await fakeSupabase(page)
  await signUpAndOnboard(page)
  await startEmptyWithBench(page)
  await card(page, 'Bench Press').getByLabel('Reps').fill('5')
  await card(page, 'Bench Press').getByRole('button', { name: 'Log set' }).click()
  await page.waitForTimeout(2200)
  await expect(page.getByRole('timer')).not.toHaveText(/^0:0[01]/)

  await page.getByRole('button', { name: 'Reset timer' }).click()
  await page.getByRole('button', { name: 'Reset to 0:00' }).click()
  await expect(page.getByRole('timer')).toHaveText(/^0:0[01]/)
  await expect(card(page, 'Bench Press').getByRole('button', { name: 'Undo set' })).toHaveCount(1)
})
