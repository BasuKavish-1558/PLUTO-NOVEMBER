import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { db, wipeLocalData } from '../db'
import { addWeight } from '../repos/vitals'
import { server } from './fakeServer.testkit'
import { isPermanent } from './failures'
import { pullAll } from './pull'
import { pushOutbox } from './push'

vi.mock('../supabase', async () => (await import('./fakeServer.testkit')).supabaseModule)

const USER = '55555555-5555-4555-8555-555555555555'

beforeEach(async () => {
  await wipeLocalData()
  server.reset()
})

describe('classifying push errors', () => {
  it('sets aside only what can never succeed', () => {
    const row = { table: 'body_vitals' as const }
    expect(isPermanent(row, { message: 'new row violates check constraint', code: '23514' })).toBe(true)
    expect(isPermanent(row, { message: 'violates row-level security policy', code: '42501' })).toBe(true)
    expect(isPermanent(row, { message: 'invalid input syntax', code: '22P02' })).toBe(true)
    expect(isPermanent(row, { message: 'TypeError: Failed to fetch' })).toBe(false)
    expect(isPermanent(row, { message: 'JWT expired', code: 'PGRST301' })).toBe(false)
    expect(isPermanent(row, { message: 'relation does not exist', code: '42P01' })).toBe(false) // migrations not pushed yet
    expect(isPermanent({ table: 'storage' }, { message: 'Payload too large', status: 413 })).toBe(true)
    expect(isPermanent({ table: 'storage' }, { message: 'Too many requests', status: 429 })).toBe(false)
  })
})

describe('a change the server rejects', () => {
  it('is set aside with its reason, the row is restored from the server, and the queue keeps going', async () => {
    const bad = await addWeight(USER, 80, '2026-11-24')
    const good = await addWeight(USER, 81, '2026-11-25')
    server.failOn = `upsert body_vitals ${bad.id}`
    server.failMessage = 'new row violates check constraint "body_vitals_weight_kg_check"'
    server.failCode = '23514'

    expect(await pushOutbox()).toBe(true)
    expect(server.calls).toContain(`upsert body_vitals ${good.id}`) // not blocked
    expect(await db.outbox.count()).toBe(0)
    expect(await db.syncFailures.toArray()).toMatchObject([{ table: 'body_vitals', op: 'upsert', rowId: bad.id, code: '23514' }])
    expect(await db.body_vitals.get(bad.id)).toBeUndefined() // server never had it, so it's gone locally too
    expect(await db.body_vitals.get(good.id)).toBeDefined()
  })

  it('keeps transient failures queued, in order', async () => {
    const row = await addWeight(USER, 80, '2026-11-24')
    server.failOn = `upsert body_vitals ${row.id}` // plain "boom": no code, so retried
    expect(await pushOutbox()).toBe(false)
    expect(await db.outbox.count()).toBe(1)
    expect(await db.syncFailures.count()).toBe(0)
  })
})

describe('full re-sync after a long time offline', () => {
  it('starts over when the last pull is older than tombstone retention, keeping unsent changes', async () => {
    const stale = await addWeight(USER, 90, '2026-01-01')
    const unsent = await addWeight(USER, 91, '2026-01-02')
    for (const e of await db.outbox.toArray()) if (e.rowId === stale.id) await db.outbox.delete(e.seq!) // `stale` was synced long ago
    await db.meta.put({ key: 'cursor:body_vitals', value: '2026-01-01T00:00:00Z' })
    await db.meta.put({ key: 'lastPullAt', value: '2026-01-05T00:00:00.000Z' })
    server.rows.body_vitals = [{ id: 'server-row', user_id: USER, measured_at: '2026-06-01T08:00:00Z', local_date: '2026-06-01', weight_kg: 85, updated_at: '2026-06-01T08:00:00Z' }]

    await pullAll(Date.parse('2026-06-01T12:00:00Z'))

    expect(await db.body_vitals.get(stale.id)).toBeUndefined() // possibly deleted elsewhere: dropped
    expect(await db.body_vitals.get(unsent.id)).toBeDefined() // still waiting to be pushed: kept
    expect(await db.body_vitals.get('server-row')).toBeDefined()
    expect((await db.meta.get('lastPullAt'))?.value).toBe('2026-06-01T12:00:00.000Z')
  })

  it('does not reset after a normal gap', async () => {
    const local = await addWeight(USER, 90, '2026-05-30')
    await db.outbox.clear()
    await db.meta.put({ key: 'lastPullAt', value: '2026-05-31T00:00:00.000Z' })
    await pullAll(Date.parse('2026-06-01T12:00:00Z'))
    expect(await db.body_vitals.get(local.id)).toBeDefined()
  })
})
