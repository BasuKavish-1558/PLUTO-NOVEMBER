import { expect, test, type Page } from '@playwright/test'
import { fakeSupabase } from './support/fakeSupabase'

/**
 * The three core journeys end to end, as a new user on a phone would do them:
 * onboarding → logging a workout from the split → logging a PR mid-workout → seeing it everywhere.
 */

const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64')
const card = (page: Page, name: string) => page.locator('div.rounded-xl').filter({ has: page.getByRole('heading', { name, exact: true }) }).last()

test('onboarding: account, photo, imperial units, then Home', async ({ page }) => {
  const server = await fakeSupabase(page)
  await page.goto('/')
  await expect(page).toHaveURL(/\/auth$/)

  await page.getByLabel('Email').fill('alex@example.com')
  await page.getByLabel('Password', { exact: true }).fill('correct-horse')
  await page.getByRole('button', { name: 'Create account' }).last().click()

  await expect(page.getByRole('heading', { name: 'About you' })).toBeVisible()
  await expect(page.getByLabel('Email')).toHaveValue('alex@example.com')
  await expect(page.getByLabel('Email')).not.toBeEditable()
  await page.locator('input[type=file]:not([capture])').first().setInputFiles({ name: 'me.png', mimeType: 'image/png', buffer: PNG })
  await page.getByLabel('Name').fill('Alex Rivera')
  await page.getByRole('button', { name: 'Continue' }).click()

  await expect(page.getByRole('heading', { name: 'Your body' })).toBeVisible()
  await page.getByRole('radio', { name: 'Imperial' }).click()
  await page.getByLabel('Age').fill('31')
  await page.getByLabel('Body weight').fill('185')
  await page.getByRole('textbox', { name: 'Height' }).fill('5')
  await page.getByRole('textbox', { name: 'Inches' }).fill('11')
  await page.getByRole('button', { name: 'Finish' }).click()

  await expect(page.getByText('day streak')).toBeVisible()
  await expect.poll(() => server.profile.onboarded_at).toBeTruthy()
  expect(server.profile).toMatchObject({ name: 'Alex Rivera', age: 31, weight_unit: 'lb', length_unit: 'ft_in', height_cm: 180.3 })
  expect(server.profile.avatar_path).toMatch(/\/avatar\/.+\.(webp|jpg)$/)
  await expect.poll(() => server.tables.body_vitals![0]?.weight_kg).toBe(83.915) // stored in kg
  await expect.poll(() => server.tables.nutrition_goals!.map((g) => g.multiplier)).toEqual([1.6]) // default protein goal
})

test('workout and PR: from the split, two-tap sets, a PR mid-workout, then summary, calendar and progress', async ({ page }) => {
  const server = await fakeSupabase(page)
  await page.goto('/auth')
  await page.getByLabel('Email').fill('alex@example.com')
  await page.getByLabel('Password', { exact: true }).fill('correct-horse')
  await page.getByRole('button', { name: 'Create account' }).last().click()
  await page.getByLabel('Name').fill('Alex')
  await page.getByRole('button', { name: 'Continue' }).click()
  await page.getByLabel('Age').fill('31')
  await page.getByLabel('Body weight').fill('80')
  await page.getByRole('textbox', { name: 'Height' }).fill('180')
  await page.getByRole('button', { name: 'Finish' }).click()
  await expect(page.getByText('day streak')).toBeVisible()

  // Split
  await page.goto('/split')
  await page.getByRole('button', { name: 'New split' }).first().click()
  await page.getByRole('button', { name: /Push \/ Pull \/ Legs/ }).click()
  await expect(page.getByText("Active split: today's workout comes from here")).toBeVisible()

  // Workout from a split day
  await page.goto('/workout')
  await page.getByRole('button', { name: /Pick another day|Train a split day anyway/ }).click()
  await page.getByRole('button', { name: /^Push/ }).first().click()
  const bench = card(page, 'Bench Press')
  await expect(bench.getByLabel('Reps')).toHaveCount(4)

  // Type the weight once; every following set is pre-filled, so each is one tap on ✓.
  await bench.getByLabel('Weight (kg)').first().fill('80')
  for (let i = 0; i < 4; i++) await bench.getByRole('button', { name: 'Log set' }).first().click()
  await expect(bench.getByRole('button', { name: 'Undo set' })).toHaveCount(4)

  // PR mid-workout, with the confetti path (reduced motion off in tests)
  await page.getByRole('button', { name: 'Log a PR for Bench Press' }).click()
  const sheet = page.getByRole('dialog')
  await sheet.getByLabel('Weight (kg)').fill('85')
  await sheet.getByLabel('Reps', { exact: true }).fill('3')
  await expect(sheet.getByRole('status')).toHaveText('Your first record of this kind.')
  await sheet.getByRole('button', { name: 'Log PR' }).click()
  await expect(page.getByText(/New PR! Bench Press 85 kg × 3/)).toBeVisible()
  await expect(bench).toContainText('PR 85 kg × 3')

  await page.getByLabel('Notes').fill('Paused first rep')
  await page.getByRole('button', { name: 'Finish', exact: true }).click()
  await page.getByRole('button', { name: 'Finish and save' }).click()

  // Summary
  await expect(page.getByText('Workout saved. Nice work!')).toBeVisible()
  await expect(page.getByText('1,920 kg').or(page.getByText('1920 kg'))).toBeVisible() // 4 × 80 × 6
  await expect(page.getByRole('heading', { name: 'Personal records' })).toBeVisible()
  await expect(page.getByText('Paused first rep')).toBeVisible()

  // Calendar: today shaded, streak 1, day sheet shows the PR
  await page.goto('/')
  await expect(page.getByRole('button', { name: /workout logged/ })).toHaveCount(1)
  await page.getByRole('button', { name: /workout logged/ }).click()
  await expect(page.getByRole('dialog')).toContainText('Bench Press')
  await expect(page.getByRole('dialog').getByRole('heading', { name: 'Personal records' })).toBeVisible()
  await page.keyboard.press('Escape')

  // Progress: Bench is charted and the PR is listed as a first record
  await page.goto('/progress')
  await expect(page.getByRole('button', { name: /Exercise Bench Press/ })).toBeVisible()
  await expect(page.getByText('First record', { exact: true })).toBeVisible()

  // Everything reached the server, with events
  await expect.poll(() => server.tables.set_logs!.length).toBe(4)
  await expect.poll(() => server.tables.personal_records![0]?.workout_id).toBe(server.tables.workouts![0]?.id)
  await expect.poll(() => server.events().sort()).toEqual(['pr_logged', 'set_logged', 'set_logged', 'set_logged', 'set_logged', 'workout_completed'])
})
