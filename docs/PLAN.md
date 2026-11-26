# Pluto: Build Plan (draft for approval)

Companion to [PRD.md](PRD.md). Where this plan resolves an ambiguity, the resolution here wins and should be copied into the PRD's decisions log once approved.

---

## (a) Ambiguities, contradictions and recommended resolutions

| # | Issue | Recommendation |
|---|---|---|
| A1 | **"Sign in" vs "create an account" (§6 vs P-1).** Onboarding says *Sign in → Profile (name, photo, email)*, but the email is already captured when the account is created. | One `/auth` screen with **Create account** (default) and **Sign in** tabs. New user: Create account (email + password) → Profile (name, photo; email shown read-only) → Vitals (age, weight, height, units) → Home. Returning user: Sign in → Home, or back to the first unfinished onboarding step (tracked by `profiles.onboarded_at`). **Turn off Supabase email confirmation for v1** so onboarding has no inbox detour. You can turn it on later. |
| A2 | **7 destinations vs a bottom bar.** The PRD suggests moving Nutrition and Profile under "More" if five tabs is the limit, but that still leaves 5 tabs **plus** More. | **Decided (Nov 24):** **Home is the calendar.** It shows only the contribution-style month grid (CL-1…CL-7: streak and monthly count above, binary shading, tap a day for its log and photos), so there's no separate Calendar destination. **Phone:** bottom bar **Home · Workout · Progress · More**, where More is a sheet with **Split, Nutrition**. **Profile** is an avatar button in the top-left of the phone header. **Desktop/tablet:** sidebar with Home, Workout, Split, Progress, Nutrition, Profile. This overrides the PRD's Home contents (§6, SP-7, NT-3): today's workout and quick start move to the top of **Workout**, and the protein ring lives on **Nutrition**. | **Updated Nov 25:** Split moved under Workout (`/workout/split`, `/workout/library`, linked from a Plan section on Workout; old `/split` links redirect). The phone bar is now **Home · Workout · Progress · Nutrition** with no More sheet, and the sidebar is Home, Workout, Progress, Nutrition, Profile. The live workout's ⋯ menu resets the timer or discards the workout.
| A3 | **WK-5 previous performance** is a Phase 1 logging requirement but appears in Phase 2's "previous-session reference". | Build it in **Phase 1**. It's a small query against local history, and logging that is "two taps or fewer" depends on it to pre-fill sets. "Previous" = the most recent *completed* workout that contains that exercise, regardless of split day. |
| A4 | **Does a streak survive until today's workout is done?** | Yes. Streak = consecutive **local** dates with ≥1 workout, ending **today or yesterday**. If today has no workout yet, show the streak as *at risk* (not broken). It breaks only when neither today nor yesterday has a workout. |
| A5 | **Rest days vs streaks (new finding). Resolved Nov 25: rest days of the active split bridge the streak without counting.** Decision 21 defines a streak as consecutive *calendar* days, so anyone following a split with rest days (all six presets) loses their streak on every rest day. | Follow the PRD literally in v1, but keep it to a single pure function (`computeStreak`) so it can later become "consecutive *scheduled* days" or "rest days don't break it". **Flag for you to decide before Phase 3 (gamification).** |
| A6 | **"Previous record it beat" for most-reps-at-a-given-weight (PR-5).** | Pure function `previousRecord(pr, allPrs)`, computed and never stored, so edits and deletes stay consistent. It looks only at earlier PR entries (by `created_at`) for the same exercise **and the same type**. **Heaviest weight:** the earlier entry with the highest weight. **Most reps at weight:** the earlier entry *at the same weight* with the most reps. Weights match on kg rounded to 3 decimals; conversion is deterministic, so 225 lb always maps to the same kg. No earlier entry → "First record". Only PR entries are compared, never set logs (PR-1: no auto-detection). If the new entry doesn't beat the previous one, show a gentle "this doesn't beat 100 kg × 3 (Oct 3). Log anyway?" instead of blocking it. |
| A7 | **PR photos vs the private store and the 3-photo cap.** | PR photos go in the **same private bucket** under `{uid}/prs/{pr_id}.webp`, use the same compression, and are limited to **1 per PR**. They **don't count** toward the 3-per-day workout-photo cap, because CL-5 caps *workout-day* photos. The day log shows them as PR thumbnails, not in the photo gallery. |
| A8 | **Units: one switch or two?** P-6 says "kg/lb **and** cm/ft-in", but `User.unit_pref` is a single field. | Two independent preferences, `weight_unit` (kg/lb) and `length_unit` (cm/ft_in). The kg + ft-in combination is common (India, UK). The UI has a one-tap "Metric / Imperial" preset plus the two separate toggles. |
| A9 | **`Split.is_active` + "only one active".** Enforcing this with a unique index makes switching splits a two-step write, which goes wrong when queued offline. | Store `profiles.active_split_id` instead. Switching is then a single-row update and can't produce two active splits. `Split.is_preset` becomes `source_preset` (null = custom), and presets are **code-defined templates** copied into a user-owned split when chosen, so they're editable (SP-2). |
| A10 | **`SetLog.estimated_1rm` is stored**, yet the 1RM formula must be swappable and charts are derived. | **Drop the column.** 1RM is always computed by `estimateOneRepMax()`. A stored copy would go stale when the formula changes. |
| A11 | **`NutritionGoal.target` is stored**, yet the goal must recalculate when body weight changes. | For protein, the goal is **never stored as grams**: `goal(date) = bodyweight effective on date × multiplier effective on date`. The model stays generic with `basis = 'per_kg_bodyweight' \| 'absolute'`. Protein always uses `per_kg_bodyweight`, enforced by a DB check. Calories can later use `absolute` + `target`. |
| A12 | **Height storage (BV-3 / BodyVital.height).** | Current height lives on `profiles.height_cm`. Height history is optional per the PRD, so it's skipped in v1. Weight lives only in `body_vitals` (append-only dated entries). "Current weight" = the latest entry. |
| A13 | **Photos need a workout (CL-5 vs data model).** CL-5 says "add pictures to a workout day", but `WorkoutPhoto` has `workout_id`. | Photos attach to a workout, so a day with no workout has no photos. The 3-photo cap is **per local day across all workouts that day**, enforced by a DB trigger. Deleting a workout deletes its photos (rows and files). |
| A14 | **Starting a workout on the "wrong" day (WK-1).** Missed Monday's Push and want to do it Tuesday? | The Start screen defaults to today's split day but lets you pick any day of the active split, or Empty. |
| A15 | **In-progress workouts and sync.** | The in-progress workout lives **only in Dexie** (auto-saved on every change). On Finish, the whole workout (exercises, sets, events) is queued for sync. The server never holds half-finished workouts. Edits to past workouts sync row by row. |
| A16 | **Timer with pause (WK-2).** | Timer state is stored as timestamps (`startedAt`, `pausedAt`, `pausedMs`), not as a ticking counter, so it's correct after a crash. `duration_seconds` = active time, so it's ≤ `ended_at − started_at`. |
| A17 | **"Encrypted at rest" vs the offline cache.** Supabase encrypts at rest, but the IndexedDB copy on the device isn't encrypted. | Accept this for v1 (same as any PWA). **Wipe Dexie and the photo cache on sign-out and on account deletion.** |
| A18 | **Account deletion (P-5)** can't be done from the browser. Deleting the auth user requires the service role. | A Supabase **Edge Function `delete-account`** checks the caller's JWT, removes every storage object under `{uid}/`, then calls `auth.admin.deleteUser(uid)`. All tables cascade from `auth.users`. |
| A19 | **Age goes stale.** | Keep `age` as the PRD says (editable). Note it as a later candidate for `birth_year`. |
| A20 | **Bodyweight exercises and volume.** | `weight_kg` = *added* load (0 for plain push-ups), so volume is 0 for unweighted bodyweight work, which is consistent with the PRD formula. Revisit if users complain. |
| A21 | **Which offline writes?** The rules require offline *workout logging*. | Use **one write path for all user data**: Dexie first, then outbox, then Supabase. One pattern is simpler than two, and nutrition and vitals then work offline too. Only auth, onboarding and account deletion require a connection. |

---

## (b) Folder structure

```
pluto/
├─ CLAUDE.md
├─ docs/                     PRD.md, PLAN.md
├─ supabase/
│  ├─ migrations/            timestamped SQL (see section c)
│  └─ functions/delete-account/index.ts
├─ public/                   icons, fonts/ (self-hosted Inter woff2), robots.txt
├─ e2e/                      Playwright specs (onboarding, log-workout, offline, pr)
└─ src/
   ├─ main.tsx               providers (QueryClient, Router, Theme, MotionConfig)
   ├─ router.tsx             route table + guards (auth, onboarding)
   ├─ styles/globals.css     Tailwind + design tokens (CSS vars, light/dark)
   ├─ components/
   │  ├─ ui/                 shadcn components (generated, lightly edited)
   │  └─ layout/             AppShell, BottomNav, Sidebar, MoreSheet, PageTransition
   ├─ domain/                PURE functions only, no React/IO; each has a *.test.ts
   │  ├─ oneRepMax.ts        estimateOneRepMax (Epley), swappable
   │  ├─ units.ts            kg↔lb, cm↔ft-in, display formatting
   │  ├─ dates.ts            toLocalDate, addDays, month grid (local time)
   │  ├─ workoutStats.ts     workingSets, sessionStats, workoutSummary
   │  ├─ streak.ts           computeStreak, monthlyWorkoutCount
   │  ├─ chartSeries.ts      exerciseSeries(range), bodyweightSeries
   │  ├─ personalRecords.ts  previousRecord, beatsPrevious
   │  └─ nutrition.ts        proteinGoalFor(date), dailyTotal, suggestedMultiplier
   ├─ data/                  everything that touches storage
   │  ├─ supabase.ts         client (auth persistSession)
   │  ├─ db.ts               Dexie schema (mirrors tables + outbox, meta, activeWorkout, pendingUploads)
   │  ├─ sync/               outbox.ts, push.ts, pull.ts, engine.ts (online/visibility triggers)
   │  ├─ repos/              one file per entity: write Dexie + enqueue outbox + emit event
   │  ├─ media.ts            compressImage (canvas→webp), upload queue, signed-URL cache
   │  └─ presets.ts          6 preset split templates
   ├─ stores/                Zustand: activeWorkout (persisted to Dexie), ui (theme, sheets)
   ├─ features/              one folder per area: pages + components + query hooks
   │  ├─ auth/  onboarding/  home/  workout/  split/  library/
   │  ├─ progress/  calendar/  nutrition/  profile/
   ├─ lib/                   cn(), motion presets (spring configs), confetti wrapper
   └─ types/                 database.ts (generated by Supabase CLI), domain.ts
```

Rules: components never call Supabase directly. Reads of local data use `useLive()` (`src/lib/useLive.ts`, Dexie's built-in `liveQuery`), which re-renders on any change to the tables read, including sync pulls, so no manual invalidation. TanStack Query is kept for remote-only reads such as signed media URLs. Writes go through `data/repos/*` (Dexie transaction + outbox + event). Files stay small, roughly < 200 lines.

### Sync design (short)

- Every row has a **client-generated UUID**, so offline inserts need no server round-trip.
- `outbox` (FIFO): `{table, op: 'upsert'|'delete', rowId, payload}`. FIFO order keeps parents ahead of children.
- The engine runs on `online`, on `visibilitychange`, on a 30 s interval while visible, and right after each write. It pushes the outbox, then **pulls** each table `where updated_at > cursor` plus `sync_tombstones` since the cursor (deletes from other devices).
- Conflicts: last write wins. With a single user, multi-device conflicts are rare.
- Photos: the compressed blob is stored in Dexie `pendingUploads`, uploaded when online, and then the row is enqueued.

---

## (c) Supabase schema (SQL migrations)

Conventions: every user table has `user_id uuid not null default auth.uid()` and cascades from `auth.users`. Children use a **composite FK `(parent_id, user_id)`** so a row can never point at another user's parent. RLS is enabled on every table, and policies use `(select auth.uid())` for planner caching. Weights are in **kg**, height in **cm**. All `updated_at` values are set by trigger and used as sync cursors.

### 0001_helpers.sql

```sql
create or replace function public.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- Tombstones let other devices learn about hard deletes during pull.
-- No FK to auth.users on purpose: cascading account deletion would otherwise
-- fail when delete triggers insert here. delete-account cleans these up.
create table public.sync_tombstones (
  id          bigint generated always as identity primary key,
  user_id     uuid not null,
  table_name  text not null,
  row_id      uuid not null,
  deleted_at  timestamptz not null default now()
);
create index on public.sync_tombstones (user_id, deleted_at);
alter table public.sync_tombstones enable row level security;
create policy "tombstones: read own" on public.sync_tombstones
  for select to authenticated using (user_id = (select auth.uid()));

create or replace function public.record_tombstone() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.sync_tombstones (user_id, table_name, row_id)
  values (old.user_id, tg_table_name, old.id);
  return old;
end $$;
```

### 0002_profiles.sql

```sql
create table public.profiles (
  id               uuid primary key references auth.users(id) on delete cascade,
  name             text not null default '' check (char_length(name) <= 80),
  avatar_path      text,                                  -- storage path, private bucket
  age              smallint check (age between 13 and 120),
  height_cm        numeric(5,1) check (height_cm between 50 and 272),
  weight_unit      text not null default 'kg' check (weight_unit in ('kg','lb')),
  length_unit      text not null default 'cm' check (length_unit in ('cm','ft_in')),
  theme_pref       text not null default 'system' check (theme_pref in ('light','dark','system')),
  show_bmi         boolean not null default false,
  active_split_id  uuid,                                  -- FK added in 0004
  onboarded_at     timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
-- Email is read from the auth session (single source of truth), not duplicated here.

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
create policy "profiles: read own"   on public.profiles for select to authenticated
  using (id = (select auth.uid()));
create policy "profiles: update own" on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));
-- No insert/delete policies: created by trigger, deleted by cascade.

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', ''));
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create table public.body_vitals (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users(id) on delete cascade,
  measured_at  timestamptz not null default now(),
  local_date   date not null,
  weight_kg    numeric(6,3) not null check (weight_kg between 20 and 400),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index on public.body_vitals (user_id, measured_at desc);
create index on public.body_vitals (user_id, updated_at);
```

### 0003_library.sql

```sql
create table public.muscle_groups (
  id    smallint primary key,
  slug  text not null unique,
  name  text not null
);
insert into public.muscle_groups (id, slug, name) values
  (1,'chest','Chest'),(2,'back','Back'),(3,'shoulders','Shoulders'),
  (4,'biceps','Biceps'),(5,'triceps','Triceps'),(6,'forearms','Forearms'),
  (7,'quads','Quads'),(8,'hamstrings','Hamstrings'),(9,'glutes','Glutes'),
  (10,'calves','Calves'),(11,'abs_core','Abs/Core');

alter table public.muscle_groups enable row level security;
create policy "muscle_groups: read" on public.muscle_groups
  for select to authenticated using (true);

create table public.exercises (
  id                          uuid primary key default gen_random_uuid(),
  user_id                     uuid references auth.users(id) on delete cascade, -- null = built-in
  name                        text not null check (char_length(name) between 1 and 80),
  muscle_group_id             smallint not null references public.muscle_groups(id),
  secondary_muscle_group_ids  smallint[] not null default '{}',
  equipment                   text not null
                              check (equipment in ('barbell','dumbbell','machine','cable','bodyweight')),
  is_custom                   boolean generated always as (user_id is not null) stored,
  archived_at                 timestamptz,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);
create unique index exercises_unique_name on public.exercises
  (coalesce(user_id, '00000000-0000-0000-0000-000000000000'::uuid), lower(name));
create index on public.exercises (muscle_group_id);
create index on public.exercises (user_id, updated_at);

alter table public.exercises enable row level security;
create policy "exercises: read built-in and own" on public.exercises for select to authenticated
  using (user_id is null or user_id = (select auth.uid()));
create policy "exercises: insert own" on public.exercises for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "exercises: update own" on public.exercises for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "exercises: delete own" on public.exercises for delete to authenticated
  using (user_id = (select auth.uid()));
-- EL-6: workout_exercises / personal_records reference exercises with ON DELETE RESTRICT,
-- so the DB refuses to hard-delete a used exercise; the client archives (archived_at) instead.
```

`0010_seed_exercises.sql` contains the ~150 built-in exercises (`user_id = null`). It's a migration rather than `seed.sql` because production needs it too.

### 0004_splits.sql

```sql
create table public.splits (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name           text not null check (char_length(name) between 1 and 60),
  source_preset  text check (source_preset in ('ppl','upper_lower','full_body_3','bro','arnold','phul')),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (id, user_id)
);

create table public.split_days (
  id        uuid primary key default gen_random_uuid(),
  user_id   uuid not null default auth.uid() references auth.users(id) on delete cascade,
  split_id  uuid not null,
  weekday   smallint not null check (weekday between 1 and 7),  -- ISO: 1 = Monday
  label     text not null default '' check (char_length(label) <= 40),
  is_rest   boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (split_id, weekday),
  unique (id, user_id),
  foreign key (split_id, user_id) references public.splits(id, user_id) on delete cascade
);

create table public.split_day_exercises (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null default auth.uid() references auth.users(id) on delete cascade,
  split_day_id     uuid not null,
  exercise_id      uuid not null references public.exercises(id) on delete cascade,
  position         smallint not null check (position >= 0),
  target_sets      smallint check (target_sets between 1 and 20),
  target_reps_min  smallint check (target_reps_min between 1 and 100),
  target_reps_max  smallint check (target_reps_max between 1 and 100),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  check (target_reps_max is null or target_reps_min is null or target_reps_max >= target_reps_min),
  foreign key (split_day_id, user_id) references public.split_days(id, user_id) on delete cascade
);
create index on public.split_day_exercises (split_day_id, position);

alter table public.profiles
  add constraint profiles_active_split_fk
  foreign key (active_split_id, id) references public.splits(id, user_id)
  on delete set null (active_split_id);
```

### 0005_workouts.sql

```sql
create table public.workouts (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null default auth.uid() references auth.users(id) on delete cascade,
  split_day_id      uuid,
  title             text not null default '' check (char_length(title) <= 60), -- snapshot of day label
  local_date        date not null,                 -- user's local date at start (streaks, calendar)
  started_at        timestamptz not null,
  ended_at          timestamptz not null,
  duration_seconds  integer not null check (duration_seconds >= 0),  -- active time, excludes pauses
  notes             text check (char_length(notes) <= 2000),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  check (ended_at >= started_at),
  unique (id, user_id),
  foreign key (split_day_id, user_id) references public.split_days(id, user_id)
    on delete set null (split_day_id)
);
create index on public.workouts (user_id, local_date);
create index on public.workouts (user_id, updated_at);

create table public.workout_exercises (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users(id) on delete cascade,
  workout_id   uuid not null,
  exercise_id  uuid not null references public.exercises(id) on delete restrict,  -- EL-6
  position     smallint not null check (position >= 0),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (id, user_id),
  foreign key (workout_id, user_id) references public.workouts(id, user_id) on delete cascade
);
create index on public.workout_exercises (workout_id, position);
create index on public.workout_exercises (user_id, exercise_id);

create table public.set_logs (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null default auth.uid() references auth.users(id) on delete cascade,
  workout_exercise_id  uuid not null,
  set_number           smallint not null check (set_number >= 1),
  weight_kg            numeric(7,3) not null default 0 check (weight_kg between 0 and 1000), -- added load
  reps                 smallint not null check (reps between 1 and 1000),
  is_warmup            boolean not null default false,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  foreign key (workout_exercise_id, user_id)
    references public.workout_exercises(id, user_id) on delete cascade
);
create index on public.set_logs (workout_exercise_id, set_number);
-- No estimated_1rm column: derived by domain/oneRepMax.ts (see A10).
```

### 0006_prs_photos.sql

```sql
create table public.personal_records (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users(id) on delete cascade,
  exercise_id  uuid not null references public.exercises(id) on delete restrict,
  type         text not null check (type in ('heaviest_weight','most_reps_at_weight')),
  weight_kg    numeric(7,3) not null check (weight_kg between 0 and 1000),
  reps         smallint not null check (reps between 1 and 1000),
  note         text check (char_length(note) <= 500),
  photo_path   text,
  workout_id   uuid,                               -- set when logged mid-workout
  local_date   date not null,
  created_at   timestamptz not null default now(), -- device clock, never user-typed
  updated_at   timestamptz not null default now(),
  foreign key (workout_id, user_id) references public.workouts(id, user_id)
    on delete set null (workout_id)                -- PR-6: PRs survive workout deletion
);
create index on public.personal_records (user_id, exercise_id, created_at);

create table public.workout_photos (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users(id) on delete cascade,
  workout_id    uuid not null,
  local_date    date not null,                     -- copied from workout by trigger
  storage_path  text not null unique,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  foreign key (workout_id, user_id) references public.workouts(id, user_id) on delete cascade
);
create index on public.workout_photos (user_id, local_date);

create or replace function public.enforce_photo_cap() returns trigger
language plpgsql as $$
begin
  select w.local_date into new.local_date from public.workouts w where w.id = new.workout_id;
  if (select count(*) from public.workout_photos p
      where p.user_id = new.user_id and p.local_date = new.local_date and p.id <> new.id) >= 3 then
    raise exception 'photo_cap_reached' using errcode = 'P0001';
  end if;
  return new;
end $$;

create trigger workout_photos_cap before insert on public.workout_photos
  for each row execute function public.enforce_photo_cap();
```

### 0007_nutrition.sql

```sql
create table public.nutrition_goals (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null default auth.uid() references auth.users(id) on delete cascade,
  nutrient        text not null check (nutrient in ('protein','calories')),
  basis           text not null check (basis in ('per_kg_bodyweight','absolute')),
  multiplier      numeric(4,2) check (multiplier between 0.5 and 4.0),   -- g per kg bodyweight
  target          numeric(7,1) check (target > 0),                       -- only for 'absolute'
  goal_type       text check (goal_type in ('cut','maintain','bulk')),
  effective_from  date not null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (user_id, nutrient, effective_from),
  check ((basis = 'per_kg_bodyweight' and multiplier is not null and target is null)
      or (basis = 'absolute' and target is not null and multiplier is null)),
  check (nutrient <> 'protein' or basis = 'per_kg_bodyweight')  -- grams are never typed (NT-5)
);

create table public.nutrition_entries (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  local_date  date not null,
  nutrient    text not null check (nutrient in ('protein','calories')),
  amount      numeric(7,1) not null check (amount > 0),  -- g for protein, kcal for calories
  label       text check (char_length(label) <= 60),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index on public.nutrition_entries (user_id, local_date);
```

### 0008_events.sql

```sql
create table public.events (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users(id) on delete cascade,
  type         text not null check (type in
                 ('workout_completed','set_logged','pr_logged','protein_goal_met','photo_added')),
  payload      jsonb not null default '{}',
  created_at   timestamptz not null,               -- device time of the action
  received_at  timestamptz not null default now()
);
create index on public.events (user_id, created_at);

alter table public.events enable row level security;
create policy "events: read own"   on public.events for select to authenticated
  using (user_id = (select auth.uid()));
create policy "events: insert own" on public.events for insert to authenticated
  with check (user_id = (select auth.uid()));
-- Append-only: no update/delete policies, and privileges revoked as a second lock.
revoke update, delete on public.events from authenticated, anon;
-- Sync pushes events with ON CONFLICT (id) DO NOTHING (insert privilege only) so retries are idempotent.
```

### 0009_rls_and_triggers.sql (owner tables)

```sql
do $$
declare t text;
begin
  foreach t in array array[
    'body_vitals','splits','split_days','split_day_exercises','workouts','workout_exercises',
    'set_logs','personal_records','workout_photos','nutrition_goals','nutrition_entries'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format($p$create policy "%1$s: own rows" on public.%1$I for all to authenticated
                     using (user_id = (select auth.uid()))
                     with check (user_id = (select auth.uid()))$p$, t);
    execute format('create trigger %1$s_updated_at before update on public.%1$I
                    for each row execute function public.set_updated_at()', t);
    execute format('create trigger %1$s_tombstone after delete on public.%1$I
                    for each row execute function public.record_tombstone()', t);
  end loop;
end $$;

-- exercises have custom policies (0003) but share the triggers
create trigger exercises_updated_at before update on public.exercises
  for each row execute function public.set_updated_at();
create trigger exercises_tombstone after delete on public.exercises
  for each row when (old.user_id is not null) execute function public.record_tombstone();
```

### 0011_storage.sql

```sql
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('user-media', 'user-media', false, 2097152, array['image/webp','image/jpeg']);

-- Paths: {uid}/avatar/{id}.webp · {uid}/workouts/{workout_id}/{photo_id}.webp · {uid}/prs/{pr_id}.webp
create policy "media: read own" on storage.objects for select to authenticated
  using (bucket_id = 'user-media' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "media: insert own" on storage.objects for insert to authenticated
  with check (bucket_id = 'user-media' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "media: update own" on storage.objects for update to authenticated
  using (bucket_id = 'user-media' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'user-media' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "media: delete own" on storage.objects for delete to authenticated
  using (bucket_id = 'user-media' and (storage.foldername(name))[1] = (select auth.uid())::text);
-- Images are displayed via short-lived signed URLs, never public URLs.
```

### Edge Function: `delete-account`

1. Verify the caller's JWT and get `uid`.
2. List and remove all objects under `user-media/{uid}/` (Storage API; direct SQL deletes on `storage.objects` are blocked).
3. `auth.admin.deleteUser(uid)`. Every table cascades.
4. `delete from sync_tombstones where user_id = uid`.

The client then wipes Dexie and the caches and returns to `/auth`.

### Accepted v1 risks

- A user could reference *another* user's custom exercise ID in their own workout. FKs bypass RLS, but the IDs are random UUIDs and the only thing exposed would be an exercise name. Can be hardened later with a check trigger.
- The photo-cap trigger can race under truly concurrent inserts from two devices. Acceptable.

---

## (d) Phase-by-phase build plan

After each phase: `npm run typecheck && npm run lint && npm test` (plus `npm run test:e2e` once it exists), fix issues, and give you a manual test checklist. **No git actions:** the commit names below are only checkpoint labels, and you commit everything yourself at the end. Supabase wiring waits until you've reviewed the UI, which uses demo data until then.

### Phase 0: Scaffold (stop for review afterwards)

| Commit | Contents |
|---|---|
| `chore: scaffold vite react-ts app` | Vite + React + TS strict (`noUncheckedIndexedAccess` on), `@/` alias, ESLint (Vite template config), npm scripts |
| `chore: add tailwind and shadcn/ui` | Tailwind v4 via `@tailwindcss/vite`, shadcn init, base components (button, card, sheet, input, dialog) |
| `feat: design tokens and theme toggle` | CSS-variable tokens (neutral palette + one accent, radius, spacing) for light/dark; self-hosted Inter; ThemeProvider (localStorage now, `profiles.theme_pref` once auth exists); no flash on load |
| `feat: app shell with responsive navigation` | React Router routes with placeholder pages, BottomNav (5 + More sheet) on phones, Sidebar on ≥ md, animated page transitions, `MotionConfig reducedMotion="user"`, safe-area insets |
| `feat: pwa manifest and offline shell` | vite-plugin-pwa (`autoUpdate`, precached app shell, manifest, placeholder icons) |
| `chore: supabase client and env` | `src/data/supabase.ts`, `.env.example`, Zod-validated env |
| `test: vitest and playwright setup` | One sample unit test, one Playwright smoke test (shell renders, nav works, theme toggles) |

### Phase 1: MVP

**Phase 1a (done):** auth, onboarding, profile, body vitals, units, theme sync, sign-out, delete account. Migrations are timestamped files in `supabase/migrations/` and are added per feature, not all at once: `…01_helpers`, `…02_profiles_vitals` (RLS and triggers for `body_vitals` are inline, so the later RLS loop omits it), `…03_storage`. Browser tests run against an in-memory fake of the Supabase HTTP API (`e2e/support/fakeSupabase.ts`).

**Phase 1b (done):** exercise library and splits. Migrations `20261125…01_library`, `…02_seed_exercises` (150 built-ins) and `…03_splits`. Built-in exercises ship in the bundle (`src/data/library/builtinExercises.ts`) with stable UUIDv5 ids that match the seed row for row (a unit test checks this), so the library and presets work offline. Only custom exercises sync. Presets are code templates (`src/data/presets.ts`) copied into a user-owned split. Your first split becomes active automatically, and later ones wait for "Make active". Today's workout from the active split is shown at the top of **Workout** (A2), not Home.

**Phase 1c (done):** workout logging. Migrations `20261126…01_workouts` and `…02_events`. The in-progress workout is a Zustand store written through to Dexie (`activeWorkout`) on every change; it reaches the outbox only on Finish, as one transaction: workout, then exercises, then sets, then events (`set_logged` per logged set, using the time it was ticked, and `workout_completed` with the summary). Events go out with `ON CONFLICT DO NOTHING`. Unticked rows are left out of the saved workout. Typing a weight or reps fills the empty, unlogged rows below it. Set numbers count working sets; warm-ups show as "W". Past workouts are edited through the same logger and saved as a row-level diff (`diffWorkout`). Home now reads real workouts, and the demo data is gone.

**Phase 1d (done):** calendar photos and protein. Migrations `20261127…01_workout_photos` (3-per-local-day cap trigger) and `…02_nutrition`. Photos attach to the day's latest workout (A13). They're compressed to ≤ 1600 px (WebP, or JPEG on Safari), shown from the local blob until uploaded, then through signed URLs. They're queued as upload → row → `photo_added` event. If the server rejects a 4th photo (another device filled the day), the push drops the row and removes the file. Deleting a workout also removes its photo files. Protein: `goal(date) = weightOn(date) × multiplier effective on date` (`src/domain/nutrition.ts`). Days before any goal use maintain 1.6, and onboarding now creates that row. A second goal change on the same day replaces that day's row. Quick-add chips repeat the user's recent entries. `protein_goal_met` is emitted once per day per device (a Dexie meta flag). `useToday()` re-renders at local midnight. The ring is on Nutrition only (A2 keeps Home calendar-only, although NT-1/NT-3 say Home too).

| Commit | Contents |
|---|---|
| `feat(db): initial schema, rls and storage` | Migrations 0001–0009, 0011; generated `types/database.ts` |
| `feat(db): seed exercise library` | 0010, ~150 exercises across 11 muscle groups |
| `feat(domain): units, dates, 1RM, stats, streak, nutrition` | Pure functions + Vitest (local-date edge cases: DST, midnight, month boundaries; warm-ups excluded) |
| `feat(data): dexie store and sync engine` | Dexie schema, outbox, push/pull, tombstones, event emitter, tests |
| `feat(auth): email/password sign-up and sign-in` | `/auth`, session persistence, route guards |
| `feat(onboarding): profile and body vitals steps` | Name, avatar (compressed, camera/gallery), age/weight/height/units. The default protein goal (maintain 1.6) is created with the nutrition feature, since its table doesn't exist yet |
| `feat(profile): profile, vitals, units, theme, sign-out, delete account` | Weight history list, BMI toggle, `delete-account` Edge Function |
| `feat(library): browse, search, filter, custom exercises, archive` | |
| `feat(split): presets, custom builder, drag reorder, activate` | 6 preset templates, Motion `Reorder` + move up/down for keyboard users |
| `feat(workout): today's split day and quick start at top of Workout` | (moved off Home, see A2) |
| `feat(workout): logging with timer and auto-save` | Start (today / pick day / empty), pause/resume timer, 2-tap set logging (pre-filled row + ✓), warm-up flag, previous performance (A3), add/remove/reorder exercises, notes, crash recovery |
| `feat(workout): finish summary, history, edit and delete` | |
| `feat(home): calendar month grid, streak, day log` | Home *is* the calendar (A2). Animated cell fill, prev/next month |
| `feat(calendar): workout photos with cap and gallery` | Compression, upload queue, signed URLs, delete |
| `feat(nutrition): protein goal, quick-add, ring, history` | Multiplier editor (no gram input), goal type pre-fill, `protein_goal_met` event once per day |
| `test(e2e): onboarding, offline workout logging, calendar` | |

### Phase 2: Progress & PRs

**Phase 2 (done):** migration `20261128…01_personal_records`. Charts are pure series (`src/domain/chartSeries.ts`): one point per session from working sets (top weight, volume, best Epley 1RM), body weight as the last weigh-in per day, ranges back by whole months with month-end clamping. They're drawn in Recharts with a single validated chart token (`--chart-1`: L 0.56 light, 0.66 dark), plus a table view. Progress is lazy-loaded so Recharts stays out of the main bundle. PRs: `created_at` is set from the device clock at logging time and sent explicitly. `previousRecord`/`beatsPrevious` are computed per A6; a non-beating entry asks "Log anyway". A PR logged mid-workout is saved without `workout_id` (the workout isn't on the server yet) and patched on Finish. Deleting a workout nulls `workout_id` locally. Confetti is skipped under reduced motion. The Home day sheet also shows that day's PRs and protein.

| Commit | Contents |
|---|---|
| `feat(domain): chart series and previous-record` | `exerciseSeries`, `bodyweightSeries`, `previousRecord` + tests |
| `feat(progress): exercise charts and body weight chart` | Recharts, range tabs (1M/3M/6M/1Y/All), unit-aware axes |
| `feat(pr): manual PR logging with celebration` | Form (exercise, type, weight, reps, note, photo; date from the device), canvas-confetti + bounce, mid-workout entry → shows in summary |
| `feat(pr): PR list with previous record, edit and delete` | |
| `feat(calendar): show PRs in day log` | |
| `test(e2e): log a PR mid-workout` | |

### Phase 3 (as run): polish pass (done)

The PRD's Phase 3 (gamification, expanded nutrition) stays out of v1. This phase was a quality pass instead.

- **Load (< 2 s):**
  - **Startup:** sign-in ships alone in the main bundle. The shell and every screen, Home included, are lazy chunks: precached by the service worker, and prefetched when idle after sign-in so the whole app works offline in the first session.
  - **Session restore:** the session is restored from the device (Supabase's stored token plus the Dexie profile) before Supabase's code loads, which is idle-loaded.
  - **Lighter first screen:** sign-in and its controls (segmented pill, field errors, theme toggle, card slide) use CSS instead of Motion. Startup JS went from about 280 KB to 180 KB gzip.
  - **Font:** Latin-only Inter with `font-display: optional`.
  - **Lighthouse (mobile, simulated slow 4G):** performance 94–97, accessibility 100, best practices 100, SEO 100. LCP 1.0 s, CLS 0.
  - **Measured with applied throttling and 4× CPU (`npm run test:perf`):** first visit about 1.3–1.5 s on typical 4G and about 2.2 s on slow 4G; an installed or returning start takes about 1.1–1.3 s on slow 4G.
- **Accessibility (`e2e/a11y.spec.ts`):**
  - axe WCAG 2.2 AA in light and dark on every screen, sign-in and onboarding included.
  - Tap targets ≥ 44 px at 360 px. Small controls get an `::after` hit area; calendar cells extend into their gaps.
  - Reflow at 320 px and at 125 % text. The set row uses `minmax` columns.
  - Contrast: new `--primary-hover` and `--primary-ink` tokens (button hover was 4.07:1).
  - Labels: visible text matches accessible names.
  - Global `prefers-reduced-motion` CSS, on top of `MotionConfig`.
- **PWA (`e2e/pwa.spec.ts`, production build):**
  - Manifest with 192/512 and maskable icons; the service worker controls the page.
  - Cold offline start, with every screen reachable offline.
  - Offline banner and a Profile install card (`beforeinstallprompt`, iOS hint).
  - A route error screen for a screen that's not downloaded yet.
  - Lighthouse 13 has no PWA category any more, so these tests are the installability audit.
- **Loading states:** skeletons that appear only after 150 ms, and a splash for cold deep links. The Progress page has an empty state.
- **Journeys (`e2e/journeys.spec.ts`):**
  - Onboarding with photo and imperial units.
  - Split → two-tap workout → mid-workout PR → summary, calendar and progress, including the server rows and events.

**Appearance (migration `20261130…01_profile_background`):**
- **Where:** a Profile "Appearance" card with Light / Dark / System, plus an optional background pattern (Plain, Gym floor, Plates, Dumbbells, Kettlebells, Mixed).
- **How the patterns are drawn:** SVG tiles (`src/lib/backgrounds.ts`) used as a CSS mask over a fixed layer in the text color at 5 % (light) or 7 % (dark). They follow the theme, stay behind opaque cards, and the axe audit runs with the busiest pattern on.
- **Persistence:** the choice is saved in `profiles.background` and synced by `ThemeSync`, like `theme_pref`.

**RLS review (migration `20261129…01_security_hardening`, guarded by `src/data/rls.test.ts`):**
- **Already in place:** all 16 public tables have RLS. Every policy is `to authenticated` with `user_id = (select auth.uid())` and `with check` on writes. Events are append-only (no update or delete policy, privileges revoked). Profiles have no insert or delete policies. The media bucket is private with `{uid}/` path policies, a 2 MB limit and WebP/JPEG only.
- **Added in this migration:**
  - A trigger rejects references to another user's custom exercise (closes the accepted v1 risk).
  - Media paths must start with the owner's id.
  - `search_path` is pinned on all functions.
  - EXECUTE is revoked on the SECURITY DEFINER trigger functions.
  - Event payloads are capped at 4 KB.

### What's left against the PRD

| Item | Status |
|---|---|
| PRD Phase 3: gamification (XP, badges), calories and food logging, reminders | Not built, by design. The events table, `computeStreak` and the generic nutrition model are ready for them. |
| Home contents (PRD §6, NT-1/3, SP-7) | Changed by decision A2: Home is the calendar. Today's workout is on Workout, and the ring is on Nutrition (plus each day's protein in the day sheet). |
| Data export | Deferred by the PRD. |
| Same field edited on two devices | Last write wins. Edits send only the changed fields, so different fields edited on two devices both survive. Accepted for a single-user app. |
| CAPTCHA on sign-up | Not built. Add (Turnstile) if bots appear; see LAUNCH.md. |
| Slow-4G first visit | About 2.2 s cold, under 2 s on typical 4G. Next step if needed: `LazyMotion` in the shell. |
| Screen readers | Automated checks only. A manual VoiceOver/TalkBack pass is still to do. |
| Calendar cells at 320 px | About 39 px (44 px from 360 px wide). Above WCAG's 24 px minimum. |

**Resolved after Phase 3:**
- **Longest streak on Home (Nov 26):** a card under the streak and month tiles shows the best run ever, with its first and last workout dates, and a "Current" badge when it's the run you're on. `longestStreak()` in `src/domain/streak.ts` uses the same rule as `computeStreak` (scheduled rest days bridge without counting; ties go to the most recent run). It uses the active split's rest days for all history, so switching splits can change old streaks. Hidden until you have a workout.
- **Volume removed everywhere (Nov 26):** the user dropped volume (Σ weight × reps), overriding WK-7 and the PRD's Volume chart. The workout summary shows duration, exercises and sets. Progress charts top weight and 1RM. History rows show duration and sets. `workout_completed` events no longer carry a volume figure.
- **Rest days (A5):** a scheduled rest day of the active split bridges the streak without counting. A rest-day workout counts. Today being a rest day shows "streak safe".
- **Height history:** dropped; height rarely changes.
- **Passwords:** forgot password (email link → `/reset-password`), and change password (re-authenticates with the current one).
- **Rejected changes:** a change the server permanently refuses (22xxx/23xxx/42501/P0001, storage 4xx) is set aside in `syncFailures`. The row is restored from the server, the queue continues, and Profile lists what wasn't saved.
- **Tombstone retention:** a nightly `pg_cron` job prunes sync tombstones older than 90 days. A device whose last pull is older than 80 days re-downloads everything (its outbox is kept).
- **Database types:** generated (`npm run db:types`), with a compile-time column-drift guard (`src/data/schemaDrift.ts`).
- **Launch:**
  - A production-only CSP with hashed inline scripts.
  - Hosting configs for Vercel, Netlify and Cloudflare Pages.
  - Email confirmation links now sign the user straight in.
  - The checklist in [LAUNCH.md](LAUNCH.md).

### Phase 3: Not in v1 scope

Gamification and expanded nutrition are **not built**. What's in place for them: the `events` table, `computeStreak`, a generic nutrition model, and `basis='absolute'` goals for calories.
