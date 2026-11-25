import '@/styles/globals.css'
import { QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router/dom'
import { BackgroundPattern } from '@/components/layout/BackgroundPattern'
import { LaunchIntro } from '@/components/layout/LaunchIntro'
import { ThemeSync } from '@/components/layout/ThemeSync'
import { initAuth } from '@/data/auth'
import { queryClient } from '@/lib/queryClient'
import { prefetchScreens, router } from '@/router'
import { useSession } from '@/stores/session'

initAuth()

// Once signed in and idle, fetch every other screen so the whole app works offline (sign-in stays lean).
const stopWatching = useSession.subscribe((s) => {
  if (s.status !== 'ready') return
  stopWatching()
  const run = () => void prefetchScreens()
  if ('requestIdleCallback' in window) window.requestIdleCallback(run, { timeout: 4000 })
  else setTimeout(run, 1500)
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeSync />
      <BackgroundPattern />
      <LaunchIntro>
        <RouterProvider router={router} />
      </LaunchIntro>
    </QueryClientProvider>
  </StrictMode>,
)
