-- ============================================================
-- Session event images
-- ============================================================

alter table sessions
  add column if not exists image_url text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'session-images',
  'session-images',
  true,
  5242880,
  array['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do nothing;

drop policy if exists "session_images_public_read" on storage.objects;
create policy "session_images_public_read" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'session-images');

drop policy if exists "session_images_auth_insert" on storage.objects;
create policy "session_images_auth_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'session-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "session_images_auth_update" on storage.objects;
create policy "session_images_auth_update" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'session-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "session_images_auth_delete" on storage.objects;
create policy "session_images_auth_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'session-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
