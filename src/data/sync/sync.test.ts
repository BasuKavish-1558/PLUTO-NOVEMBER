import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { db, wipeLocalData, type Profile } from '../db'
import { setAvatar, updateProfile } from '../repos/profile'
import { addWeight, deleteWeight } from '../repos/vitals'
import { pullAll } from './pull'
import { server } from './fakeServer.testkit'
import { pushOutbox } from './push'

vi.mock('../supabase', async () => (await import('./fakeServer.testkit')).supabaseModule)

const USER = '11111111-1111-4111-8111-111111111111'
const profile: Profile = {
  id: USER,
  name: 'Sam',
  avatar_path: null,
  age: 30,
  height_cm: 180,
  weight_unit: 'kg',
  length_unit: 'cm',
  theme_pref: 'system',
  show_bmi: false,
  active_split_id: null,
  onboarded_at: null,
  created_at: '2026-11-01T00:00:00.000Z',
  updated_at: '2026-11-01T00:00:00.000Z',
}

beforeEach(async () => {
  await wipeLocalData()
  await db.profiles.put(profile)
  server.reset()
})

describe('repos', () => {
  it('writes a weight entry locally and queues it', async () => {
    const row = await addWeight(USER, 80.5, '2026-11-20', new Date(2026, 10, 24, 9))
    expect(await db.body_vitals.get(row.id)).toMatchObject({ weight_kg: 80.5, local_date: '2026-11-20' })
    expect(await db.outbox.toArray()).toMatchObject([{ op: 'upsert', table: 'body_vitals', rowId: row.id }])
  })

  it('places a back-dated entry at local noon and today at the current time', async () => {
    const now = new Date(2026, 10, 24, 7, 30)
    const old = await addWeight(USER, 80, '2026-11-20', now)
    const today = await addWeight(USER, 80, '2026-11-24', now)
    expect(new Date(old.measured_at).getHours()).toBe(12)
    expect(today.measured_at).toBe(now.toISOString())
  })

  it('replacing an avatar uploads the new file, points the profile at it and removes the old one', async () => {
    await setAvatar(profile, new Blob(['a'], { type: 'image/webp' }))
    const first = (await db.profiles.get(USER))!
    await setAvatar(first, new Blob(['b'], { type: 'image/webp' }))
    const second = (await db.profiles.get(USER))!

    expect(second.avatar_path).toMatch(new RegExp(`^${USER}/avatar/.+\\.webp$`))
    expect(await db.pendingUploads.get(first.avatar_path!)).toBeUndefined()
    const ops = (await db.outbox.orderBy('seq').toArray()).map((e) => e.op)
    expect(ops).toEqual(['upload', 'update', 'upload', 'update', 'remove'])
  })
})

describe('pushOutbox', () => {
  it('sends entries in order and empties the outbox', async () => {
    await updateProfile(USER, { name: 'Sam R' })
    const row = await addWeight(USER, 81, '2026-11-24')
    await deleteWeight(row.id)

    expect(await pushOutbox()).toBe(true)
    expect(server.calls).toEqual([`update profiles ${USER}`, `upsert body_vitals ${row.id}`, `delete body_vitals ${row.id}`])
    expect(await db.outbox.count()).toBe(0)
  })

  it('stops at the first failure and keeps the rest queued', async () => {
    await updateProfile(USER, { name: 'A' })
    const row = await addWeight(USER, 81, '2026-11-24')
    server.failOn = `update profiles ${USER}`

    expect(await pushOutbox()).toBe(false)
    expect(server.calls).toEqual([`update profiles ${USER}`])
    const left = await db.outbox.orderBy('seq').toArray()
    expect(left.map((e) => e.rowId)).toEqual([USER, row.id])
    expect(left[0]?.lastError).toBe('boom')
  })

  it('drops the local copy of an image once it is uploaded', async () => {
    await setAvatar(profile, new Blob(['a'], { type: 'image/webp' }))
    await pushOutbox()
    expect(await db.pendingUploads.count()).toBe(0)
  })
})

describe('pullAll', () => {
  it('does not overwrite rows that have unsent local changes', async () => {
    await updateProfile(USER, { name: 'Local edit' })
    server.rows.profiles = [{ ...profile, name: 'Server copy', updated_at: '2026-11-02T00:00:00.000Z' }]
    await pullAll()
    expect((await db.profiles.get(USER))?.name).toBe('Local edit')
  })

  it('applies server rows and deletes from tombstones', async () => {
    const row = await addWeight(USER, 82, '2026-11-24')
    await db.outbox.clear()
    server.rows.sync_tombstones = [{ id: 1, table_name: 'body_vitals', row_id: row.id }]
    server.rows.profiles = [{ ...profile, name: 'From phone', updated_at: '2026-11-03T00:00:00.000Z' }]
    await pullAll()

    expect(await db.body_vitals.get(row.id)).toBeUndefined()
    expect((await db.profiles.get(USER))?.name).toBe('From phone')
    expect((await db.meta.get('cursor:profiles'))?.value).toBe('2026-11-03T00:00:00.000Z')
  })
})
