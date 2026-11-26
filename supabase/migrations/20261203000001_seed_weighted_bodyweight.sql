-- Weighted versions of bodyweight lifts, as separate built-in exercises (the plain Pull-Up and
-- dips log reps only). Same ids as src/data/library/builtinExercises.ts.
insert into public.exercises (id, name, muscle_group_id, secondary_muscle_group_ids, equipment) values
  ('bf323334-f1e1-5084-9bd9-94ddbf1baec2', 'Weighted Pull-Up',      2, '{4}',   'bodyweight'),
  ('4fb92502-3076-5611-9c76-0c0584d2cf42', 'Weighted Chest Dip',    1, '{5,3}', 'bodyweight'),
  ('b65792fc-76d6-593e-af3e-9395c251bfee', 'Weighted Triceps Dip',  5, '{1,3}', 'bodyweight')
on conflict (id) do nothing;
