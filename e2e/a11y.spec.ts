import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { fakeSupabase } from './support/fakeSupabase'
import { signUpAndOnboard } from './support/onboard'

/** Screens to audit once an account has a split, a finished workout and a running one. */
const SCREENS = ['/', '/workout', '/workout/live', '/split', '/split/library', '/progress', '/progress?tab=body', '/nutrition', '/profile']

async function seed(page: Page) {
  await fakeSupabase(page)
  await signUpAndOnboard(page)
  await page.goto('/profile') // audit with the busiest background pattern on
  await page.getByRole('radio', { name: 'Mixed' }).click()
  await page.goto('/split')
  await page.getByRole('button', { name: 'New split' }).first().click()
  await page.getByRole('button', { name: /Push \/ Pull \/ Legs/ }).click()
  await expect(page.getByText("Active split: today's workout comes from here")).toBeVisible()
  await page.goto('/workout')
  await page.getByRole('button', { name: /Pick another day|Train a split day anyway/ }).click()
  await page.getByRole('button', { name: /^Push/ }).first().click()
  await page.getByLabel('Weight (kg)').first().fill('60')
  await page.getByRole('button', { name: 'Log set' }).first().click()
}

async function settle(page: Page, path: string) {
  await page.goto(path)
  await expect(page.locator('main [aria-busy=true]')).toHaveCount(0) // skeletons gone
  await page.waitForTimeout(500) // springs and the route transition finish
}

async function axe(page: Page, label: string) {
  const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze()
  const summary = violations.map((v) => `${label} · ${v.id}: ${v.nodes.map((n) => `${n.target.join(' ')} [${n.any.map((a) => JSON.stringify(a.data)).join(' ')}]`).slice(0, 3).join(' | ')}`)
  expect(summary).toEqual([])
}

test('sign-in and onboarding screens pass axe in light and dark', async ({ page }) => {
  await fakeSupabase(page)
  for (const scheme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme: scheme })
    await settle(page, '/auth')
    await axe(page, `${scheme} /auth`)
  }
  await page.emulateMedia({ colorScheme: 'light' })
  await page.getByLabel('Email').fill('sam@example.com')
  await page.getByLabel('Password', { exact: true }).fill('correct-horse')
  await page.getByRole('button', { name: 'Create account' }).last().click()
  await expect(page.getByRole('heading', { name: 'About you' })).toBeVisible()
  await page.waitForTimeout(600) // let the step's fade finish, or axe samples blended colors
  await axe(page, 'onboarding profile')
  await page.getByLabel('Name').fill('Sam')
  await page.getByRole('button', { name: 'Continue' }).click()
  await expect(page.getByRole('heading', { name: 'Your body' })).toBeVisible()
  await page.waitForTimeout(600)
  await axe(page, 'onboarding body')
})

test('every app screen passes axe (WCAG 2.2 AA) in light and dark', async ({ page }) => {
  test.slow()
  await seed(page)
  for (const scheme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme: scheme })
    for (const path of SCREENS) {
      await settle(page, path)
      await axe(page, `${scheme} ${path}`)
    }
  }
})

test('tap targets are at least 44 × 44 px on a phone', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'phone layout only')
  test.slow()
  await page.setViewportSize({ width: 360, height: 780 })
  await seed(page)
  for (const path of SCREENS) {
    await settle(page, path)
    const small = await page.evaluate(() => {
      const sel = 'a[href], button, input:not([type=hidden]):not([hidden]), select, textarea, summary, [role=radio], [role=switch], [role=tab]'
      return [...document.querySelectorAll<HTMLElement>(sel)].flatMap((el) => {
        const r = el.getBoundingClientRect()
        if (!r.width || !r.height || getComputedStyle(el).visibility === 'hidden') return []
        if (el.closest('[aria-hidden=true], [inert]')) return []
        if (el.tagName === 'A' && getComputedStyle(el).display === 'inline') return [] // inline text link: exempt (WCAG 2.5.8)
        if (el.dataset.tapExempt !== undefined) return []
        // An ::after overlay (absolute, negative inset) extends the hit area beyond the visual box.
        const after = getComputedStyle(el, '::after')
        const extraY = after.content !== 'none' && after.position === 'absolute' ? -2 * Math.min(0, parseFloat(after.top) || 0) : 0
        const extraX = after.content !== 'none' && after.position === 'absolute' ? -2 * Math.min(0, parseFloat(after.left) || 0) : 0
        const h = r.height + extraY
        const w = r.width + extraX
        return h + 0.5 < 44 || w + 0.5 < 44 ? [`${el.tagName.toLowerCase()} "${(el.getAttribute('aria-label') ?? el.textContent ?? '').trim().slice(0, 30)}" ${Math.round(w)}×${Math.round(h)}`] : []
      })
    })
    expect(small, path).toEqual([])
  }
})

test('content reflows without sideways scrolling at 320 px and at 125% text size', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'phone layout only')
  test.slow()
  await seed(page)
  for (const [width, fontSize] of [[320, '100%'], [360, '125%']] as const) {
    await page.setViewportSize({ width, height: 700 })
    for (const path of SCREENS) {
      await settle(page, path)
      await page.evaluate((size) => (document.documentElement.style.fontSize = size), fontSize)
      await page.waitForTimeout(100)
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
      expect(overflow, `${path} at ${width}px, text ${fontSize}`).toBeLessThanOrEqual(0)
    }
  }
})
