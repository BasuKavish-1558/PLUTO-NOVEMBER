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
  active_split_id  uuid,                                  -- FK added with the splits migration
  onboarded_at     timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
-- Email is read from the auth session (single source of truth), not duplicated here.

create index on public.profiles (updated_at);
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
create policy "profiles: read own" on public.profiles for select to authenticated
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

alter table public.body_vitals enable row level security;
create policy "body_vitals: own rows" on public.body_vitals for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create trigger body_vitals_updated_at before update on public.body_vitals
  for each row execute function public.set_updated_at();
create trigger body_vitals_tombstone after delete on public.body_vitals
  for each row execute function public.record_tombstone();
