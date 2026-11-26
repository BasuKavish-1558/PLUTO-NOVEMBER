import { toLocalDate } from '@/domain/dates'
import type { PrType } from '@/domain/personalRecords'
import { db, type PersonalRecord } from '../db'
import { extensionFor } from '../media'
import { commit } from './write'

/** A longest_hold record also has duration_seconds (and is one rep); the key is left out for other types. */
export type PrInput = { exercise_id: string; type: PrType; weight_kg: number; reps: number; duration_seconds?: number; note: string | null }

/** PR photos: 1 per PR, same private bucket, outside the 3-per-day cap (PLAN A7). */
async function queuePhoto(pr: Pick<PersonalRecord, 'id' | 'user_id' | 'photo_path'>, image: Blob | null) {
  const path = image ? `${pr.user_id}/prs/${pr.id}-${crypto.randomUUID().slice(0, 8)}.${extensionFor(image)}` : null
  if (image && path) {
    await db.pendingUploads.put({ path, blob: image, contentType: image.type })
    await db.outbox.add({ op: 'upload', table: 'storage', rowId: path })
  }
  if (pr.photo_path) {
    await db.pendingUploads.delete(pr.photo_path)
    await db.outbox.add({ op: 'remove', table: 'storage', rowId: pr.photo_path })
  }
  return path
}

/**
 * PR-1/PR-3: logged manually; the date and time come from the device clock, never typed.
 * Logged mid-workout, it is saved without workout_id (the workout isn't on the server yet)
 * and linked on Finish.
 */
export function createPr(userId: string, input: PrInput, photo: Blob | null, now = new Date()) {
  const id = crypto.randomUUID()
  return commit(async (w) => {
    const upload = photo ? { path: `${userId}/prs/${id}.${extensionFor(photo)}`, photo } : null
    if (upload) {
      await db.pendingUploads.put({ path: upload.path, blob: photo!, contentType: photo!.type })
      await db.outbox.add({ op: 'upload', table: 'storage', rowId: upload.path })
    }
    const row = {
      id,
      user_id: userId,
      ...input,
      note: input.note?.trim() || null,
      photo_path: upload?.path ?? null,
      workout_id: null,
      local_date: toLocalDate(now),
    }
    // created_at is the device time of logging (rule 3), so insert it explicitly.
    await db.personal_records.put({ ...row, created_at: now.toISOString(), updated_at: now.toISOString() })
    await db.outbox.add({ op: 'upsert', table: 'personal_records', rowId: id, payload: { ...row, created_at: now.toISOString() } })
    await w.event(
      userId,
      'pr_logged',
      { pr_id: id, exercise_id: input.exercise_id, type: input.type, weight_kg: input.weight_kg, reps: input.reps, ...(input.duration_seconds ? { duration_seconds: input.duration_seconds } : {}) },
      now.toISOString(),
    )
    return id
  })
}

/** PR-6: weight, reps, type and note are editable; the logged date never is. */
export function updatePr(pr: PersonalRecord, input: Omit<PrInput, 'exercise_id'>, photo: Blob | null | undefined) {
  return commit(async (w) => {
    const changes: Partial<PersonalRecord> = {
      type: input.type,
      weight_kg: input.weight_kg,
      reps: input.reps,
      ...(input.duration_seconds !== undefined ? { duration_seconds: input.duration_seconds } : {}),
      note: input.note?.trim() || null,
    }
    if (photo !== undefined) changes.photo_path = await queuePhoto(pr, photo)
    await w.patch('personal_records', pr.id, changes)
  })
}

export function deletePr(pr: PersonalRecord) {
  return commit(async (w) => {
    await w.remove('personal_records', pr.id)
    if (pr.photo_path) {
      await db.pendingUploads.delete(pr.photo_path)
      await db.outbox.add({ op: 'remove', table: 'storage', rowId: pr.photo_path })
    }
  })
}
