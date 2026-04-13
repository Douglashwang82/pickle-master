-- ============================================================
-- Storage bucket: club-covers
-- ============================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'club-covers',
  'club-covers',
  true,
  5242880, -- 5 MB
  array['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do nothing;

-- ============================================================
-- Storage RLS policies for club-covers
-- ============================================================

-- Anyone can read (public bucket, covers are not sensitive)
drop policy if exists "club_covers_public_read" on storage.objects;
create policy "club_covers_public_read" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'club-covers');

-- Authenticated users can upload to their own folder: {auth_uid}/...
drop policy if exists "club_covers_auth_insert" on storage.objects;
create policy "club_covers_auth_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'club-covers'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can overwrite/update their own files
drop policy if exists "club_covers_auth_update" on storage.objects;
create policy "club_covers_auth_update" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'club-covers'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can delete their own files
drop policy if exists "club_covers_auth_delete" on storage.objects;
create policy "club_covers_auth_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'club-covers'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
