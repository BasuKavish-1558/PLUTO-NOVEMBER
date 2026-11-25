import { expect, test } from '@playwright/test'
import { fakeSupabase, recoveryHash } from './support/fakeSupabase'

test.beforeEach(async ({ page }) => {
  await fakeSupabase(page)
})

test('signed-out visitors land on the auth screen', async ({ page }) => {
  await page.goto('/progress')
  await expect(page).toHaveURL(/\/auth$/)
  await expect(page.getByRole('radio', { name: 'Create account' })).toBeChecked()
})

test('validates email and password before sending', async ({ page }) => {
  await page.goto('/auth')
  await page.getByLabel('Email').fill('not-an-email')
  await page.getByLabel('Password', { exact: true }).fill('short')
  await page.getByRole('button', { name: 'Create account' }).last().click()
  await expect(page.getByText('Enter a valid email address')).toBeVisible()
  await expect(page.getByText('Use at least 8 characters')).toBeVisible()
})

test('shows a plain message for a wrong password', async ({ page }) => {
  await page.goto('/auth')
  await page.getByRole('radio', { name: 'Sign in' }).click()
  await page.getByLabel('Email').fill('sam@example.com')
  await page.getByLabel('Password', { exact: true }).fill('wrong-password')
  await page.getByRole('button', { name: 'Sign in' }).last().click()
  await expect(page.getByRole('alert')).toHaveText('Wrong email or password.')
})

test('theme chosen before sign-in persists across reloads', async ({ page }) => {
  await page.goto('/auth')
  const dark = await page.locator('html').evaluate((el) => el.classList.contains('dark'))
  await page.getByRole('button', { name: /Switch to (dark|light) theme/ }).click()
  await page.reload()
  await expect(page.locator('html')).toHaveClass(dark ? /^(?!.*dark)/ : /dark/)
})

test('forgot password: request a link, open it, set a new password, sign in with it', async ({ page }) => {
  const server = await fakeSupabase(page)
  await page.goto('/auth')
  await page.getByRole('radio', { name: 'Sign in' }).click()
  await page.getByLabel('Email').fill('sam@example.com')
  await page.getByRole('button', { name: 'Forgot password?' }).click()
  await expect(page.getByLabel('Email')).toHaveValue('sam@example.com') // carried over
  await page.getByRole('button', { name: 'Send reset link' }).click()
  await expect(page.getByRole('status')).toContainText('a reset link is on its way')
  expect(server.recoveries).toEqual([{ email: 'sam@example.com', redirectTo: expect.stringMatching(/\/reset-password$/) }])

  // The email link lands on /reset-password with a recovery session in the URL.
  await page.goto(`/reset-password${recoveryHash()}`)
  await page.getByLabel('New password', { exact: true }).fill('short')
  await page.getByRole('button', { name: 'Save password' }).click()
  await expect(page.getByText('Use at least 8 characters')).toBeVisible()
  await page.getByLabel('New password', { exact: true }).fill('brand-new-pass')
  await page.getByLabel('Confirm password').fill('brand-new-pass')
  await page.getByRole('button', { name: 'Save password' }).click()
  await expect(page.getByRole('heading', { name: 'About you' })).toBeVisible() // signed in, continues where they left off
  expect(server.password).toBe('brand-new-pass')
})

test('an expired reset link explains itself', async ({ page }) => {
  await fakeSupabase(page)
  await page.goto('/reset-password#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired')
  await expect(page.getByRole('heading', { name: 'Link not valid' })).toBeVisible()
  await expect(page.getByText(/expired or was already used/)).toBeVisible()
})

test('the sign-up confirmation link signs the user straight in', async ({ page }) => {
  await page.goto(`/${recoveryHash('signup')}`)
  await expect(page.getByRole('heading', { name: 'About you' })).toBeVisible({ timeout: 15_000 })
})
