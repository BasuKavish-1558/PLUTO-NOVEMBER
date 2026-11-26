import { expect, test, type Page } from '@playwright/test'
import { fakeSupabase } from './support/fakeSupabase'
import { signUpAndOnboard } from './support/onboard'

/** Bodyweight exercises log reps only; Dead Hang logs time. Built-in ids are stable UUIDs. */
const DEAD_HANG = 'cfe584af-8b5b-56d6-bb56-38b1ab417dbc'

const card = (page: Page, name: string) => page.locator('div.rounded-xl').filter({ has: page.getByRole('heading', { name, exact: true }) }).last()

async function startEmpty(page: Page) {
  await page.goto('/workout')
  await page.getByRole('button', { name: 'Empty workout' }).click()
  await expect(page.getByRole('timer')).toBeVisible()
}

async function addExercise(page: Page, search: string, button: string) {
  await page.getByRole('button', { name: 'Add exercise' }).click()
  const picker = page.getByRole('dialog')
  await picker.getByLabel('Search exercises').fill(search)
  await picker.getByRole('button', { name: button }).click()
  await picker.getByRole('button', { name: 'Done' }).click()
}

async function finish(page: Page) {
  await page.getByRole('button', { name: 'Finish', exact: true }).click()
  await page.getByRole('button', { name: 'Finish and save' }).click()
  await expect(page.getByText('Workout saved. Nice work!')).toBeVisible()
}

test('bodyweight exercises ask for reps only; Dead Hang asks for time', async ({ page }) => {
  test.slow()
  const server = await fakeSupabase(page)
  await signUpAndOnboard(page)
  await startEmpty(page)
  await addExercise(page, 'pull-up', 'Add Pull-Up')
  await addExercise(page, 'dead hang', 'Add Dead Hang')
  await addExercise(page, 'bench press', 'Add Bench Press')

  const pull = card(page, 'Pull-Up')
  await expect(pull.getByLabel('Reps')).toHaveCount(1)
  await expect(pull.getByLabel(/^Weight/)).toHaveCount(0) // no weight for bodyweight
  await expect(pull.getByText('kg', { exact: true })).toHaveCount(0)
  await pull.getByLabel('Reps').fill('12')
  await pull.getByRole('button', { name: 'Log set' }).click()

  const hang = card(page, 'Dead Hang')
  await expect(hang.getByLabel('Time (m:ss)')).toHaveCount(1)
  await expect(hang.getByLabel(/^Weight/)).toHaveCount(0)
  await expect(hang.getByLabel('Reps')).toHaveCount(0)
  await expect(hang.getByText('Time', { exact: true })).toBeVisible() // column header
  await hang.getByLabel('Time (m:ss)').fill('0') // not a valid hold: can't be logged
  await hang.getByRole('button', { name: 'Log set' }).click()
  await expect(hang.getByRole('button', { name: 'Undo set' })).toHaveCount(0)
  await hang.getByLabel('Time (m:ss)').fill('1:15')
  await hang.getByRole('button', { name: 'Log set' }).click()
  await expect(hang.getByRole('button', { name: 'Undo set' })).toHaveCount(1)

  // Weighted exercises are unchanged: weight and reps.
  const bench = card(page, 'Bench Press')
  await expect(bench.getByLabel('Weight (kg)')).toHaveCount(1)
  await expect(bench.getByLabel('Reps')).toHaveCount(1)

  await finish(page)
  await expect(card(page, 'Dead Hang')).toContainText('1:15')
  await expect(card(page, 'Pull-Up')).toContainText('12 reps')
  await expect(card(page, 'Pull-Up')).not.toContainText('kg')

  await expect.poll(() => server.tables.set_logs!.length).toBe(2)
  const sets = server.tables.set_logs!
  expect(sets.find((s) => s.duration_seconds === 75)).toMatchObject({ weight_kg: 0, reps: 1 }) // a hold is one rep plus its time
  expect(sets.find((s) => !('duration_seconds' in s))).toMatchObject({ weight_kg: 0, reps: 12 }) // pull-ups: no weight
})

test('the next session pre-fills the last hold, and a hold can be edited afterwards', async ({ page }) => {
  test.slow()
  await fakeSupabase(page)
  await signUpAndOnboard(page)
  await startEmpty(page)
  await addExercise(page, 'dead hang', 'Add Dead Hang')
  await card(page, 'Dead Hang').getByLabel('Time (m:ss)').fill('45') // plain seconds
  await card(page, 'Dead Hang').getByRole('button', { name: 'Log set' }).click()
  await finish(page)
  await expect(card(page, 'Dead Hang')).toContainText('0:45')

  // Edit the saved hold.
  await page.getByRole('link', { name: 'Edit' }).click()
  await card(page, 'Dead Hang').getByLabel('Time (m:ss)').fill('1:30')
  await page.getByRole('button', { name: 'Save changes' }).click()
  await expect(page.getByText('Workout updated')).toBeVisible()
  await expect(card(page, 'Dead Hang')).toContainText('1:30')

  // Next session.
  await startEmpty(page)
  await addExercise(page, 'dead hang', 'Add Dead Hang')
  const hang = card(page, 'Dead Hang')
  await expect(hang).toContainText('Last time')
  await expect(hang).toContainText('1:30')
  await expect(hang.getByLabel('Time (m:ss)')).toHaveValue('1:30') // pre-filled: one tap logs it
  await hang.getByRole('button', { name: 'Add set' }).click()
  await expect(hang.getByLabel('Time (m:ss)').nth(1)).toHaveValue('1:30') // a new set copies the last
})

test('personal records: longest hold for Dead Hang, most reps for bodyweight, charted by hold and reps', async ({ page }) => {
  test.slow()
  const server = await fakeSupabase(page)
  await signUpAndOnboard(page)
  await startEmpty(page)
  await addExercise(page, 'dead hang', 'Add Dead Hang')
  await addExercise(page, 'pull-up', 'Add Pull-Up')
  await card(page, 'Dead Hang').getByLabel('Time (m:ss)').fill('1:15')
  await card(page, 'Dead Hang').getByRole('button', { name: 'Log set' }).click()
  await card(page, 'Pull-Up').getByLabel('Reps').fill('12')
  await card(page, 'Pull-Up').getByRole('button', { name: 'Log set' }).click()

  // Dead Hang PR: just a time (pre-filled from the best hold), no weight, reps or type switch.
  await page.getByRole('button', { name: 'Log a PR for Dead Hang' }).click()
  const sheet = page.getByRole('dialog')
  await expect(sheet.getByLabel('Longest hold (m:ss)')).toHaveValue('1:15')
  await expect(sheet.getByLabel(/^Weight/)).toHaveCount(0)
  await expect(sheet.getByRole('radiogroup', { name: 'Record type' })).toHaveCount(0)
  await sheet.getByLabel('Longest hold (m:ss)').fill('2:00:00') // above the 1 hour cap
  await sheet.getByRole('button', { name: 'Log PR' }).click()
  await expect(sheet.getByText(/Enter a time like 45 or 1:30/)).toBeVisible()
  await sheet.getByLabel('Longest hold (m:ss)').fill('1:30')
  await expect(sheet.getByRole('status')).toHaveText('Your first record of this kind.')
  await sheet.getByRole('button', { name: 'Log PR' }).click()
  await expect(page.getByText('New PR! Dead Hang 1:30')).toBeVisible()
  await expect(card(page, 'Dead Hang')).toContainText('PR 1:30')

  // Pull-Up PR: just reps.
  await page.getByRole('button', { name: 'Log a PR for Pull-Up' }).click()
  await expect(sheet.getByLabel('Most reps in one set')).toHaveValue('12')
  await expect(sheet.getByLabel(/^Weight/)).toHaveCount(0)
  await sheet.getByRole('button', { name: 'Log PR' }).click()
  await expect(card(page, 'Pull-Up')).toContainText('PR 12 reps')

  await finish(page)
  await expect(page.getByRole('heading', { name: 'Personal records' })).toBeVisible()
  await expect(page.getByRole('link', { name: /Dead Hang.*1:30.*Longest hold/ })).toBeVisible()

  await expect.poll(() => server.tables.personal_records!.map((p) => [p.type, p.weight_kg, p.reps, p.duration_seconds ?? null]).sort()).toEqual([
    ['longest_hold', 0, 1, 90],
    ['most_reps_at_weight', 0, 12, null],
  ])

  // Progress: Dead Hang charts the longest hold, Pull-Up the most reps; neither has a weight chart.
  await page.goto(`/progress?exercise=${DEAD_HANG}`)
  await expect(page.getByRole('heading', { name: 'Longest hold' }).first()).toBeVisible()
  await expect(page.getByRole('radiogroup', { name: 'Metric' })).toHaveCount(0)
  await page.getByText('Show as table').click()
  await expect(page.getByRole('table')).toContainText('1:15')
  await expect(page.getByRole('button', { name: /1:30/ })).toBeVisible() // PR list entry

  await page.getByRole('button', { name: /Exercise Dead Hang/ }).click()
  await page.getByRole('dialog').getByLabel('Search exercises').fill('pull-up')
  await page.getByRole('dialog').getByRole('button', { name: 'Pull-Up Bodyweight', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Most reps in a set' })).toBeVisible()
  const table = page.getByRole('table')
  if (!(await table.isVisible())) await page.getByText('Show as table').click() // it may still be open from the other chart
  await expect(table).toContainText('12 reps')
})
