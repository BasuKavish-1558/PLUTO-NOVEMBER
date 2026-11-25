import type { SupabaseClient } from '@supabase/supabase-js'
// zod/mini keeps this startup check tiny; forms use full Zod in their own lazy chunks.
import * as z from 'zod/mini'

const env = z
  .object({
    VITE_SUPABASE_URL: z.url(),
    VITE_SUPABASE_ANON_KEY: z.string().check(z.minLength(1)),
  })
  .safeParse(import.meta.env)

/** False until .env is filled in; the auth screen then explains what's missing. */
export const supabaseConfigured = env.success

let client: Promise<SupabaseClient> | null = null

/**
 * The client is loaded on demand (its own chunk) so the first screen can render from local data
 * before Supabase's code arrives. Only the sync engine, auth and media helpers may call this.
 */
export function getSupabase(): Promise<SupabaseClient> {
  if (!env.success) return Promise.reject(new Error('Supabase is not configured: set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env'))
  const { VITE_SUPABASE_URL: url, VITE_SUPABASE_ANON_KEY: key } = env.data
  client ??= import('@supabase/supabase-js').then(({ createClient }) =>
    createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true } }),
  )
  return client
}

/**
 * The user of the session Supabase persisted last time, read straight from localStorage
 * (supabase-js's default key) without loading the client. Null when signed out.
 */
export function storedSessionUser(): { id: string; email: string } | null {
  if (!env.success) return null
  try {
    const ref = new URL(env.data.VITE_SUPABASE_URL).hostname.split('.')[0]
    const raw = localStorage.getItem(`sb-${ref}-auth-token`)
    const user = raw ? (JSON.parse(raw) as { user?: { id?: string; email?: string } }).user : null
    return user?.id ? { id: user.id, email: user.email ?? '' } : null
  } catch {
    return null
  }
}
