import { CloudOff } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useSyncExternalStore } from 'react'
import { quick } from '@/lib/motion'

const subscribe = (cb: () => void) => {
  window.addEventListener('online', cb)
  window.addEventListener('offline', cb)
  return () => {
    window.removeEventListener('online', cb)
    window.removeEventListener('offline', cb)
  }
}

const useOnline = () => useSyncExternalStore(subscribe, () => navigator.onLine)

/** Everything keeps working offline; this just says so, and that changes will sync later. */
export function OfflineBanner() {
  const online = useOnline()
  return (
    <AnimatePresence initial={false}>
      {!online && (
        <motion.div
          role="status"
          initial={{ height: 0 }}
          animate={{ height: 'auto' }}
          exit={{ height: 0 }}
          transition={quick}
          className="overflow-hidden bg-muted text-sm text-muted-foreground"
        >
          <p className="flex items-center justify-center gap-2 px-4 py-2">
            <CloudOff className="size-4" /> Offline. Changes are saved and will sync later.
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
