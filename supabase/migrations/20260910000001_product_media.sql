alter table products add column video_url text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-media', 'product-media', true, 52428800,
  array['image/jpeg','image/png','image/webp','video/mp4','video/webm']
)
on conflict (id) do nothing;

-- No insert/update/delete policy added for storage.objects: all writes go
-- through /api/admin/products/[id]/media using the service-role client,
-- which bypasses RLS entirely. public = true means downloads are served
-- directly by the Storage API with no select policy needed.
