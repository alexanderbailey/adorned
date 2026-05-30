-- ============================================================
-- Storage: public reads, owner-scoped writes
-- ============================================================
-- Buckets (items, inspo, body) become public so that getPublicUrl() works
-- for browser <img> loads and for Claude vision URL fetches.
-- Writes are restricted by RLS to objects under `{auth.uid()}/...` — i.e.
-- a user can only insert/update/delete their own folder.
--
-- Run idempotently — safe to re-apply.

update storage.buckets set public = true where id in ('items', 'inspo', 'body');

drop policy if exists "owner can write own folder"  on storage.objects;
drop policy if exists "owner can update own folder" on storage.objects;
drop policy if exists "owner can delete own folder" on storage.objects;

create policy "owner can write own folder"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id in ('items', 'inspo', 'body')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "owner can update own folder"
  on storage.objects for update
  to authenticated
  using (
    bucket_id in ('items', 'inspo', 'body')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "owner can delete own folder"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id in ('items', 'inspo', 'body')
    and (storage.foldername(name))[1] = auth.uid()::text
  );
