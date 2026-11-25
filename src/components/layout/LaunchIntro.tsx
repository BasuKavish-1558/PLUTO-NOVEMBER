import { ChartLine, Dumbbell, Layers } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'

const SEEN = 'pluto-intro-seen' // localStorage: has this device ever finished the intro?
const PLAYED = 'pluto-intro-played' // sessionStorage: once per app launch, not on every refresh
const RETURNING_MS = 2100

const HIGHLIGHTS = [
  { icon: Layers, text: 'Pick a split or build your own' },
  { icon: Dumbbell, text: 'Log every set in two taps' },
  { icon: ChartLine, text: 'Watch your strength climb' },
] as const

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
const read = (store: Storage, key: string) => {
  try {
    return store.getItem(key)
  } catch {
    return null
  }
}

/**
 * Plays on every launch: the logo animates in with a short intro. The first time ever, it waits for
 * "Get started" (then sign-in shows); afterwards it continues by itself (tap to skip). The app loads
 * behind it the whole time, so it adds no waiting. CSS-only, to keep the startup bundle lean.
 */
export function LaunchIntro({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<'playing' | 'leaving' | 'done'>(() => (read(sessionStorage, PLAYED) ? 'done' : 'playing'))
  const [firstTime] = useState(() => !read(localStorage, SEEN))

  const leave = () => {
    try {
      localStorage.setItem(SEEN, '1')
    } catch {
      /* private mode: replay next time, harmless */
    }
    setPhase('leaving')
    setTimeout(() => setPhase('done'), reducedMotion() ? 0 : 380)
  }

  useEffect(() => {
    if (phase !== 'playing') return
    try {
      sessionStorage.setItem(PLAYED, '1')
    } catch {
      /* ignore */
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && leave()
    window.addEventListener('keydown', onKey)
    const timer = firstTime ? undefined : setTimeout(leave, reducedMotion() ? 900 : RETURNING_MS)
    return () => {
      window.removeEventListener('keydown', onKey)
      clearTimeout(timer)
    }
  }, [phase, firstTime])

  return (
    <>
      <div className="contents" inert={phase !== 'done'}>
        {children}
      </div>
      {phase !== 'done' && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="intro-title"
          onClick={firstTime ? undefined : leave}
          className={`fixed inset-0 z-[100] grid place-items-center overflow-hidden bg-background px-6 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] ${phase === 'leaving' ? 'intro-leave' : ''}`}
        >
          <div className="flex w-full max-w-xs flex-col items-center text-center">
            <PlutoMark />
            <h1 id="intro-title" className="intro-rise mt-6 text-4xl font-semibold tracking-tight" style={{ animationDelay: '450ms' }}>
              Pluto
            </h1>
            <p className="intro-rise mt-2 text-muted-foreground" style={{ animationDelay: '620ms' }}>Your training, all in one orbit.</p>
            <ul className="mt-8 space-y-3 text-left">
              {HIGHLIGHTS.map(({ icon: Icon, text }, i) => (
                <li key={text} className="intro-rise flex items-center gap-3" style={{ animationDelay: `${820 + i * 120}ms` }}>
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-muted">
                    <Icon className="size-[18px] text-primary" aria-hidden />
                  </span>
                  <span className="text-sm">{text}</span>
                </li>
              ))}
            </ul>
            {firstTime ? (
              <Button size="lg" autoFocus className="intro-rise mt-10 w-full" style={{ animationDelay: '1250ms' }} onClick={leave}>
                Get started
              </Button>
            ) : (
              <button type="button" autoFocus onClick={leave} className="sr-only">
                Skip intro
              </button>
            )}
          </div>
        </div>
      )}
    </>
  )
}

// Delays are inline: .intro-* rules are unlayered CSS, which outranks Tailwind's layered utilities.

/** The planet pops in, its ring draws behind and in front of it, and a moon orbits along the ring. */
function PlutoMark() {
  const orbit = 'M60,256 a196,56 0 1,0 392,0 a196,56 0 1,0 -392,0'
  return (
    <svg viewBox="0 0 512 512" className="size-36 overflow-visible" aria-hidden>
      <defs>
        <radialGradient id="intro-glow">
          <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.45" />
          <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="intro-shade" cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.28" />
          <stop offset="60%" stopColor="#fff" stopOpacity="0" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.25" />
        </radialGradient>
      </defs>
      <circle cx="256" cy="256" r="230" fill="url(#intro-glow)" className="intro-glow" />
      <g transform="rotate(-20 256 256)">
        {/* back half of the ring: behind the planet */}
        <path d="M60,256 a196,56 0 0,1 392,0" fill="none" stroke="currentColor" strokeWidth="20" strokeLinecap="round" pathLength={1} strokeOpacity={0.6} className="intro-ring" />
      </g>
      <g className="intro-planet">
        <circle cx="256" cy="256" r="120" fill="var(--primary)" />
        <circle cx="256" cy="256" r="120" fill="url(#intro-shade)" />
      </g>
      <g transform="rotate(-20 256 256)">
        {/* front half of the ring: in front of the planet */}
        <path d="M452,256 a196,56 0 0,1 -392,0" fill="none" stroke="currentColor" strokeWidth="20" strokeLinecap="round" pathLength={1} className="intro-ring"
          style={{ animationDelay: '500ms' }} />
        <circle r="16" fill="var(--primary)" className="intro-moon">
          {!reducedMotion() && <animateMotion dur="3.2s" begin="0.9s" repeatCount="indefinite" path={orbit} />}
        </circle>
      </g>
    </svg>
  )
}
