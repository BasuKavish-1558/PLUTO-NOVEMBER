import { expect, test } from '@playwright/test'
import { fakeSupabase } from './support/fakeSupabase'
import { signUpAndOnboard } from './support/onboard'

test.beforeEach(async ({ page }) => {
  await fakeSupabase(page)
  await signUpAndOnboard(page)
  await page.goto('/split/library')
})

test('browses ~150 exercises, searches and filters', async ({ page }) => {
  await expect(page.getByText(/^1[45]\d exercises$/)).toBeVisible()

  await page.getByLabel('Search exercises').fill('pullup')
  await expect(page.getByRole('button', { name: /^Pull-Up/ })).toBeVisible()

  await page.getByLabel('Clear search').click()
  await page.getByRole('group', { name: 'Muscle group' }).getByRole('button', { name: 'Biceps' }).click()
  await page.getByRole('group', { name: 'Equipment' }).getByRole('button', { name: 'Cable' }).click()
  await expect(page.getByText('3 exercises')).toBeVisible()
  await expect(page.getByRole('button', { name: /^Bayesian Cable Curl/ })).toBeVisible()
})

test('adds a custom exercise, archives it and restores it', async ({ page }) => {
  await page.getByRole('button', { name: 'New exercise' }).click()
  await page.getByLabel('Name').fill('Zercher Squat')
  await page.getByRole('radio', { name: 'Quads' }).click()
  await page.getByRole('radio', { name: 'Barbell' }).click()
  await page.getByRole('button', { name: 'Add exercise' }).click()

  await page.getByLabel('Search exercises').fill('zercher')
  await page.getByRole('button', { name: /^Zercher Squat/ }).click()
  await page.getByRole('button', { name: 'Archive' }).click()
  await expect(page.getByRole('button', { name: /^Zercher Squat/ })).toHaveCount(0)

  await page.getByLabel('Show archived').click()
  await page.getByRole('button', { name: /^Zercher Squat/ }).click()
  await page.getByRole('button', { name: 'Restore' }).click()
  // With nothing archived any more, the toggle goes away and the exercise is listed normally.
  await expect(page.getByLabel('Show archived')).toHaveCount(0)
  await expect(page.getByRole('button', { name: /^Zercher Squat/ })).toBeVisible()
})

test('refuses a duplicate name', async ({ page }) => {
  await page.getByRole('button', { name: 'New exercise' }).click()
  await page.getByLabel('Name').fill('bench press')
  await page.getByRole('radio', { name: 'Chest' }).click()
  await page.getByRole('radio', { name: 'Barbell' }).click()
  await page.getByRole('button', { name: 'Add exercise' }).click()
  await expect(page.getByText('An exercise with this name already exists')).toBeVisible()
})
