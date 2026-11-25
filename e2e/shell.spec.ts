import { expect, test } from '@playwright/test'
import { fakeSupabase } from './support/fakeSupabase'
import { signUpAndOnboard } from './support/onboard'

test.beforeEach(async ({ page }) => {
  await fakeSupabase(page)
  await signUpAndOnboard(page)
})

test('home shows the calendar and a tapped day opens its log', async ({ page }) => {
  await expect(page.getByRole('button', { name: 'Previous month' })).toBeVisible()
  await expect(page.getByRole('button', { name: /workout logged/ })).toHaveCount(0) // a new account has no history
  await page.getByRole('button', { name: 'Previous month' }).click()
  await page.getByRole('button', { name: /\b15\b/ }).first().click()
  await expect(page.getByRole('dialog')).toContainText('No workout logged on this day')
})

test('navigation reaches every page', async ({ page, isMobile }) => {
  const nav = page.getByRole('navigation', { name: 'Primary' })
  await nav.getByRole('link', { name: 'Workout' }).click()
  await expect(page).toHaveURL(/\/workout$/)

  if (isMobile) {
    await nav.getByRole('button', { name: 'More' }).click()
    await page.getByRole('link', { name: /Nutrition/ }).click()
    await expect(page).toHaveURL(/\/nutrition$/)
    await page.getByRole('link', { name: 'Profile' }).click() // header avatar
    await expect(page).toHaveURL(/\/profile$/)
  } else {
    await nav.getByRole('link', { name: 'Split' }).click()
    await expect(page).toHaveURL(/\/split$/)
  }
})

test('theme choice is saved to the profile and survives reload', async ({ page }) => {
  await page.goto('/profile')
  await page.getByRole('radio', { name: 'Dark' }).click()
  await expect(page.locator('html')).toHaveClass(/dark/)
  await page.reload()
  await expect(page.locator('html')).toHaveClass(/dark/)
})
