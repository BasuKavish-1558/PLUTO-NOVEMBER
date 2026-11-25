import { create } from 'zustand'
import { discardActive, loadActive, saveActive } from '@/data/repos/workouts'
import type { ActiveWorkout } from '@/domain/workoutSession'

type State = {
  /** undefined until loaded from Dexie for this user. */
  workout: ActiveWorkout | null | undefined
  load: (userId: string) => Promise<void>
  begin: (workout: ActiveWorkout) => void
  /** Applies a pure change and auto-saves it (WK-9). */
  update: (change: (w: ActiveWorkout) => ActiveWorkout) => void
  /** After finish (the repo already removed the record) or discard. */
  clear: (opts?: { discard?: boolean }) => void
}

/**
 * The in-progress workout. Zustand keeps typing instant; every change is written through to
 * Dexie in call order, so a crash loses at most the keystroke in flight.
 */
export const useActiveWorkout = create<State>((set, get) => ({
  workout: undefined,
  load: async (userId) => set({ workout: await loadActive(userId) }),
  begin: (workout) => set({ workout }),
  update: (change) => {
    const current = get().workout
    if (!current) return
    const next = change(current)
    set({ workout: next })
    void saveActive(next)
  },
  clear: ({ discard = false } = {}) => {
    set({ workout: null })
    if (discard) void discardActive()
  },
}))
