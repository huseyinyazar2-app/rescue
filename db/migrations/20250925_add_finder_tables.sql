-- Finder Part 3 schema changes

create table if not exists public.rescue_tag_scans (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  public_code text not null,
  tag_id uuid null references public.rescue_tags(id) on delete set null,
  pet_id uuid null references public.rescue_pets(id) on delete set null,
  action text not null check (action in ('view','location_shared','report_submitted','report_failed')),
  lat double precision null,
  lon double precision null,
  location_accuracy_m double precision null,
  message text null,
  user_agent text null,
  accept_language text null,
  ip_hash text null,
  metadata jsonb null
);

alter table public.rescue_tag_scans enable row level security;
revoke all on public.rescue_tag_scans from anon, authenticated;

alter table public.rescue_sightings
  add column if not exists event_type text not null default 'seen';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'sightings_event_type_check'
  ) then
    alter table public.rescue_sightings
      add constraint sightings_event_type_check
      check (event_type in ('seen','found','info'));
  end if;
end $$;

create or replace function public.get_public_pet_by_code(input_public_code text)
returns table (
  is_activated boolean,
  pet_id uuid,
  pet_name text,
  species text,
  photo_url text,
  pet_status text,
  last_seen_area text
)
language sql
security definer
as $$
  with tag_row as (
    select id
    from public.rescue_tags
    where public_code = input_public_code
    limit 1
  ),
  pet_row as (
    select p.id,
      p.name as pet_name,
      p.species,
      p.photo_url,
      p.status as pet_status,
      p.last_seen_area
    from public.rescue_pets p
    join tag_row t on p.tag_id = t.id
    limit 1
  )
  select
    (select count(*) from pet_row) > 0 as is_activated,
    pet_row.id as pet_id,
    pet_row.pet_name,
    pet_row.species,
    pet_row.photo_url,
    pet_row.pet_status,
    pet_row.last_seen_area
  from (select 1) as placeholder
  left join pet_row on true;
$$;

revoke all on function public.get_public_pet_by_code(text) from public;
grant execute on function public.get_public_pet_by_code(text) to anon, authenticated;
