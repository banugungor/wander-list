-- Run this once in the Supabase SQL editor (Database > SQL Editor), after
-- suggestions_schema.sql. Safe to re-run: every statement is idempotent.
--
-- Private storage bucket for the photo a user can attach to a suggestion
-- (suggestions.image_path, see suggestions_schema.sql). Unlike
-- content-images (public, admin-only writes — content_images_bucket.sql),
-- nothing here is shown in the app: users can only UPLOAD into their own
-- `<user_id>/` folder, can't read, replace or delete anything afterwards, and
-- only the admin account (policy in admin_panel_policies.sql) can view the
-- files. A good photo is re-uploaded by hand into content-images /
-- heritage_images from the admin panel.
--
-- Limits are enforced by the bucket itself, not just the app: 5 MB per file,
-- JPEG/PNG/WebP only (the app sends a ~1600px JPEG, see
-- data/suggestionPhoto.ts).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'suggestion-images',
  'suggestion-images',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Users can upload own suggestion images" on storage.objects;
create policy "Users can upload own suggestion images"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'suggestion-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
