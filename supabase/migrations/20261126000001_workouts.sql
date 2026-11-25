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
create index on public.workout_exercises (user_id, updated_at);

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
create index on public.set_logs (user_id, updated_at);
-- No estimated_1rm column: derived by domain/oneRepMax.ts (see PLAN A10).

do $$
declare t text;
begin
  foreach t in array array['workouts','workout_exercises','set_logs'] loop
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
