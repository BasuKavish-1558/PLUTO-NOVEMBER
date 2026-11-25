import { db } from './db'
import { getSupabase } from './supabase'

export const MEDIA_BUCKET = 'user-media'
const SIGNED_URL_TTL_S = 60 * 60

/** Downscale so the longest side is ≤ maxPx and re-encode as WebP. */
export async function compressImage(file: Blob, maxPx: number, quality = 0.85): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, maxPx / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  const webp = await encode(canvas, 'image/webp', quality)
  // Safari can't encode WebP and silently returns PNG; fall back to JPEG (also allowed by the bucket).
  return webp.type === 'image/webp' ? webp : encode(canvas, 'image/jpeg', quality)
}

const encode = (canvas: HTMLCanvasElement, type: string, quality: number) =>
  new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Could not encode image'))), type, quality),
  )

export const extensionFor = (blob: Blob) => (blob.type === 'image/jpeg' ? 'jpg' : 'webp')

/**
 * A displayable URL for a storage path: the local blob while it waits to upload,
 * otherwise a short-lived signed URL. Null when offline with nothing local.
 */
export async function mediaUrl(path: string): Promise<string | null> {
  const pending = await db.pendingUploads.get(path)
  if (pending) return URL.createObjectURL(pending.blob)
  if (!navigator.onLine) return null
  const { data, error } = await (await getSupabase()).storage.from(MEDIA_BUCKET).createSignedUrl(path, SIGNED_URL_TTL_S)
  return error ? null : data.signedUrl
}
