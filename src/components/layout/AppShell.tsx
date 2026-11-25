import { MotionConfig } from 'motion/react'
import { AnimatedOutlet } from './AnimatedOutlet'
import { BottomNav } from './BottomNav'
import { MobileHeader } from './MobileHeader'
import { OfflineBanner } from './OfflineBanner'
import { Sidebar } from './Sidebar'

export function AppShell() {
  // Motion loads with the shell, not the sign-in screen; "user" honours prefers-reduced-motion.
  return (
    <MotionConfig reducedMotion="user">
    <div className="min-h-dvh md:flex">
      <Sidebar />
      <div className="min-w-0 flex-1">
        <MobileHeader />
        <OfflineBanner />
        <main className="mx-auto w-full max-w-2xl px-4 pt-4 pb-[calc(6rem+env(safe-area-inset-bottom))] md:px-8 md:pt-10 md:pb-12">
          <AnimatedOutlet />
        </main>
      </div>
      <BottomNav />
    </div>
    </MotionConfig>
  )
}
