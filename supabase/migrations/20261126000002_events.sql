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
-- The client pushes events with ON CONFLICT (id) DO NOTHING (insert privilege only),
-- so retries after a lost response are idempotent.
