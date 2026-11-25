import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { db, wipeLocalData } from '../db'
import { addProtein, setProteinGoal } from '../repos/nutrition'
import { addWorkoutPhoto, deleteWorkoutPhoto, PhotoCapError } from '../repos/photos'
import { addWeight } from '../repos/vitals'
import { deleteWorkout } from '../repos/workouts'
import { server } from './fakeServer.testkit'
import { pushOutbox } from './push'

vi.mock('../supabase', async () => (await import('./fakeServer.testkit')).supabaseModule)

const USER = '33333333-3333-4333-8333-333333333333'
const DAY = '2026-11-24'
const workout = { id: 'w-1', user_id: USER, local_date: DAY }
const image = () => new Blob(['x'], { type: 'image/webp' })
const queue = async () => (await db.outbox.orderBy('seq').toArray()).map((e) => `${e.op} ${e.table}`)
const eventTypes = async () => (await db.outbox.toArray()).flatMap((e) => (e.op === 'insert' ? [e.payload.type] : []))

beforeEach(async () => {
  await wipeLocalData()
  server.reset()
})

describe('workout photos', () => {
  it('queues the upload before the row, then a photo_added event', async () => {
    await addWorkoutPhoto(workout, image())
    expect(await queue()).toEqual(['upload storage', 'upsert workout_photos', 'insert events'])
    const photo = (await db.workout_photos.toArray())[0]!
    expect(photo.storage_path).toMatch(new RegExp(`^${USER}/workouts/w-1/.+\\.webp$`))
    expect(await db.pendingUploads.get(photo.storage_path)).toBeDefined()
  })

  it('allows 3 per local day across workouts and refuses a 4th', async () => {
    await addWorkoutPhoto(workout, image())
    await addWorkoutPhoto(workout, image())
    await addWorkoutPhoto({ ...workout, id: 'w-2' }, image())
    await expect(addWorkoutPhoto(workout, image())).rejects.toBeInstanceOf(PhotoCapError)
    await addWorkoutPhoto({ ...workout, local_date: '2026-11-25' }, image()) // a new day starts fresh
    expect(await db.workout_photos.count()).toBe(4)
  })

  it('deletes the row and the file', async () => {
    await addWorkoutPhoto(workout, image())
    await db.outbox.clear()
    const photo = (await db.workout_photos.toArray())[0]!
    await deleteWorkoutPhoto(photo)
    expect(await db.workout_photos.count()).toBe(0)
    expect(await db.pendingUploads.count()).toBe(0)
    expect(await queue()).toEqual(['delete workout_photos', 'remove storage'])
  })

  it('removes photo files when their workout is deleted', async () => {
    await db.workouts.put({ ...workout, split_day_id: null, title: '', started_at: '', ended_at: '', duration_seconds: 0, notes: null, created_at: '', updated_at: '' })
    await addWorkoutPhoto(workout, image())
    await db.outbox.clear()
    await deleteWorkout('w-1')
    expect(await queue()).toEqual(['remove storage', 'delete workouts'])
  })

  it('drops a photo the server refuses because another device filled the day', async () => {
    await addWorkoutPhoto(workout, image())
    const photo = (await db.workout_photos.toArray())[0]!
    server.failOn = `upsert workout_photos ${photo.id}`
    server.failMessage = 'photo_cap_reached' // what the DB trigger raises

    expect(await pushOutbox()).toBe(true)
    expect(await db.workout_photos.count()).toBe(0)
    expect(await db.outbox.count()).toBe(1) // the file removal, sent on the next push
    server.failOn = null
    await pushOutbox()
    expect(server.calls.at(-1)).toBe(`remove ${photo.storage_path}`)
  })
})

describe('protein', () => {
  it('keeps one goal row per day: a second change the same day replaces it', async () => {
    await setProteinGoal(USER, 1.6, 'maintain', DAY)
    await setProteinGoal(USER, 2.0, 'cut', DAY)
    await setProteinGoal(USER, 1.8, 'bulk', '2026-11-25')
    const goals = (await db.nutrition_goals.toArray()).sort((a, b) => a.effective_from.localeCompare(b.effective_from))
    expect(goals.map((g) => [g.effective_from, g.multiplier, g.goal_type])).toEqual([
      [DAY, 2.0, 'cut'],
      ['2026-11-25', 1.8, 'bulk'],
    ])
    expect(goals.every((g) => g.basis === 'per_kg_bodyweight' && g.target === null)).toBe(true)
  })

  it('emits protein_goal_met once, on the entry that reaches the goal', async () => {
    await addWeight(USER, 80, DAY, new Date(2026, 10, 24, 8))
    await setProteinGoal(USER, 1.6, 'maintain', DAY) // 128 g
    await db.outbox.clear()

    await addProtein(USER, 100, 'Chicken', DAY)
    expect(await eventTypes()).toEqual([])
    await addProtein(USER, 30, 'Whey shake', DAY)
    expect(await eventTypes()).toEqual(['protein_goal_met'])
    await addProtein(USER, 20, null, DAY)
    expect(await eventTypes()).toEqual(['protein_goal_met'])

    const entries = await db.nutrition_entries.toArray()
    expect(entries.map((e) => e.label).sort()).toEqual(['Chicken', 'Whey shake', null].sort())
  })
})
