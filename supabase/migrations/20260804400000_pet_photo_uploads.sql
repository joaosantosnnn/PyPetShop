-- PetShop: fotos de pets enviadas pelos dispositivos da equipe.
begin;

alter table public.pets add column if not exists photo_path text;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('pet-photos','pet-photos',false,5242880,array['image/jpeg','image/png','image/webp'])
on conflict(id) do update set
  public=excluded.public,
  file_size_limit=excluded.file_size_limit,
  allowed_mime_types=excluded.allowed_mime_types;

drop policy if exists pet_photos_insert on storage.objects;
create policy pet_photos_insert on storage.objects
for insert to authenticated
with check(
  bucket_id='pet-photos'
  and exists(
    select 1 from public.profiles p
    where p.id=(select auth.uid()) and p.is_active
      and p.company_id::text=(storage.foldername(name))[1]
      and p.role=any(array['proprietario','administrador','gerente','atendente','banhista','tosador'])
  )
);

drop policy if exists pet_photos_select on storage.objects;
create policy pet_photos_select on storage.objects
for select to authenticated
using(
  bucket_id='pet-photos'
  and exists(
    select 1 from public.profiles p
    where p.id=(select auth.uid()) and p.is_active
      and p.company_id::text=(storage.foldername(name))[1]
  )
);

drop policy if exists pet_photos_update on storage.objects;
create policy pet_photos_update on storage.objects
for update to authenticated
using(
  bucket_id='pet-photos' and owner_id=(select auth.uid())::text
)
with check(
  bucket_id='pet-photos' and owner_id=(select auth.uid())::text
);

drop policy if exists pet_photos_delete on storage.objects;
create policy pet_photos_delete on storage.objects
for delete to authenticated
using(
  bucket_id='pet-photos' and owner_id=(select auth.uid())::text
);

commit;
