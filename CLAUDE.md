# Pluto: gym tracker PWA

Requirements: [docs/PRD.md](docs/PRD.md) (v1.0 Final). Resolved ambiguities, schema and phase plan: [docs/PLAN.md](docs/PLAN.md). When they disagree, PLAN.md wins. Read both before starting a phase.

## Working agreement

- Build in the PRD's phases. Don't build ahead of the current phase.
- After each phase: run typecheck, lint and tests, fix issues, and list what to test manually.
- **No git actions** (no commits, branches, or init). The user commits everything themselves.
- UI is reviewed before Supabase is wired in. Until then, screens use clearly marked demo data from `src/data/demo.ts`.
- **Ask before adding any dependency not listed below.**
- Keep files small (roughly < 200 lines) and code clean. No speculative abstractions.

## Stack (exact)

Vite + React + TypeScript (strict) · React Router · Tailwind CSS + shadcn/ui · Motion (framer-motion) · canvas-confetti · Recharts · Supabase (Postgres, Auth email+password, Storage, RLS) · Dexie (IndexedDB) with a sync outbox · vite-plugin-pwa · TanStack Query · Zustand · Zod · Vitest · Playwright.

## Commands

| Task | Command |
|---|---|
| Dev server | `npm run dev` |
| Type-check | `npm run typecheck` |
| Lint | `npm run lint` |
| Unit tests | `npm test` (Vitest, run once) / `npm run test:watch` |
| E2E tests | `npm run test:e2e` (Playwright, port 4199, against a fake Supabase in `e2e/support/`) |
| Load-time test | `npm run test:perf` (production build + service worker, throttled, one worker) |
| Lighthouse | `npm run build && npm run preview`, then `npm run audit` |
| Production build | `npm run build` / `npm run preview` |
| DB types | `npm run db:types` (Supabase CLI → `src/types/database.ts`; `src/data/schemaDrift.ts` fails typecheck on column drift) |

Definition of done for a phase: `npm run typecheck && npm run lint && npm test && npm run build` all pass.

## Architecture rules

1. **Units:** store weight in **kg** and height in **cm**, always. Convert only for display and input via `src/domain/units.ts`, based on `profiles.weight_unit` (kg/lb) and `profiles.length_unit` (cm/ft_in).
2. **1RM:** one pure function, `estimateOneRepMax()` in `src/domain/oneRepMax.ts` (Epley; reps = 1 → weight). Never store 1RM.
3. **PRs are manual.** No auto-detection anywhere. A PR = exercise, type (`heaviest_weight` | `most_reps_at_weight`), weight, reps, optional note and photo. `created_at` comes from the device clock and is never typed by the user. PRs are independent of workout edits and deletes (`workout_id` → set null). "Previous record it beat" is the pure, tested `previousRecord()`, computed and never stored. A PR logged mid-workout shows in that workout's summary.
4. **Derived data:** streaks (consecutive **local** days with a workout; scheduled rest days of the active split bridge without counting), monthly count, and chart series (top working-set weight, volume, best est. 1RM per session, body weight) are pure functions in `src/domain/` over workout history. Warm-up sets are excluded from volume and charts. Everything is covered by Vitest.
5. **Offline-first:** every user write goes to Dexie + outbox first (`src/data/repos/*`), then syncs to Supabase in the background. The in-progress workout lives only in Dexie and is auto-saved on every change. Timer state is stored as timestamps. Rows use client-generated UUIDs. Components never call Supabase directly; they read Dexie through `useLive()` (`src/lib/useLive.ts`).
6. **Events:** append-only `events` table (`workout_completed`, `set_logged`, `pr_logged`, `protein_goal_met`, `photo_added`), emitted by repos. **Do not build gamification.**
7. **Nutrition:** generic model (nutrient + amount). Protein goal = body weight (effective on that date) × multiplier (effective on that date). The user edits only the multiplier: goal type cut/maintain/bulk pre-fills 2.0/1.6/1.8. **Never offer a gram input for the goal.** History is kept via `nutrition_goals.effective_from`.
8. **Security:** RLS on every table, so users only see their own rows. Child tables use composite `(parent_id, user_id)` FKs. Media goes in the private `user-media` bucket under `{uid}/…` and is shown via signed URLs. Account deletion (Edge Function `delete-account`) removes storage files and the auth user, and all rows cascade. Wipe Dexie on sign-out.
9. **Exercises** used in workouts or PRs are archived (`archived_at`), never hard-deleted (enforced by `ON DELETE RESTRICT`).
10. **Photos:** at most 3 workout photos per local day (DB trigger + UI), compressed client-side to WebP (≤ 1600 px) before upload. PR photos: 1 per PR, outside the cap.
11. **Auth:** Supabase Auth owns credentials. User data lives in `profiles` (1:1 with `auth.users`). No `password_hash` column.

## Code layout

- `src/domain/`: pure functions only (no React, no IO), each with a colocated `*.test.ts`.
- `src/data/`: Supabase client, Dexie schema, sync engine, repos, media helpers, preset templates.
- `src/features/<area>/`: pages, components and query hooks per area (auth, onboarding, home, workout, split, library, progress, calendar, nutrition, profile).
- `src/components/ui/`: shadcn. `src/components/layout/`: shell and navigation.
- `src/stores/`: Zustand (active workout, UI state).
- `supabase/migrations/`: SQL. Never edit an applied migration; add a new one.

## Design direction

- Minimal: neutral palette + **one** accent color, generous whitespace, one font (Inter, self-hosted), `rounded-xl` cards, no clutter.
- Design tokens are CSS variables in `src/styles/globals.css` for light and dark. Manual toggle, persisted to `profiles.theme_pref` (localStorage before sign-in). No theme flash on load.
- Motion: springy 150–300 ms transitions, animated page transitions, animated protein ring, calendar cells that fill in, drag-to-reorder exercises (plus up/down buttons for keyboard users), confetti + bounce on PR, subtle press feedback. Always respect `prefers-reduced-motion` (`MotionConfig reducedMotion="user"`; skip confetti).
- Mobile-first, tap targets ≥ 44 px.
- **Home = the calendar** (contribution-style month grid, streak and monthly count, tap a day for its log). Nothing else lives on Home. Today's workout and quick start are at the top of Workout; the protein ring is on Nutrition.
- Phone: header with the **profile avatar top-left**, bottom nav **Home · Workout · Progress · More** (More sheet = Split, Nutrition). ≥ md: sidebar with Home, Workout, Split, Progress, Nutrition, Profile.
- Logging a set takes ≤ 2 taps: rows are pre-filled from the previous set or last session, and one tap on ✓ logs it.
