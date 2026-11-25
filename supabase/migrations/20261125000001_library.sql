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

create trigger exercises_updated_at before update on public.exercises
  for each row execute function public.set_updated_at();
create trigger exercises_tombstone after delete on public.exercises
  for each row when (old.user_id is not null) execute function public.record_tombstone();
