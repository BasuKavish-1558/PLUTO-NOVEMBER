import type { ComponentType } from 'react'
import { createBrowserRouter, Navigate } from 'react-router'
import { RouteError } from '@/components/layout/RouteError'
import { Splash } from '@/components/layout/Splash'
import { AuthPage } from '@/features/auth/AuthPage'
import { Gate } from '@/features/auth/Gate'

/**
 * Only sign-in (a new visitor's first screen) ships in the main bundle; the shell and every screen,
 * Home included, are chunks: cached by the service worker for returning users and prefetched after sign-in,
 * so all of it works offline (load target: < 2 s on a typical 4G phone).
 */
const loaders: (() => Promise<unknown>)[] = []
const page = <M,>(load: () => Promise<M>, pick: (m: M) => ComponentType) => {
  loaders.push(load)
  return () => load().then((m) => ({ Component: pick(m) }))
}

/**
 * Downloads every screen once the app is idle, so all of Pluto is available offline even
 * before the service worker has finished precaching (e.g. losing signal mid first session).
 */
export const prefetchScreens = () => Promise.allSettled(loaders.map((load) => load()))

export const router = createBrowserRouter([
  {
    // A cold load straight onto a lazy screen (e.g. a refresh on /progress) shows the splash meanwhile.
    hydrateFallbackElement: <Splash />,
    element: <Gate need="guest" />,
    children: [{ path: 'auth', element: <AuthPage /> }], // first screen for new users: no extra round trip
  },
  {
    hydrateFallbackElement: <Splash />,
    element: <Gate need="onboarding" />,
    children: [{ path: 'onboarding', lazy: page(() => import('@/features/onboarding/OnboardingPage'), (m) => m.OnboardingPage) }],
  },
  {
    hydrateFallbackElement: <Splash />,
    element: <Gate need="app" />,
    children: [
      {
        lazy: page(() => import('@/components/layout/AppShell'), (m) => m.AppShell),
        errorElement: <RouteError />,
        children: [
          { index: true, lazy: page(() => import('@/features/home/HomePage'), (m) => m.HomePage) },
          { path: 'workout', lazy: page(() => import('@/features/workout/WorkoutPage'), (m) => m.WorkoutPage) },
          { path: 'workout/live', lazy: page(() => import('@/features/workout/LiveWorkoutPage'), (m) => m.LiveWorkoutPage) },
          { path: 'workout/:workoutId', lazy: page(() => import('@/features/workout/WorkoutDetailPage'), (m) => m.WorkoutDetailPage) },
          { path: 'workout/:workoutId/edit', lazy: page(() => import('@/features/workout/EditWorkoutPage'), (m) => m.EditWorkoutPage) },
          { path: 'progress', lazy: page(() => import('@/features/progress/ProgressPage'), (m) => m.ProgressPage) },
          { path: 'split', lazy: page(() => import('@/features/split/SplitPage'), (m) => m.SplitPage) },
          { path: 'split/library', lazy: page(() => import('@/features/library/LibraryPage'), (m) => m.LibraryPage) },
          { path: 'split/:splitId', lazy: page(() => import('@/features/split/SplitEditorPage'), (m) => m.SplitEditorPage) },
          { path: 'split/:splitId/:weekday', lazy: page(() => import('@/features/split/DayEditorPage'), (m) => m.DayEditorPage) },
          { path: 'nutrition', lazy: page(() => import('@/features/nutrition/NutritionPage'), (m) => m.NutritionPage) },
          { path: 'profile', lazy: page(() => import('@/features/profile/ProfilePage'), (m) => m.ProfilePage) },
        ],
      },
    ],
  },
  {
    // Opened from the recovery email; works signed in or out, so it sits outside the guards.
    path: 'reset-password',
    hydrateFallbackElement: <Splash />,
    lazy: page(() => import('@/features/auth/ResetPasswordPage'), (m) => m.ResetPasswordPage),
  },
  { path: '*', element: <Navigate to="/" replace /> },
])
