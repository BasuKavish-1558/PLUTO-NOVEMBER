import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { toggleLogged } from '@/domain/workoutSession'
import { db, wipeLocalData } from '../db'
import { createPr, deletePr, updatePr } from '../repos/prs'
import { deleteWorkout, finishWorkout, startWorkout } from '../repos/workouts'
import { server } from './fakeServer.testkit'

vi.mock('../supabase', async () => (await import('./fakeServer.testkit')).supabaseModule)

const USER = '44444444-4444-4444-8444-444444444444'
const input = { exercise_id: 'bench', type: 'heaviest_weight' as const, weight_kg: 100, reps: 1, note: '  felt easy ' }
const queue = async () => (await db.outbox.orderBy('seq').toArray()).map((e) => `${e.op} ${e.table}`)

beforeEach(async () => {
  await wipeLocalData()
  server.reset()
})

describe('personal records', () => {
  it('saves with the device time and date, then queues photo, row and pr_logged', async () => {
    const now = new Date(2026, 10, 24, 18, 30)
    const id = await createPr(USER, input, new Blob(['x'], { type: 'image/webp' }), now)
    const pr = (await db.personal_records.get(id))!
    expect(pr).toMatchObject({ local_date: '2026-11-24', created_at: now.toISOString(), note: 'felt easy', workout_id: null })
    expect(pr.photo_path).toBe(`${USER}/prs/${id}.webp`)
    expect(await queue()).toEqual(['upload storage', 'upsert personal_records', 'insert events'])
    const payload = (await db.outbox.toArray()).find((e) => e.table === 'personal_records')
    expect(payload && 'payload' in payload && payload.payload.created_at).toBe(now.toISOString())
  })

  it('links a PR logged mid-workout when the workout is finished, and keeps it if the workout is deleted', async () => {
    let w = await startWorkout({ userId: USER, title: 'Push', splitDayId: null, items: [{ exerciseId: 'bench', targets: { sets: 1, repsMin: 5 } }] })
    const prId = await createPr(USER, input, null)
    w = { ...w, prIds: [prId] }
    w = toggleLogged(w, w.exercises[0]!.id, w.exercises[0]!.sets[0]!.id, new Date().toISOString())
    const { workoutId } = await finishWorkout(w)

    expect((await db.personal_records.get(prId))?.workout_id).toBe(workoutId)
    const order = await queue()
    expect(order.indexOf('upsert workouts')).toBeLessThan(order.indexOf('update personal_records'))

    await deleteWorkout(workoutId)
    expect((await db.personal_records.get(prId))?.workout_id).toBeNull()
  })

  it('edits keep the logged date; replacing the photo removes the old file; delete removes both', async () => {
    const id = await createPr(USER, input, new Blob(['a'], { type: 'image/webp' }))
    const before = (await db.personal_records.get(id))!
    await db.outbox.clear()

    await updatePr(before, { type: 'heaviest_weight', weight_kg: 102.5, reps: 1, note: null }, new Blob(['b'], { type: 'image/webp' }))
    const after = (await db.personal_records.get(id))!
    expect(after.weight_kg).toBe(102.5)
    expect(after.created_at).toBe(before.created_at)
    expect(after.photo_path).not.toBe(before.photo_path)
    expect(await queue()).toEqual(['upload storage', 'remove storage', 'update personal_records'])

    await db.outbox.clear()
    await deletePr(after)
    expect(await db.personal_records.count()).toBe(0)
    expect(await queue()).toEqual(['delete personal_records', 'remove storage'])
  })
})
