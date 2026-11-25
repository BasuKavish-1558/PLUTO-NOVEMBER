import { db, type OutboxEntry } from '../db'
import { MEDIA_BUCKET } from '../media'
import { getSupabase } from '../supabase'
import { isPermanent, setAside, type SendError } from './failures'

async function send(entry: OutboxEntry): Promise<SendError | null> {
  const sb = await getSupabase()
  switch (entry.op) {
    case 'upsert':
      return (await sb.from(entry.table).upsert(entry.payload)).error
    case 'update':
      return (await sb.from(entry.table).update(entry.payload).eq('id', entry.rowId)).error
    case 'insert':
      // Events are append-only: ON CONFLICT DO NOTHING keeps retries idempotent with insert rights only.
      return (await sb.from(entry.table).upsert(entry.payload, { onConflict: 'id', ignoreDuplicates: true })).error
    case 'delete':
      return (await sb.from(entry.table).delete().eq('id', entry.rowId)).error
    case 'upload': {
      const file = await db.pendingUploads.get(entry.rowId)
      if (!file) return null // superseded before it was uploaded
      const { error } = await sb.storage
        .from(MEDIA_BUCKET)
        .upload(entry.rowId, file.blob, { contentType: file.contentType, upsert: true })
      return error
    }
    case 'remove':
      return (await sb.storage.from(MEDIA_BUCKET).remove([entry.rowId])).error
  }
}

/** The server refused a 4th photo for the day: drop the row locally and remove its uploaded file. */
async function dropCappedPhoto(seq: number, photoId: string) {
  await db.transaction('rw', db.outbox, db.workout_photos, async () => {
    const photo = await db.workout_photos.get(photoId)
    await db.outbox.delete(seq)
    await db.workout_photos.delete(photoId)
    if (photo) await db.outbox.add({ op: 'remove', table: 'storage', rowId: photo.storage_path })
  })
}

/**
 * Sends the outbox in FIFO order (parents before children). A change the server permanently
 * refuses is set aside (see failures.ts) and the queue continues; any other failure stops here
 * and is retried on the next sync.
 */
export async function pushOutbox(): Promise<boolean> {
  const entries = await db.outbox.orderBy('seq').toArray()
  for (const entry of entries) {
    let error: SendError | null
    try {
      error = await send(entry)
    } catch (e) {
      error = { message: e instanceof Error ? e.message : String(e) }
    }
    if (error && entry.table === 'workout_photos' && error.message.includes('photo_cap_reached')) {
      await dropCappedPhoto(entry.seq!, entry.rowId) // another device filled the day first
      continue
    }
    if (error && isPermanent(entry, error)) {
      await setAside(entry, error)
      continue
    }
    if (error) {
      await db.outbox.update(entry.seq!, { lastError: error.message })
      return false
    }
    await db.transaction('rw', db.outbox, db.pendingUploads, async () => {
      await db.outbox.delete(entry.seq!)
      if (entry.op === 'upload') await db.pendingUploads.delete(entry.rowId)
    })
  }
  return true
}
