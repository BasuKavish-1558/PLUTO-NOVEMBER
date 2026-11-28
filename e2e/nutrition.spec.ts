import { expect, test } from '@playwright/test'
import { fakeSupabase } from './support/fakeSupabase'
import { signUpAndOnboard } from './support/onboard'

const ring = (page: import('@playwright/test').Page) => page.getByRole('img', { name: /grams of protein/ })

test('goal comes from body weight × multiplier; quick-add, labels and delete', async ({ page }) => {
  const server = await fakeSupabase(page)
  await signUpAndOnboard(page) // 80 kg, default maintain 1.6
  await page.goto('/nutrition')

  await expect(ring(page)).toHaveAccessibleName('0 of 128 grams of protein')
  await expect(page.getByText('128 g a day')).toBeVisible()
  await expect(page.getByText('80 kg × 1.6 g/kg · Maintain')).toBeVisible()

  await page.getByRole('group', { name: 'Quick add' }).getByRole('button', { name: '+20 g' }).click()
  await expect(ring(page)).toHaveAccessibleName('20 of 128 grams of protein')

  await page.getByRole('button', { name: 'Custom' }).click()
  await page.getByRole('textbox', { name: 'Protein' }).fill('25')
  await page.getByLabel('Label (optional)').fill('Whey shake')
  await page.getByRole('button', { name: 'Add', exact: true }).click()
  await expect(ring(page)).toHaveAccessibleName('45 of 128 grams of protein')
  await expect(page.getByRole('button', { name: /\+25 g.*Whey shake/ })).toBeVisible() // now a one-tap repeat

  await page.getByRole('button', { name: 'Delete Whey shake 25 g' }).click()
  await expect(ring(page)).toHaveAccessibleName('20 of 128 grams of protein')
  await expect.poll(() => server.tables.nutrition_entries!.length).toBe(1)
})

test('editing the goal changes only the multiplier; grams cannot be typed', async ({ page }) => {
  const server = await fakeSupabase(page)
  await signUpAndOnboard(page)
  await page.goto('/nutrition')
  await page.getByRole('button', { name: 'Edit', exact: true }).click()

  const sheet = page.getByRole('dialog')
  await expect(sheet.getByRole('textbox')).toHaveCount(0)
  await sheet.getByRole('radio', { name: 'Cut' }).click()
  await expect(sheet).toContainText('160 g a day')
  await sheet.getByRole('button', { name: 'Increase multiplier' }).click()
  await expect(sheet).toContainText('168 g a day')
  await sheet.getByRole('button', { name: 'Save goal' }).click()

  await expect(page.getByRole('main').getByText('168 g a day')).toBeVisible()
  await expect.poll(() => server.tables.nutrition_goals!.map((g) => [g.multiplier, g.goal_type])).toEqual([[2.1, 'cut']])
})

test('reaching the goal celebrates once and emits protein_goal_met', async ({ page }) => {
  const server = await fakeSupabase(page)
  await signUpAndOnboard(page)
  await page.goto('/nutrition')
  await page.getByRole('button', { name: 'Custom' }).click()
  await page.getByRole('textbox', { name: 'Protein' }).fill('130')
  await page.getByRole('button', { name: 'Add', exact: true }).click()
  await expect(page.getByText('Goal reached')).toBeVisible()
  await expect.poll(() => server.tables.events!.filter((e) => e.type === 'protein_goal_met').length).toBe(1)
})

test('totals reset at local midnight and yesterday moves to history', async ({ page }) => {
  await page.clock.install({ time: new Date(2026, 10, 24, 22, 0) })
  await fakeSupabase(page)
  await signUpAndOnboard(page)
  await page.goto('/nutrition')
  await page.getByRole('group', { name: 'Quick add' }).getByRole('button', { name: '+30 g' }).click()
  await expect(ring(page)).toHaveAccessibleName('30 of 128 grams of protein')

  await page.clock.runFor('03:00:00')
  await expect(ring(page)).toHaveAccessibleName('0 of 128 grams of protein')
  await expect(page.getByRole('button', { name: /Tue, Nov 24.*30 \/ 128 g/ })).toBeVisible()
})

test('a forgotten day can be filled in afterwards: entries and the goal', async ({ page }) => {
  await page.clock.install({ time: new Date(2026, 10, 26, 9, 0) }) // Thu, Nov 26
  const server = await fakeSupabase(page)
  await signUpAndOnboard(page)
  await page.goto('/nutrition')
  await expect(page.getByRole('button', { name: 'Next day' })).toBeDisabled() // never ahead of today

  // Yesterday has no entries at all, so it isn't in History: step back to it.
  await page.getByRole('button', { name: 'Previous day' }).click()
  await expect(page).toHaveURL(/date=2026-11-25/)
  await expect(page.getByRole('heading', { name: 'Yesterday' })).toBeVisible()
  await page.getByRole('group', { name: 'Quick add' }).getByRole('button', { name: '+30 g' }).click()
  await page.getByRole('button', { name: 'Custom' }).click()
  await expect(page.getByRole('dialog')).toContainText('Add protein · Yesterday')
  await page.getByRole('textbox', { name: 'Protein' }).fill('40')
  await page.getByRole('button', { name: 'Add', exact: true }).click()
  await expect(ring(page)).toHaveAccessibleName('70 of 128 grams of protein')

  // The goal can be backdated too: it applies from that day until the next change (here, sign-up today).
  await page.getByRole('button', { name: 'Edit', exact: true }).click()
  const sheet = page.getByRole('dialog')
  await expect(sheet).toContainText('Applies from Yesterday onward')
  await sheet.getByRole('radio', { name: 'Cut' }).click()
  await sheet.getByRole('button', { name: 'Save goal' }).click()
  await expect(ring(page)).toHaveAccessibleName('70 of 160 grams of protein')

  await page.getByRole('button', { name: 'Today', exact: true }).click()
  await expect(page).not.toHaveURL(/date=/)
  await expect(ring(page)).toHaveAccessibleName('0 of 128 grams of protein') // today: nothing logged; today's own goal (set at sign-up) still wins
  await page.getByRole('button', { name: /Wed, Nov 25.*70 \/ 160 g/ }).click() // History opens the day again
  await expect(page.getByRole('heading', { name: 'Yesterday' })).toBeVisible()

  await expect.poll(() => server.tables.nutrition_entries!.map((e) => [e.local_date, e.amount]).sort()).toEqual([['2026-11-25', 30], ['2026-11-25', 40]])
  await expect.poll(() => server.tables.nutrition_goals!.map((g) => [g.effective_from, g.multiplier]).sort()).toEqual([['2026-11-25', 2], ['2026-11-26', 1.6]])
})

test('History → Edit logs a missed day, and refuses a day that is already logged', async ({ page }) => {
  await page.clock.install({ time: new Date(2026, 10, 26, 9, 0) }) // Thu, Nov 26
  const server = await fakeSupabase(page)
  await signUpAndOnboard(page)
  await page.goto('/nutrition')

  await page.getByRole('button', { name: 'Edit history: log a missed day' }).click()
  const sheet = page.getByRole('dialog')
  await sheet.getByLabel('Date').fill('2026-11-24')
  await sheet.getByRole('textbox', { name: 'Protein' }).fill('120')
  await sheet.getByRole('button', { name: 'Log', exact: true }).click()
  await expect(sheet).toBeHidden()
  await expect(page.getByRole('button', { name: /Tue, Nov 24.*120 \/ 128 g/ })).toBeVisible()

  await page.getByRole('button', { name: 'Edit history: log a missed day' }).click()
  await sheet.getByLabel('Date').fill('2026-11-24')
  await sheet.getByRole('textbox', { name: 'Protein' }).fill('50')
  await sheet.getByRole('button', { name: 'Log', exact: true }).click()
  await expect(sheet).toContainText('Protein is already logged for Tue, Nov 24')

  await expect.poll(() => server.tables.nutrition_entries!.map((e) => [e.local_date, e.amount])).toEqual([['2026-11-24', 120]])
})
