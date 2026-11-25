-- Phase 3 security review. Applied migrations are never edited; these tighten them.

-- 1. Foreign keys bypass RLS, so a row could reference another user's *custom* exercise by id
--    (formerly an accepted v1 risk). Only built-ins (user_id null) and the user's own are allowed.
--    Runs as the invoker: RLS on exercises already hides other users' rows from this lookup.
create or replace function public.check_exercise_access() returns trigger
language plpgsql set search_path = '' as $$
begin
  if not exists (
    select 1 from public.exercises e
    where e.id = new.exercise_id and (e.user_id is null or e.user_id = new.user_id)
  ) then
    raise exception 'exercise_not_accessible' using errcode = '42501';
  end if;
  return new;
end $$;

create trigger workout_exercises_exercise_access before insert or update of exercise_id on public.workout_exercises
  for each row execute function public.check_exercise_access();
create trigger split_day_exercises_exercise_access before insert or update of exercise_id on public.split_day_exercises
  for each row execute function public.check_exercise_access();
create trigger personal_records_exercise_access before insert or update of exercise_id on public.personal_records
  for each row execute function public.check_exercise_access();

-- 2. Media paths must live in the owner's own folder of the private bucket.
alter table public.profiles
  add constraint profiles_avatar_path_own check (avatar_path is null or avatar_path like id::text || '/%');
alter table public.workout_photos
  add constraint workout_photos_path_own check (storage_path like user_id::text || '/%');
alter table public.personal_records
  add constraint personal_records_photo_path_own check (photo_path is null or photo_path like user_id::text || '/%');

-- 3. Pin search_path on the remaining functions (Supabase linter: function_search_path_mutable).
alter function public.set_updated_at() set search_path = '';
alter function public.enforce_photo_cap() set search_path = '';

-- 4. Trigger functions can't be called directly, but SECURITY DEFINER ones shouldn't even be
--    executable by API roles. Triggers keep firing: EXECUTE is checked when a trigger is created, not fired.
revoke execute on function public.record_tombstone() from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- 5. Append-only events can't be edited away, so cap their size instead.
alter table public.events
  add constraint events_payload_size check (octet_length(payload::text) <= 4096);
