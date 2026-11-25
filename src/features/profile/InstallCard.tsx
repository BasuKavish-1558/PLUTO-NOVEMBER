import { Download, Share } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

type InstallPrompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> }

let deferred: InstallPrompt | null = null
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault() // keep it for our own button instead of the browser's mini-infobar
  deferred = e as InstallPrompt
})

const standalone = () => window.matchMedia('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true
const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent)

/** PWA install: Chrome/Edge/Android get a button; iOS gets the Share → Add to Home Screen hint. */
export function InstallCard() {
  const [prompt, setPrompt] = useState<InstallPrompt | null>(deferred)
  const [installed, setInstalled] = useState(standalone)

  useEffect(() => {
    const onPrompt = () => setPrompt(deferred)
    const onInstalled = () => setInstalled(true)
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  if (installed || (!prompt && !isIos())) return null

  async function install() {
    if (!prompt) return
    await prompt.prompt()
    if ((await prompt.userChoice).outcome === 'accepted') setInstalled(true)
    deferred = null
    setPrompt(null)
  }

  return (
    <Card className="flex items-center gap-4">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-muted">
        <Download className="size-5 text-primary" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-medium">Install Pluto</p>
        <p className="text-sm text-muted-foreground">
          {prompt ? 'Opens like an app and works offline at the gym.' : (
            <>
              Tap <Share className="inline size-4 align-text-bottom" aria-label="Share" /> then “Add to Home Screen”.
            </>
          )}
        </p>
      </div>
      {prompt && <Button onClick={() => void install()}>Install</Button>}
    </Card>
  )
}
