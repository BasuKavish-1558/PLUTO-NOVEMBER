import type { BrowserContext, Page, Route } from '@playwright/test'

const API = 'http://127.0.0.1:54321'
const USER_ID = '7f0c6a9e-4c1b-4a43-9d5e-2f1f2a6b9c11'
const cors = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': '*',
  'access-control-allow-methods': '*',
  'access-control-expose-headers': '*',
}

const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url')
const jwt = (sub: string) =>
  `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ sub, role: 'authenticated', exp: Math.floor(Date.now() / 1000) + 3600 })}.sig`

/** In-memory stand-in for the Supabase endpoints the app calls. Tests can inspect `state`. */
/** The URL fragment a Supabase recovery email link redirects with (implicit flow). */
export const recoveryHash = (type: 'recovery' | 'signup' = 'recovery') =>
  `#access_token=${jwt(USER_ID)}&refresh_token=refresh&expires_in=3600&expires_at=${Math.floor(Date.now() / 1000) + 3600}&token_type=bearer&type=${type}`

/** Pass a BrowserContext (not a Page) when a service worker is active, so its requests are routed too. */
export async function fakeSupabase(page: Page | BrowserContext) {
  const now = new Date().toISOString()
  const state = {
    profile: {
      id: USER_ID, name: '', avatar_path: null, age: null, height_cm: null, weight_unit: 'kg', length_unit: 'cm',
      theme_pref: 'system', background: 'none', show_bmi: false, active_split_id: null, onboarded_at: null, created_at: now, updated_at: now,
    } as Record<string, unknown>,
    password: 'correct-horse',
    /** Emails a password-reset link was requested for, with the redirect the app asked for. */
    recoveries: [] as { email: string; redirectTo: string | null }[],
    /** Rows per synced table, keyed like the REST paths. */
    tables: {
      body_vitals: [],
      exercises: [],
      splits: [],
      split_days: [],
      split_day_exercises: [],
      workouts: [],
      workout_exercises: [],
      set_logs: [],
      events: [],
      workout_photos: [],
      nutrition_goals: [],
      nutrition_entries: [],
      personal_records: [],
    } as Record<string, Record<string, unknown>[]>,
  }

  const reply = (route: Route, status: number, body?: unknown) =>
    route.fulfill({
      status,
      headers: { ...cors, 'content-type': 'application/json' },
      body: body === undefined ? '' : JSON.stringify(body),
    })

  await page.route(`${API}/**`, async (route) => {
    const req = route.request()
    const url = new URL(req.url())
    const method = req.method()
    if (method === 'OPTIONS') return reply(route, 204)

    if (url.pathname === '/auth/v1/signup' || url.pathname === '/auth/v1/token') {
      const { email = 'sam@example.com', password } = req.postDataJSON() as { email?: string; password?: string }
      const refreshing = url.searchParams.get('grant_type') === 'refresh_token'
      if (url.pathname === '/auth/v1/token' && !refreshing && password !== state.password) {
        return reply(route, 400, { error_code: 'invalid_credentials', msg: 'Invalid login credentials' })
      }
      const user = { id: USER_ID, aud: 'authenticated', role: 'authenticated', email, app_metadata: {}, user_metadata: {}, created_at: now }
      return reply(route, 200, { access_token: jwt(USER_ID), refresh_token: 'refresh', expires_in: 3600, token_type: 'bearer', user })
    }
    if (url.pathname === '/auth/v1/logout') return reply(route, 204)
    if (url.pathname === '/auth/v1/recover') {
      const { email } = req.postDataJSON() as { email: string }
      state.recoveries.push({ email, redirectTo: url.searchParams.get('redirect_to') })
      return reply(route, 200, {})
    }
    if (url.pathname === '/auth/v1/user') {
      if (method === 'PUT') {
        const body = req.postDataJSON() as { password?: string }
        if (body.password === state.password) return reply(route, 422, { error_code: 'same_password', msg: 'New password should be different' })
        if (body.password) state.password = body.password
      }
      return reply(route, 200, { id: USER_ID, aud: 'authenticated', role: 'authenticated', email: 'sam@example.com', app_metadata: {}, user_metadata: {}, created_at: now })
    }

    if (url.pathname === '/rest/v1/profiles') {
      if (method === 'PATCH') {
        Object.assign(state.profile, req.postDataJSON(), { updated_at: new Date().toISOString() })
        return reply(route, 204)
      }
      const single = req.headers()['accept']?.includes('vnd.pgrst.object')
      return reply(route, 200, single ? state.profile : [state.profile])
    }
    const table = url.pathname.replace('/rest/v1/', '')
    const rows = state.tables[table]
    if (rows) {
      const id = url.searchParams.get('id')?.replace(/^eq\./, '')
      const stamp = () => new Date().toISOString()
      if (method === 'POST') {
        for (const r of [req.postDataJSON()].flat() as Record<string, unknown>[]) {
          const old = state.tables[table]!.find((v) => v.id === r.id)
          state.tables[table] = [...state.tables[table]!.filter((v) => v.id !== r.id), { created_at: old?.created_at ?? stamp(), ...r, updated_at: stamp() }]
        }
        return reply(route, 201)
      }
      if (method === 'PATCH') {
        state.tables[table] = rows.map((r) => (r.id === id ? { ...r, ...req.postDataJSON(), updated_at: stamp() } : r))
        return reply(route, 204)
      }
      if (method === 'DELETE') {
        state.tables[table] = rows.filter((r) => r.id !== id)
        return reply(route, 204)
      }
      return reply(route, 200, rows)
    }
    if (url.pathname.startsWith('/rest/v1/')) return reply(route, 200, [])
    if (url.pathname.startsWith('/storage/v1/object/sign/')) return reply(route, 200, { signedURL: `/object/sign/fake?token=t` })
    if (url.pathname.startsWith('/storage/v1/')) return reply(route, 200, { Key: 'ok' })
    return reply(route, 404, { message: `fake supabase: no handler for ${method} ${url.pathname}` })
  })

  return Object.assign(state, { events: () => state.tables.events!.map((e) => e.type as string) })
}
