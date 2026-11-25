import { pullAll } from './pull'
import { pushOutbox } from './push'

const INTERVAL_MS = 30_000

let active = false
let running: Promise<void> | null = null
let rerun = false
let debounce: ReturnType<typeof setTimeout> | undefined
let interval: ReturnType<typeof setInterval> | undefined

async function cycle() {
  do {
    rerun = false
    if (!navigator.onLine) return
    try {
      await pushOutbox()
      await pullAll()
    } catch (e) {
      console.warn('sync failed', e)
    }
  } while (rerun && active)
}

/** Single-flight: a request during a run schedules exactly one more run. */
export function syncNow(): Promise<void> {
  if (!active) return Promise.resolve()
  if (running) {
    rerun = true
    return running
  }
  running = cycle().finally(() => (running = null))
  return running
}

/** Called by repos after every local write. */
export function requestSync() {
  clearTimeout(debounce)
  debounce = setTimeout(() => void syncNow(), 300)
}

const onVisible = () => document.visibilityState === 'visible' && void syncNow()
const onOnline = () => void syncNow()

export function startSync() {
  if (active) return
  active = true
  window.addEventListener('online', onOnline)
  document.addEventListener('visibilitychange', onVisible)
  interval = setInterval(() => document.visibilityState === 'visible' && void syncNow(), INTERVAL_MS)
  void syncNow()
}

/** Resolves once any in-flight run has finished, so a wipe can't be refilled by a late pull. */
export async function stopSync() {
  active = false
  await running
  clearTimeout(debounce)
  clearInterval(interval)
  window.removeEventListener('online', onOnline)
  document.removeEventListener('visibilitychange', onVisible)
}
