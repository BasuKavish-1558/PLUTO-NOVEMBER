-- Timed exercises (Dead Hang): a set records how long the hold lasted. Bodyweight exercises log
-- reps only (weight_kg stays 0), which the existing columns already allow.
--
-- A timed set is stored as ONE rep plus its duration, so reps stays a required, positive number
-- everywhere else (set counts, history, edits) and only timed sets carry a duration.
alter table public.set_logs
  add column duration_seconds integer check (duration_seconds between 1 and 3600);

alter table public.set_logs
  add constraint set_logs_timed_is_one_rep check (duration_seconds is null or reps = 1);

-- Personal records: a third type, "longest hold", for timed exercises.
alter table public.personal_records
  add column duration_seconds integer check (duration_seconds between 1 and 3600);

alter table public.personal_records drop constraint personal_records_type_check;
alter table public.personal_records
  add constraint personal_records_type_check
  check (type in ('heaviest_weight', 'most_reps_at_weight', 'longest_hold'));

-- A hold record has a duration (and is one rep); no other type has one.
alter table public.personal_records
  add constraint personal_records_hold_has_duration
  check ((type = 'longest_hold') = (duration_seconds is not null) and (type <> 'longest_hold' or reps = 1));
