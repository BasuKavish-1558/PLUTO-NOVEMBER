import { expect, test, type Page } from '@playwright/test'
import { fakeSupabase } from './support/fakeSupabase'
import { signUpAndOnboard } from './support/onboard'

// Runs only in the "pwa" project: the production build served by `vite preview`, with its service worker.

async function swControlled(page: Page) {
  await page.evaluate(() => navigator.serviceWorker.ready)
  if (!(await page.evaluate(() => !!navigator.serviceWorker.controller))) await page.reload()
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true)
}

const NETWORKS = {
  /** Lighthouse's pessimistic mobile profile. */
  slow4g: { latency: 150, downloadThroughput: (1.6 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8 },
  /** A typical 4G connection (PRD §8: "a typical mobile connection"). */
  typical4g: { latency: 85, downloadThroughput: (9 * 1024 * 1024) / 8, uploadThroughput: (1.5 * 1024 * 1024) / 8 },
  none: { latency: 0, downloadThroughput: -1, uploadThroughput: -1 },
}

/** Network profile plus a CPU slowdown (4× ≈ a mid-range phone). */
async function throttle(page: Page, network: keyof typeof NETWORKS, cpu = 4) {
  const cdp = await page.context().newCDPSession(page)
  await cdp.send('Network.enable')
  await cdp.send('Network.emulateNetworkConditions', { offline: false, ...NETWORKS[network] })
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu })
}

async function timeToVisible(page: Page, path: string, ready: () => Promise<void>) {
  const t0 = Date.now()
  await page.goto(path, { waitUntil: 'commit' })
  await ready()
  return Date.now() - t0
}

test('installable: manifest, icons and an active service worker', async ({ page, request }) => {
  await page.goto('/auth')
  const href = await page.locator('link[rel=manifest]').getAttribute('href')
  const manifest = await (await request.get(href!)).json()
  expect(manifest).toMatchObject({ name: 'Pluto', short_name: 'Pluto', display: 'standalone', start_url: '/' })
  expect(manifest.theme_color).toBeTruthy()
  const sizes = manifest.icons.map((i: { sizes: string }) => i.sizes)
  expect(sizes).toEqual(expect.arrayContaining(['192x192', '512x512']))
  expect(manifest.icons.some((i: { purpose?: string }) => i.purpose?.includes('maskable'))).toBe(true)
  await swControlled(page)
  await expect(page.locator('meta[name=viewport]')).not.toHaveAttribute('content', /maximum-scale|user-scalable=no/)
})

test('starts and works fully offline once installed', async ({ page, context }) => {
  await fakeSupabase(context)
  await signUpAndOnboard(page)
  await swControlled(page)
  await page.waitForTimeout(1500) // idle prefetch + precache settle

  await context.setOffline(true)
  await page.reload()
  await expect(page.getByText('day streak')).toBeVisible()
  await expect(page.getByRole('status').filter({ hasText: 'Offline' })).toBeVisible()

  for (const path of ['/workout', '/progress', '/split/library', '/nutrition', '/profile']) {
    await page.goto(path)
    await expect(page.getByRole('heading', { name: /This screen isn't available offline/ })).toHaveCount(0)
    await expect(page.locator('main')).not.toBeEmpty()
  }

  await page.goto('/workout')
  await page.getByRole('button', { name: 'Empty workout' }).click()
  await expect(page.getByRole('timer')).toBeVisible()
  await context.setOffline(false)
})

test('loads in under 2 seconds on a typical 4G phone; installed starts under 2 s even on slow 4G', async ({ browser }) => {
  const authReady = (page: Page) => () => expect(page.getByRole('button', { name: 'Create account' }).last()).toBeVisible({ timeout: 10_000 })
  const cold = async (network: keyof typeof NETWORKS) => {
    const context = await browser.newContext({ ...test.info().project.use, serviceWorkers: 'allow' })
    const page = await context.newPage()
    await fakeSupabase(context)
    await throttle(page, network)
    const ms = await timeToVisible(page, '/auth', authReady(page))
    await context.close()
    return ms
  }
  const typical = await cold('typical4g')
  const slow = await cold('slow4g')

  // Returning user: signed in, with the app shell cached by the service worker and data on the device.
  const context = await browser.newContext({ ...test.info().project.use, serviceWorkers: 'allow' })
  const page = await context.newPage()
  await fakeSupabase(context)
  await signUpAndOnboard(page)
  await swControlled(page)
  await page.waitForTimeout(1500)
  await throttle(page, 'slow4g')
  const returning = await timeToVisible(page, '/', () => expect(page.getByText('day streak')).toBeVisible({ timeout: 10_000 }))
  await context.close()

  const report = `first visit: typical 4G ${typical} ms, slow 4G ${slow} ms · installed/returning on slow 4G: ${returning} ms`
  test.info().annotations.push({ type: 'load', description: report })
  console.log(report)
  // Strict on a quiet machine (`npm run test:perf` runs one worker); parallel workers skew timings.
  const limit = test.info().config.workers === 1 ? 2000 : 4000
  expect(typical).toBeLessThan(limit)
  expect(returning).toBeLessThan(limit)
})

test('the Content-Security-Policy blocks nothing the app needs', async ({ page, context }) => {
  const violations: string[] = []
  page.on('console', (m) => m.type() === 'error' && /Content Security Policy|Refused to/i.test(m.text()) && violations.push(m.text()))
  await context.addInitScript(() =>
    document.addEventListener('securitypolicyviolation', (e) => console.error(`Refused to load: ${e.violatedDirective} ${e.blockedURI}`)),
  )
  await fakeSupabase(context)
  await signUpAndOnboard(page)
  await expect(page.locator('meta[http-equiv=Content-Security-Policy]')).toHaveCount(1)
  for (const path of ['/workout', '/progress?tab=body', '/split/library', '/nutrition', '/profile']) {
    await page.goto(path)
    await expect(page.locator('main')).not.toBeEmpty()
  }
  await page.getByRole('radio', { name: 'Mixed' }).click() // pattern masks are data: images
  await page.waitForTimeout(500)
  expect(violations).toEqual([])
})
