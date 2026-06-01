-- ============================================================
-- Phase 2: AI lookbook
-- ============================================================
-- Adds a column on outfits for the rendered lookbook URL, and a new
-- public-read / owner-write storage bucket for the generated images.

alter table public.outfits
  add column if not exists lookbook_url text;

-- Storage bucket
insert into storage.buckets (id, name, public)
values ('lookbooks', 'lookbooks', true)
on conflict (id) do update set public = excluded.public;

-- Policies on storage.objects already exist for items/inspo/body; extend
-- them to cover lookbooks too. We drop and recreate so they include the
-- new bucket in the bucket_id list.
drop policy if exists "owner can write own folder"  on storage.objects;
drop policy if exists "owner can update own folder" on storage.objects;
drop policy if exists "owner can delete own folder" on storage.objects;
drop policy if exists "ULTRA OPEN insert" on storage.objects;
drop policy if exists "ULTRA OPEN update" on storage.objects;
drop policy if exists "ULTRA OPEN delete" on storage.objects;

create policy "owner can write own folder"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id in ('items', 'inspo', 'body', 'lookbooks')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "owner can update own folder"
  on storage.objects for update
  to authenticated
  using (
    bucket_id in ('items', 'inspo', 'body', 'lookbooks')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "owner can delete own folder"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id in ('items', 'inspo', 'body', 'lookbooks')
    and (storage.foldername(name))[1] = auth.uid()::text
  );
