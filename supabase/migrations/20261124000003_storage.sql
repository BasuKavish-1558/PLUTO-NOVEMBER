insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('user-media', 'user-media', false, 2097152, array['image/webp','image/jpeg']);

-- Paths: {uid}/avatar/{id}.webp · {uid}/workouts/{workout_id}/{photo_id}.webp · {uid}/prs/{pr_id}.webp
create policy "media: read own" on storage.objects for select to authenticated
  using (bucket_id = 'user-media' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "media: insert own" on storage.objects for insert to authenticated
  with check (bucket_id = 'user-media' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "media: update own" on storage.objects for update to authenticated
  using (bucket_id = 'user-media' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'user-media' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "media: delete own" on storage.objects for delete to authenticated
  using (bucket_id = 'user-media' and (storage.foldername(name))[1] = (select auth.uid())::text);
-- Images are displayed via short-lived signed URLs, never public URLs.
