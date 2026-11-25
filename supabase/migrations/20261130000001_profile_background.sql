-- Appearance: an optional, minimal gym line pattern behind the app (synced like theme_pref).
alter table public.profiles
  add column background text not null default 'none'
  check (background in ('none','floor','plates','dumbbells','kettlebells','mixed'));
