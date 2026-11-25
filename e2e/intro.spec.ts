import { expect, test } from '@playwright/test'
import { fakeSupabase } from './support/fakeSupabase'

test('first launch: logo and intro, then "Get started" leads to sign-in', async ({ page }) => {
  await fakeSupabase(page, { intro: true })
  await page.goto('/')
  const intro = page.getByRole('dialog', { name: 'Pluto' })
  await expect(intro).toBeVisible()
  await expect(intro).toContainText('Log every set in two taps')
  await expect(intro.getByRole('button', { name: 'Get started' })).toBeFocused()
  await intro.getByRole('button', { name: 'Get started' }).click()
  await expect(intro).toHaveCount(0)
  await expect(page.getByRole('radio', { name: 'Create account' })).toBeVisible()

  // A refresh within the same launch doesn't replay it.
  await page.reload()
  await expect(page.getByRole('radio', { name: 'Create account' })).toBeVisible()
  await expect(page.getByRole('dialog', { name: 'Pluto' })).toHaveCount(0)
})

test('later launches: the same intro plays, then continues by itself (tap to skip)', async ({ context }) => {
  const first = await context.newPage()
  await fakeSupabase(first, { intro: true })
  await first.goto('/')
  await first.getByRole('button', { name: 'Get started' }).click()
  await first.close()

  // A new launch (new tab = new session).
  const page = await context.newPage()
  await page.goto('/')
  const intro = page.getByRole('dialog', { name: 'Pluto' })
  await expect(intro).toBeVisible()
  await expect(intro.getByRole('button', { name: 'Get started' })).toHaveCount(0)
  await expect(intro).toHaveCount(0, { timeout: 5000 }) // auto-continues
  await expect(page.getByRole('radio', { name: 'Create account' })).toBeVisible()

  const again = await context.newPage()
  await again.goto('/')
  await again.getByRole('dialog', { name: 'Pluto' }).click() // tap skips
  await expect(again.getByRole('dialog', { name: 'Pluto' })).toHaveCount(0, { timeout: 1000 })
})
