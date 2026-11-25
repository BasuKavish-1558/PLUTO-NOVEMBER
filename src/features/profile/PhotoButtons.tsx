import { Camera, ImageIcon, Trash2 } from 'lucide-react'
import { useRef, useState, type ChangeEvent } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { compressImage } from '@/data/media'

const AVATAR_PX = 512

type Props = { hasPhoto: boolean; onPick: (image: Blob | null) => void | Promise<void>; maxPx?: number }

/** Camera opens the front camera on phones; on desktop both fall back to the file picker. */
export function PhotoButtons({ hasPhoto, onPick, maxPx = AVATAR_PX }: Props) {
  const camera = useRef<HTMLInputElement>(null)
  const gallery = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = '' // let the same file be picked again
    if (!file) return
    setBusy(true)
    try {
      await onPick(await compressImage(file, maxPx))
    } catch {
      toast.error("Couldn't read that image. Try a different photo.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-wrap justify-center gap-2">
      <input ref={camera} type="file" accept="image/*" capture="user" hidden onChange={onFile} />
      <input ref={gallery} type="file" accept="image/*" hidden onChange={onFile} />
      <Button type="button" variant="outline" disabled={busy} onClick={() => camera.current?.click()}>
        <Camera /> Camera
      </Button>
      <Button type="button" variant="outline" disabled={busy} onClick={() => gallery.current?.click()}>
        <ImageIcon /> Gallery
      </Button>
      {hasPhoto && (
        <Button type="button" variant="ghost" disabled={busy} onClick={() => void onPick(null)} className="text-muted-foreground">
          <Trash2 /> Remove
        </Button>
      )}
    </div>
  )
}
