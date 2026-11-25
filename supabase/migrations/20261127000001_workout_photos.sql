create table public.workout_photos (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users(id) on delete cascade,
  workout_id    uuid not null,
  local_date    date not null,                     -- copied from the workout by trigger
  storage_path  text not null unique,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  foreign key (workout_id, user_id) references public.workouts(id, user_id) on delete cascade
);
create index on public.workout_photos (user_id, local_date);
create index on public.workout_photos (user_id, updated_at);

-- CL-5: at most 3 photos per local day across all of that day's workouts (PLAN A13).
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

alter table public.workout_photos enable row level security;
create policy "workout_photos: own rows" on public.workout_photos for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create trigger workout_photos_updated_at before update on public.workout_photos
  for each row execute function public.set_updated_at();
create trigger workout_photos_tombstone after delete on public.workout_photos
  for each row execute function public.record_tombstone();
