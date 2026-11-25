import { expect, type Page } from '@playwright/test'

// The first visit to a lazy screen compiles its modules in dev; allow for a busy machine.
const SCREEN = { timeout: 15_000 }

/** Creates an account and finishes onboarding with metric units. */
export async function signUpAndOnboard(page: Page) {
  await page.goto('/auth')
  await page.getByLabel('Email').fill('sam@example.com')
  await page.getByLabel('Password', { exact: true }).fill('correct-horse')
  await page.getByRole('button', { name: 'Create account' }).last().click()

  await expect(page.getByRole('heading', { name: 'About you' })).toBeVisible(SCREEN)
  await page.getByLabel('Name').fill('Sam Rivera')
  await page.getByRole('button', { name: 'Continue' }).click()

  await expect(page.getByRole('heading', { name: 'Your body' })).toBeVisible(SCREEN)
  await page.getByLabel('Age').fill('29')
  await page.getByLabel('Body weight').fill('80')
  await page.getByRole('textbox', { name: 'Height' }).fill('178')
  await page.getByRole('button', { name: 'Finish' }).click()
  await expect(page.getByText('day streak')).toBeVisible(SCREEN)
}

export async function openProfile(page: Page, isMobile: boolean) {
  if (isMobile) await page.getByRole('link', { name: 'Profile' }).first().click()
  else await page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Profile' }).click()
  await expect(page).toHaveURL(/\/profile$/)
}
