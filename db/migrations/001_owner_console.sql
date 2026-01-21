-- Owner console RPCs, RLS tweaks, and grants

create or replace function public.claim_tag(public_code text, pin text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tag record;
  v_tag_id uuid;
begin
  select *
    into v_tag
    from public.tags
   where tags.public_code = claim_tag.public_code
     and tags.status = 'unclaimed'
   limit 1;

  if v_tag is null then
    raise exception 'Tag not found or already claimed' using errcode = '22023';
  end if;

  if v_tag.pin_hash is null or v_tag.pin_hash <> crypt(claim_tag.pin, v_tag.pin_hash) then
    raise exception 'Invalid PIN' using errcode = '28000';
  end if;

  update public.tags
     set status = 'claimed',
         claimed_by = auth.uid(),
         claimed_at = now()
   where id = v_tag.id
  returning id into v_tag_id;

  insert into public.audit_logs (action, actor_id, target_table, target_id, metadata)
  values ('OWNER_CLAIM_TAG', auth.uid(), 'tags', v_tag_id, jsonb_build_object('public_code', v_tag.public_code));

  return v_tag_id;
end;
$$;

revoke execute on function public.claim_tag(text, text) from public;
grant execute on function public.claim_tag(text, text) to authenticated;

create or replace function public.attach_tag_to_pet(tag_id uuid, pet_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1
      from public.pets
     where pets.id = attach_tag_to_pet.pet_id
       and pets.owner_id = auth.uid()
  ) then
    raise exception 'Pet not found for owner' using errcode = '22023';
  end if;

  if not exists (
    select 1
      from public.tags
     where tags.id = attach_tag_to_pet.tag_id
       and tags.claimed_by = auth.uid()
  ) then
    raise exception 'Tag not claimed by owner' using errcode = '22023';
  end if;

  update public.pets
     set tag_id = attach_tag_to_pet.tag_id,
         updated_at = now()
   where id = attach_tag_to_pet.pet_id;

  insert into public.audit_logs (action, actor_id, target_table, target_id, metadata)
  values ('OWNER_ATTACH_TAG', auth.uid(), 'pets', attach_tag_to_pet.pet_id, jsonb_build_object('tag_id', attach_tag_to_pet.tag_id));
end;
$$;

revoke execute on function public.attach_tag_to_pet(uuid, uuid) from public;
grant execute on function public.attach_tag_to_pet(uuid, uuid) to authenticated;

create or replace function public.get_owner_pet_overview()
returns table (
  pet_id uuid,
  name text,
  species text,
  photo_url text,
  status text,
  last_seen_area text,
  tag_id uuid,
  tag_public_code text,
  created_at timestamptz,
  updated_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    pets.id as pet_id,
    pets.name,
    pets.species,
    pets.photo_url,
    pets.status,
    pets.last_seen_area,
    pets.tag_id,
    tags.public_code as tag_public_code,
    pets.created_at,
    pets.updated_at
  from public.pets
  left join public.tags on tags.id = pets.tag_id
  where pets.owner_id = auth.uid()
  order by pets.created_at desc;
$$;

revoke execute on function public.get_owner_pet_overview() from public;
grant execute on function public.get_owner_pet_overview() to authenticated;

create or replace function public.get_owner_sightings(pet_id uuid)
returns table (
  id uuid,
  created_at timestamptz,
  approx_lat double precision,
  approx_lon double precision,
  location_accuracy_m double precision,
  message text,
  photo_url text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1
      from public.pets
     where pets.id = get_owner_sightings.pet_id
       and pets.owner_id = auth.uid()
  ) then
    raise exception 'Pet not found for owner' using errcode = '22023';
  end if;

  insert into public.audit_logs (action, actor_id, target_table, target_id, metadata)
  values (
    'OWNER_VIEW_SIGHTINGS',
    auth.uid(),
    'pets',
    get_owner_sightings.pet_id,
    jsonb_build_object('rounded_precision', 3)
  );

  return query
  select
    sightings.id,
    sightings.created_at,
    round(sightings.lat::numeric, 3)::double precision as approx_lat,
    round(sightings.lon::numeric, 3)::double precision as approx_lon,
    sightings.location_accuracy_m,
    sightings.message,
    sightings.photo_url
  from public.sightings
  where sightings.pet_id = get_owner_sightings.pet_id
    and coalesce(sightings.is_suspected_spam, false) = false
  order by sightings.created_at desc;
end;
$$;

revoke execute on function public.get_owner_sightings(uuid) from public;
grant execute on function public.get_owner_sightings(uuid) to authenticated;

create or replace function public.get_public_pet_by_code(public_code text)
returns table (
  pet_id uuid,
  name text,
  species text,
  photo_url text,
  status text,
  last_seen_area text,
  tag_public_code text
)
language sql
security definer
set search_path = public
as $$
  select
    pets.id as pet_id,
    pets.name,
    pets.species,
    pets.photo_url,
    pets.status,
    pets.last_seen_area,
    tags.public_code as tag_public_code
  from public.tags
  join public.pets on pets.tag_id = tags.id
  where tags.public_code = get_public_pet_by_code.public_code
  limit 1;
$$;

revoke execute on function public.get_public_pet_by_code(text) from public;
grant execute on function public.get_public_pet_by_code(text) to anon, authenticated;

revoke select on table public.sightings from authenticated;
revoke select on table public.tags from authenticated;

alter table public.pets enable row level security;

create policy owner_pets_select
on public.pets
for select
to authenticated
using (owner_id = auth.uid());

create policy owner_pets_insert
on public.pets
for insert
to authenticated
with check (owner_id = auth.uid());

create policy owner_pets_update
on public.pets
for update
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());
