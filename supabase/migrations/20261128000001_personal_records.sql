create table public.personal_records (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users(id) on delete cascade,
  exercise_id  uuid not null references public.exercises(id) on delete restrict,  -- EL-6
  type         text not null check (type in ('heaviest_weight','most_reps_at_weight')),
  weight_kg    numeric(7,3) not null check (weight_kg between 0 and 1000),
  reps         smallint not null check (reps between 1 and 1000),
  note         text check (char_length(note) <= 500),
  photo_path   text,                               -- {uid}/prs/{id}.webp, 1 per PR, outside the day cap
  workout_id   uuid,                               -- set when logged mid-workout
  local_date   date not null,
  created_at   timestamptz not null default now(), -- device clock, never user-typed
  updated_at   timestamptz not null default now(),
  foreign key (workout_id, user_id) references public.workouts(id, user_id)
    on delete set null (workout_id)                -- PR-6: PRs survive workout deletion
);
create index on public.personal_records (user_id, exercise_id, created_at);
create index on public.personal_records (user_id, updated_at);

alter table public.personal_records enable row level security;
create policy "personal_records: own rows" on public.personal_records for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create trigger personal_records_updated_at before update on public.personal_records
  for each row execute function public.set_updated_at();
create trigger personal_records_tombstone after delete on public.personal_records
  for each row execute function public.record_tombstone();
