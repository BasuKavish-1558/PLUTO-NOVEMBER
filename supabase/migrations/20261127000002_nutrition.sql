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
create index on public.nutrition_goals (user_id, updated_at);

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
create index on public.nutrition_entries (user_id, updated_at);

do $$
declare t text;
begin
  foreach t in array array['nutrition_goals','nutrition_entries'] loop
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
