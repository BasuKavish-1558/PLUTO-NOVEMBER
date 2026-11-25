create table public.splits (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name           text not null check (char_length(name) between 1 and 60),
  source_preset  text check (source_preset in ('ppl','upper_lower','full_body_3','bro','arnold','phul')),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (id, user_id)
);
create index on public.splits (user_id, updated_at);

create table public.split_days (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  split_id   uuid not null,
  weekday    smallint not null check (weekday between 1 and 7),  -- ISO: 1 = Monday
  label      text not null default '' check (char_length(label) <= 40),
  is_rest    boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (split_id, weekday),
  unique (id, user_id),
  foreign key (split_id, user_id) references public.splits(id, user_id) on delete cascade
);
create index on public.split_days (user_id, updated_at);

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
create index on public.split_day_exercises (user_id, updated_at);

-- One active split per user, as a single column (switching is one write; see PLAN A9).
alter table public.profiles
  add constraint profiles_active_split_fk
  foreign key (active_split_id, id) references public.splits(id, user_id)
  on delete set null (active_split_id);

do $$
declare t text;
begin
  foreach t in array array['splits','split_days','split_day_exercises'] loop
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
