import { db, type Workout, type WorkoutPhoto } from '../db'
import { extensionFor } from '../media'
import { commit } from './write'

/** CL-5: per local day, across all of that day's workouts. Also enforced by a DB trigger. */
export const PHOTO_CAP = 3
export const PHOTO_MAX_PX = 1600

export class PhotoCapError extends Error {
  constructor() {
    super(`Up to ${PHOTO_CAP} photos per day`)
  }
}

export const photosOnDay = (userId: string, localDate: string) =>
  db.workout_photos.where('local_date').equals(localDate).filter((p) => p.user_id === userId).toArray()

/**
 * Stores the compressed image locally, then queues upload → row → event (FIFO), so the row
 * never reaches the server before its file. Shown from the local blob until uploaded.
 */
export function addWorkoutPhoto(workout: Pick<Workout, 'id' | 'user_id' | 'local_date'>, image: Blob, now = new Date()) {
  return commit(async (w) => {
    if ((await photosOnDay(workout.user_id, workout.local_date)).length >= PHOTO_CAP) throw new PhotoCapError()
    const id = crypto.randomUUID()
    const path = `${workout.user_id}/workouts/${workout.id}/${id}.${extensionFor(image)}`
    await db.pendingUploads.put({ path, blob: image, contentType: image.type })
    await db.outbox.add({ op: 'upload', table: 'storage', rowId: path })
    await w.insert('workout_photos', { id, user_id: workout.user_id, workout_id: workout.id, local_date: workout.local_date, storage_path: path })
    await w.event(workout.user_id, 'photo_added', { workout_id: workout.id, photo_id: id, local_date: workout.local_date }, now.toISOString())
    return id
  })
}

/** CL-6: removes the row, then the file (or the not-yet-uploaded blob). */
export function deleteWorkoutPhoto(photo: WorkoutPhoto) {
  return commit(async (w) => {
    await w.remove('workout_photos', photo.id)
    await db.pendingUploads.delete(photo.storage_path)
    await db.outbox.add({ op: 'remove', table: 'storage', rowId: photo.storage_path })
  })
}
