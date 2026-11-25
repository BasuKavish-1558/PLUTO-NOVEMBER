import { db, type Profile } from '../db'
import { extensionFor } from '../media'
import { requestSync } from '../sync/engine'

export type ProfilePatch = Partial<
  Pick<
    Profile,
    'name' | 'age' | 'height_cm' | 'weight_unit' | 'length_unit' | 'theme_pref' | 'background' | 'show_bmi' | 'onboarded_at'
  >
>

export async function updateProfile(id: string, patch: ProfilePatch) {
  await db.transaction('rw', db.profiles, db.outbox, async () => {
    await db.profiles.update(id, { ...patch, updated_at: new Date().toISOString() })
    await db.outbox.add({ op: 'update', table: 'profiles', rowId: id, payload: patch })
  })
  requestSync()
}

/** Pass a compressed image to replace the avatar, or null to remove it. */
export async function setAvatar(profile: Profile, image: Blob | null) {
  const path = image ? `${profile.id}/avatar/${crypto.randomUUID()}.${extensionFor(image)}` : null
  const old = profile.avatar_path

  await db.transaction('rw', db.profiles, db.outbox, db.pendingUploads, async () => {
    if (image && path) {
      await db.pendingUploads.put({ path, blob: image, contentType: image.type })
      await db.outbox.add({ op: 'upload', table: 'storage', rowId: path })
    }
    await db.profiles.update(profile.id, { avatar_path: path, updated_at: new Date().toISOString() })
    await db.outbox.add({ op: 'update', table: 'profiles', rowId: profile.id, payload: { avatar_path: path } })
    if (old) {
      await db.pendingUploads.delete(old)
      await db.outbox.add({ op: 'remove', table: 'storage', rowId: old })
    }
  })
  requestSync()
}
