-- Vigia Cloud: white-label logo storage.
-- Applied to Supabase project tegwpmtylwivktuuktpo on 2026-09-22.

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values (
  'branding','branding',true,524288,
  array['image/png','image/jpeg','image/webp']
)
on conflict (id) do update
set public=true,
    file_size_limit=524288,
    allowed_mime_types=array['image/png','image/jpeg','image/webp'];

drop policy if exists branding_select on storage.objects;
create policy branding_select
on storage.objects for select to authenticated
using (bucket_id='branding');

drop policy if exists branding_insert on storage.objects;
create policy branding_insert
on storage.objects for insert to authenticated
with check (
  bucket_id='branding'
  and (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
  and (
    private.is_platform_admin()
    or private.reseller_role(((storage.foldername(name))[1])::uuid) in ('owner','admin')
  )
);

drop policy if exists branding_update on storage.objects;
create policy branding_update
on storage.objects for update to authenticated
using (
  bucket_id='branding'
  and (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
  and (
    private.is_platform_admin()
    or private.reseller_role(((storage.foldername(name))[1])::uuid) in ('owner','admin')
  )
)
with check (
  bucket_id='branding'
  and (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
  and (
    private.is_platform_admin()
    or private.reseller_role(((storage.foldername(name))[1])::uuid) in ('owner','admin')
  )
);

drop policy if exists branding_delete on storage.objects;
create policy branding_delete
on storage.objects for delete to authenticated
using (
  bucket_id='branding'
  and (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
  and (
    private.is_platform_admin()
    or private.reseller_role(((storage.foldername(name))[1])::uuid) in ('owner','admin')
  )
);
