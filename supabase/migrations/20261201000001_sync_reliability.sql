-- Tombstones only need to outlive the longest a device stays offline. Devices whose last sync is
-- older than 80 days re-download everything (src/data/sync/pull.ts), so 90 days is enough.
create extension if not exists pg_cron with schema pg_catalog;

select cron.schedule(
  'prune-sync-tombstones',
  '17 3 * * *', -- daily, 03:17 UTC
  $$ delete from public.sync_tombstones where deleted_at < now() - interval '90 days' $$
);
