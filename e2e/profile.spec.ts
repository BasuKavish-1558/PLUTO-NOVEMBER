import { expect, test } from '@playwright/test'
import { fakeSupabase } from './support/fakeSupabase'
import { openProfile, signUpAndOnboard } from './support/onboard'

test('onboarding saves profile and vitals, then stays signed in after reload', async ({ page }) => {
  const server = await fakeSupabase(page)
  await signUpAndOnboard(page)

  await expect.poll(() => server.profile.onboarded_at).toBeTruthy()
  expect(server.profile).toMatchObject({ name: 'Sam Rivera', age: 29, height_cm: 178 })
  await expect.poll(() => server.tables.body_vitals!.map((v) => v.weight_kg)).toEqual([80])

  await page.reload()
  await expect(page.getByText('day streak')).toBeVisible()
})

test('switching units converts display but keeps kg and cm stored', async ({ page, isMobile }) => {
  const server = await fakeSupabase(page)
  await signUpAndOnboard(page)
  await openProfile(page, isMobile)

  await expect(page.getByText('80 kg', { exact: true }).first()).toBeVisible()
  await page.getByRole('radio', { name: 'Imperial' }).click()
  await expect(page.getByText('176.4 lbs', { exact: true }).first()).toBeVisible()
  await expect(page.getByText('5′ 10″')).toBeVisible()
  await expect.poll(() => server.profile.weight_unit).toBe('lb')
  expect(server.tables.body_vitals![0]?.weight_kg).toBe(80)
})

test('logs and deletes a weight entry, with BMI on request', async ({ page, isMobile }) => {
  await fakeSupabase(page)
  await signUpAndOnboard(page)
  await openProfile(page, isMobile)

  await page.getByRole('button', { name: 'Log weight' }).click()
  await page.getByLabel('Weight', { exact: true }).fill('79.5')
  await page.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByText('79.5 kg', { exact: true }).first()).toBeVisible()
  await expect(page.getByRole('button', { name: 'Delete entry' })).toHaveCount(2)

  await page.getByRole('switch', { name: /Show BMI/ }).click()
  await expect(page.getByText('25.1')).toBeVisible()

  await page.getByRole('button', { name: 'Delete entry' }).first().click()
  await expect(page.getByRole('button', { name: 'Delete entry' })).toHaveCount(1)
})

test('sign out returns to the auth screen and clears local data', async ({ page, isMobile }) => {
  await fakeSupabase(page)
  await signUpAndOnboard(page)
  await openProfile(page, isMobile)

  await page.getByRole('button', { name: 'Sign out' }).click()
  await expect(page).toHaveURL(/\/auth$/)
  // A string script: the e2e tsconfig has no DOM types.
  const profiles = await page.evaluate(`new Promise((resolve) => {
    const open = indexedDB.open('pluto')
    open.onsuccess = () => {
      const req = open.result.transaction('profiles').objectStore('profiles').count()
      req.onsuccess = () => resolve(req.result)
    }
  })`)
  expect(profiles).toBe(0)
})

test('appearance: theme (light/dark/system) and a gym background, saved to the profile', async ({ page }) => {
  const server = await fakeSupabase(page)
  await signUpAndOnboard(page)
  await page.goto('/profile')
  const appearance = page.locator('div.rounded-xl').filter({ has: page.getByRole('heading', { name: 'Appearance' }) })

  await appearance.getByRole('radio', { name: 'System' }).click()
  await expect(appearance.getByRole('radio', { name: 'System' })).toBeChecked()

  const backgrounds = appearance.getByRole('radiogroup', { name: 'Background' })
  await expect(backgrounds.getByRole('radio')).toHaveCount(6)
  await backgrounds.getByRole('radio', { name: 'Dumbbells' }).click()
  await expect(backgrounds.getByRole('radio', { name: 'Dumbbells' })).toBeChecked()
  await backgrounds.getByRole('radio', { name: 'Dumbbells' }).press('ArrowRight') // keyboard moves the choice
  await expect(backgrounds.getByRole('radio', { name: 'Kettlebells' })).toBeChecked()
  await expect.poll(() => server.profile.background, { timeout: 15_000 }).toBe('kettlebells') // background sync

  await page.reload()
  await expect(page.locator('div.fixed.-z-10')).toHaveCount(1) // the pattern layer survives a reload
  await backgrounds.getByRole('radio', { name: 'Plain' }).click()
  await expect(page.locator('div.fixed.-z-10')).toHaveCount(0)
})


test('change password needs the current one', async ({ page, isMobile }) => {
  const server = await fakeSupabase(page)
  await signUpAndOnboard(page)
  await openProfile(page, isMobile)
  await page.getByRole('button', { name: 'Change password' }).click()
  const sheet = page.getByRole('dialog')
  await sheet.getByLabel('Current password').fill('not-my-password')
  await sheet.getByLabel('New password', { exact: true }).fill('stronger-pass-1')
  await sheet.getByLabel('Confirm new password').fill('stronger-pass-1')
  await sheet.getByRole('button', { name: 'Change password' }).click()
  await expect(sheet.getByText('Your current password is wrong.')).toBeVisible()
  expect(server.password).toBe('correct-horse')

  await sheet.getByLabel('Current password').fill('correct-horse')
  await sheet.getByRole('button', { name: 'Change password' }).click()
  await expect(page.getByText('Password changed')).toBeVisible()
  expect(server.password).toBe('stronger-pass-1')
})
