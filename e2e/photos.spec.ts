import { expect, test, type Page } from '@playwright/test'
import { fakeSupabase } from './support/fakeSupabase'
import { signUpAndOnboard } from './support/onboard'

const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64',
)

async function logQuickWorkout(page: Page) {
  await page.goto('/workout')
  await page.getByRole('button', { name: 'Empty workout' }).click()
  await page.getByRole('button', { name: 'Add exercise' }).click()
  const picker = page.getByRole('dialog')
  await picker.getByLabel('Search exercises').fill('push-up')
  await picker.getByRole('button', { name: 'Add Push-Up' }).click()
  await picker.getByRole('button', { name: 'Done' }).click()
  await page.getByLabel('Reps').first().fill('20')
  await page.getByRole('button', { name: 'Log set' }).first().click()
  await page.getByRole('button', { name: 'Finish', exact: true }).click()
  await page.getByRole('button', { name: 'Finish and save' }).click()
  await expect(page.getByText('Workout saved. Nice work!')).toBeVisible()
}

const addPhoto = (page: Page, name: string) =>
  page.getByLabel('Choose a photo').setInputFiles({ name, mimeType: 'image/png', buffer: PNG })

test('a workout day takes up to 3 photos, viewable and deletable', async ({ page }) => {
  const server = await fakeSupabase(page)
  await signUpAndOnboard(page)
  await logQuickWorkout(page)

  await page.goto('/')
  await expect(page.getByRole('button', { name: /workout logged/ })).toHaveCount(1) // binary shading
  await expect(page.getByText('day streak')).toBeVisible()
  await page.getByRole('button', { name: /workout logged/ }).click()
  const day = page.getByRole('dialog')
  await expect(day).toContainText('Push-Up')
  await expect(day).toContainText('0/3')

  for (const n of [1, 2, 3]) {
    await addPhoto(page, `p${n}.png`)
    await expect(day).toContainText(`${n}/3`)
  }
  await expect(day.getByRole('button', { name: /Add photo/ })).toHaveCount(0)
  await expect.poll(() => server.tables.workout_photos!.length).toBe(3)

  await day.getByRole('button', { name: 'Photo 2 of 3' }).click()
  await page.getByRole('button', { name: 'Delete photo' }).click()
  await page.getByRole('button', { name: 'Tap again to delete' }).click()
  await expect(page.getByRole('dialog', { name: 'Photo 1 of 2' })).toBeVisible() // stays open on the neighbour
  await page.keyboard.press('Escape')
  await expect(day.getByRole('button', { name: /Photo \d of 2/ })).toHaveCount(2)
  await expect(day).toContainText('2/3')
  await expect.poll(() => server.tables.workout_photos!.length).toBe(2)
})

test('days without a workout have no photo slot', async ({ page }) => {
  await fakeSupabase(page)
  await signUpAndOnboard(page)
  await page.getByRole('button', { name: 'Previous month' }).click()
  await page.getByRole('button', { name: /\b15\b/ }).first().click()
  await expect(page.getByRole('dialog')).toContainText('No workout logged on this day')
  await expect(page.getByRole('button', { name: /Add photo/ })).toHaveCount(0)
})
