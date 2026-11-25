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
