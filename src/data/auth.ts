import type { Session } from '@supabase/supabase-js'
import { queryClient } from '@/lib/queryClient'
import { useActiveWorkout } from '@/stores/activeWorkout'
import { useSession } from '@/stores/session'
import { db, wipeLocalData, type Profile } from './db'
import { getSupabase, storedSessionUser, supabaseConfigured } from './supabase'
import { startSync, stopSync, syncNow } from './sync/engine'

let currentUserId: string | null = null
let queue: Promise<unknown> = Promise.resolve()

const errorMessage = (e: unknown) => (e instanceof Error ? e.message : 'Something went wrong')

async function wipe() {
  await stopSync()
  await wipeLocalData()
  queryClient.clear()
  useActiveWorkout.setState({ workout: undefined })
}

/** Makes sure the signed-in user's profile is on the device (needs a connection only the first time). */
export async function loadProfile(userId: string, email: string) {
  useSession.setState({ status: 'loading' }, true)
  try {
    if (!(await db.profiles.get(userId))) {
      await wipe() // anything left on the device belongs to someone else
      const { data, error } = await (await getSupabase()).from('profiles').select('*').eq('id', userId).single()
      if (error) throw error
      await db.profiles.put(data as Profile)
    }
    await useActiveWorkout.getState().load(userId)
    useSession.setState({ status: 'ready', userId, email }, true)
    startSync()
  } catch (e) {
    useSession.setState({ status: 'error', userId, email, message: errorMessage(e) }, true)
  }
}

async function handleSession(session: Session | null) {
  const user = session?.user
  if (!user) {
    if (currentUserId) await wipe()
    currentUserId = null
    useSession.setState({ status: 'signedOut' }, true)
    return
  }
  if (user.id === currentUserId && useSession.getState().status === 'ready') return
  if (currentUserId && user.id !== currentUserId) await wipe()
  currentUserId = user.id
  await loadProfile(user.id, user.email ?? '')
}

/**
 * Local-first start (load target < 2 s, and instant offline launches): decide from the device
 * whether to show sign-in or Home, then let Supabase confirm once its code has loaded.
 */
async function bootstrapFromDevice(): Promise<boolean> {
  // An email link (sign-up confirmation, password recovery) carries its session in the URL:
  // let Supabase read it now, before any redirect drops it.
  if (/[#&?](access_token|code|error_code)=/.test(window.location.hash + window.location.search)) return false
  const user = storedSessionUser()
  if (!user) {
    useSession.setState({ status: 'signedOut' }, true)
    return true
  }
  if (!(await db.profiles.get(user.id))) return false // new device: Supabase must fetch the profile now
  currentUserId = user.id
  await useActiveWorkout.getState().load(user.id)
  useSession.setState({ status: 'ready', userId: user.id, email: user.email }, true)
  startSync()
  return true
}

/** After the first screen has painted and the page is idle, so Supabase's code doesn't compete with it. */
const whenIdle = (fn: () => void) => {
  const go = () => ('requestIdleCallback' in window ? requestIdleCallback(fn, { timeout: 2000 }) : setTimeout(fn, 300))
  if (document.readyState === 'complete') go()
  else window.addEventListener('load', go, { once: true })
}

export function initAuth() {
  if (!supabaseConfigured) {
    useSession.setState({ status: 'unconfigured' }, true)
    return
  }
  const run = (fn: () => Promise<unknown>) => {
    queue = queue.then(fn).catch((e) => console.error('session handling failed', e))
  }
  const listen = () =>
    void getSupabase().then((sb) =>
      sb.auth.onAuthStateChange((_event, session) => {
        // Supabase warns against awaiting its own calls inside this callback, so defer and serialise.
        setTimeout(() => run(() => handleSession(session)), 0)
      }),
    )
  run(async () => ((await bootstrapFromDevice()) ? whenIdle(listen) : listen()))
}

/** Returns true when the project requires email confirmation before the first sign-in. */
export async function signUp(email: string, password: string) {
  const { data, error } = await (await getSupabase()).auth.signUp({
    email,
    password,
    options: { emailRedirectTo: window.location.origin },
  })
  if (error) throw error
  return !data.session
}

export async function signIn(email: string, password: string) {
  const { error } = await (await getSupabase()).auth.signInWithPassword({ email, password })
  if (error) throw error
}

/** Path the recovery email links to; add `<site>/reset-password` to Supabase's Redirect URLs. */
export const RESET_PATH = '/reset-password'

/** Sends a recovery link. Supabase answers the same whether or not the email has an account. */
export async function requestPasswordReset(email: string) {
  const { error } = await (await getSupabase()).auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}${RESET_PATH}`,
  })
  if (error) throw error
}

/**
 * Waits for the session that a recovery link carries (supabase-js reads it from the URL on load).
 * Resolves false when the link is invalid or expired.
 */
export async function recoverySession(): Promise<boolean> {
  const sb = await getSupabase()
  const { data } = await sb.auth.getSession()
  return !!data.session
}

/** Sets a new password for the signed-in (or recovering) user. */
export async function setNewPassword(password: string) {
  const { error } = await (await getSupabase()).auth.updateUser({ password })
  if (error) throw error
}

/**
 * Change password from Profile: the current password is checked first, so an unlocked phone
 * left at the gym isn't enough to take over the account.
 */
export async function changePassword(email: string, current: string, next: string) {
  const sb = await getSupabase()
  const { error: reauth } = await sb.auth.signInWithPassword({ email, password: current })
  if (reauth) throw Object.assign(new Error('Current password is wrong'), { code: 'wrong_current_password' })
  const { error } = await sb.auth.updateUser({ password: next })
  if (error) throw error
}

/** Flushes the outbox first; returns how many changes are still unsynced. */
export async function flushBeforeSignOut() {
  await syncNow()
  return db.outbox.count()
}

/** The session listener wipes local data once Supabase confirms the sign-out. */
export async function signOut() {
  const { error } = await (await getSupabase()).auth.signOut({ scope: 'local' })
  if (error) throw error
}

export async function deleteAccount() {
  const sb = await getSupabase()
  const { error } = await sb.functions.invoke('delete-account', { method: 'POST' })
  if (error) throw error
  await sb.auth.signOut({ scope: 'local' })
}
