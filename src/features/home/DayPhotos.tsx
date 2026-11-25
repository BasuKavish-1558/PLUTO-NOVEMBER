import { ImageOff, ImagePlus } from 'lucide-react'
import { useRef, useState, type ChangeEvent } from 'react'
import { toast } from 'sonner'
import { db, type WorkoutPhoto } from '@/data/db'
import { compressImage } from '@/data/media'
import { addWorkoutPhoto, PHOTO_CAP, PHOTO_MAX_PX, PhotoCapError } from '@/data/repos/photos'
import type { LocalDate } from '@/domain/dates'
import { useMediaUrl } from '@/features/profile/queries'
import type { WorkoutDetail } from '@/features/workout/queries'
import { useLive } from '@/lib/useLive'
import { useUser } from '@/stores/session'
import { PhotoViewer } from './PhotoViewer'

/** CL-5/CL-6: up to 3 private photos per day, attached to that day's latest workout. */
export function DayPhotos({ date, workouts }: { date: LocalDate; workouts: WorkoutDetail[] }) {
  const { userId } = useUser()
  const input = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [viewing, setViewing] = useState<number | null>(null)
  const photos =
    useLive(
      async () =>
        (await db.workout_photos.where('local_date').equals(date).filter((p) => p.user_id === userId).toArray()).sort((a, b) =>
          a.created_at.localeCompare(b.created_at),
        ),
      [date, userId],
    ) ?? []
  const target = workouts.at(-1)?.workout

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !target) return
    setBusy(true)
    try {
      await addWorkoutPhoto(target, await compressImage(file, PHOTO_MAX_PX))
    } catch (err) {
      toast.error(err instanceof PhotoCapError ? err.message : "Couldn't read that image. Try another photo.")
    } finally {
      setBusy(false)
    }
  }

  if (!workouts.length) return null

  return (
    <section className="space-y-2">
      <h3 className="flex items-baseline justify-between text-sm font-semibold">
        Photos <span className="font-normal text-muted-foreground tabular-nums">{photos.length}/{PHOTO_CAP}</span>
      </h3>
      <div className="grid grid-cols-3 gap-2">
        {photos.map((p, i) => (
          <Thumb key={p.id} photo={p} label={`Photo ${i + 1} of ${photos.length}`} onOpen={() => setViewing(i)} />
        ))}
        {photos.length < PHOTO_CAP && (
          <button
            type="button"
            disabled={busy}
            onClick={() => input.current?.click()}
            className="grid aspect-square place-items-center rounded-xl border border-dashed text-muted-foreground transition-colors hover:bg-muted/50 active:bg-muted disabled:opacity-50"
          >
            <span className="flex flex-col items-center gap-1 text-xs">
              <ImagePlus className="size-6" /> {busy ? 'Adding…' : 'Add photo'}
            </span>
          </button>
        )}
      </div>
      <input ref={input} type="file" accept="image/*" hidden onChange={(e) => void onFile(e)} aria-label="Choose a photo" />
      <PhotoViewer photos={photos} index={viewing} onIndexChange={setViewing} />
    </section>
  )
}

function Thumb({ photo, label, onOpen }: { photo: WorkoutPhoto; label: string; onOpen: () => void }) {
  const src = useMediaUrl(photo.storage_path)
  const [failed, setFailed] = useState(false)
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={label}
      className="aspect-square overflow-hidden rounded-xl bg-muted transition-transform active:scale-95 motion-reduce:active:scale-100"
    >
      {src && !failed ? (
        <img src={src} alt="" className="size-full object-cover" onError={() => setFailed(true)} />
      ) : (
        <span className="grid size-full place-items-center text-muted-foreground">
          <ImageOff className="size-5" />
        </span>
      )}
    </button>
  )
}
