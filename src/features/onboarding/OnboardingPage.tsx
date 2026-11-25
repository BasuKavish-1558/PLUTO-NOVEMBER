import { AnimatePresence, MotionConfig, motion } from 'motion/react'
import { useState } from 'react'
import type { Profile } from '@/data/db'
import { useProfile } from '@/features/profile/queries'
import { spring } from '@/lib/motion'
import { ProfileStep } from './ProfileStep'
import { VitalsStep } from './VitalsStep'

const STEPS = ['Profile', 'Body'] as const

export function OnboardingPage() {
  const profile = useProfile()
  return profile ? (
    <MotionConfig reducedMotion="user">
      <Onboarding profile={profile} />
    </MotionConfig>
  ) : null
}

function Onboarding({ profile }: { profile: Profile }) {
  // Resume at the first unfinished step: a saved name means step 1 is done.
  const [step, setStep] = useState(() => (profile.name ? 1 : 0))
  const [direction, setDirection] = useState(1)

  const go = (next: number) => {
    setDirection(next > step ? 1 : -1)
    setStep(next)
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-4 pt-[calc(2rem+env(safe-area-inset-top))] pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
      <div className="mb-8 space-y-3">
        <p className="text-sm text-muted-foreground">
          Step {step + 1} of {STEPS.length}
        </p>
        <div className="flex gap-2" aria-hidden>
          {STEPS.map((label, i) => (
            <div key={label} className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
              <motion.div
                className="h-full rounded-full bg-primary"
                initial={false}
                animate={{ width: i <= step ? '100%' : '0%' }}
                transition={spring}
              />
            </div>
          ))}
        </div>
      </div>
      <AnimatePresence mode="wait" initial={false} custom={direction}>
        <motion.div
          key={step}
          custom={direction}
          initial={{ opacity: 0, x: direction * 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: direction * -24 }}
          transition={spring}
          className="flex flex-1 flex-col"
        >
          {step === 0 ? (
            <ProfileStep profile={profile} onNext={() => go(1)} />
          ) : (
            <VitalsStep profile={profile} onBack={() => go(0)} />
          )}
        </motion.div>
      </AnimatePresence>
    </main>
  )
}
