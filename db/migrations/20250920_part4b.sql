-- Part 4B: tasks, similarity, thanks, moderation, hero opt-in

begin;

alter table if exists rescue_sightings
  add column if not exists hero_opt_in boolean not null default false,
  add column if not exists hero_display_name text null,
  add column if not exists is_hidden boolean not null default false;

alter table if exists rescue_pets
  add column if not exists is_hidden boolean not null default false;

create table if not exists rescue_volunteer_tasks (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references rescue_pets(id) on delete cascade,
  sighting_id uuid null references rescue_sightings(id) on delete set null,
  created_by uuid not null references auth.users(id) on delete cascade,
  status text not null default 'open' check (status in ('open','closed','cancelled')),
  task_type text not null default 'confirm_sighting' check (task_type in ('confirm_sighting','search_help')),
  center_lat double precision not null,
  center_lon double precision not null,
  radius_km double precision not null default 3,
  message text null,
  created_at timestamptz default now(),
  closed_at timestamptz null,
  is_hidden boolean not null default false
);

create index if not exists volunteer_tasks_open_idx on rescue_volunteer_tasks(status, is_hidden);

create table if not exists rescue_volunteer_task_responses (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references rescue_volunteer_tasks(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  response_type text not null check (response_type in ('seen','not_seen','maybe','can_help','cant_help')),
  message text null,
  photo_url text null,
  created_at timestamptz default now(),
  unique (task_id, user_id)
);

create table if not exists rescue_thanks_posts (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid unique not null references rescue_pets(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  message text null,
  hero_kind text not null default 'anonymous' check (hero_kind in ('anonymous','finder','volunteer')),
  hero_display_name text null,
  sighting_id uuid null references rescue_sightings(id) on delete set null,
  is_published boolean not null default false,
  published_at timestamptz null,
  is_hidden boolean not null default false
);

-- Moderation policies
alter table if exists rescue_pets enable row level security;
alter table if exists rescue_sightings enable row level security;
alter table if exists rescue_volunteer_tasks enable row level security;
alter table if exists rescue_volunteer_task_responses enable row level security;
alter table if exists rescue_thanks_posts enable row level security;

do $$
begin
  if exists (select 1 from pg_type where typname = 'notification_event_type') then
    begin
      alter type notification_event_type add value if not exists 'TASK_CREATED';
    exception when duplicate_object then
      null;
    end;
  end if;
end$$;

create or replace function public.haversine_km(lat1 double precision, lon1 double precision, lat2 double precision, lon2 double precision)
returns double precision
language sql
immutable
as $$
  select 6371 * acos(
    cos(radians(lat1)) * cos(radians(lat2)) * cos(radians(lon2) - radians(lon1)) +
    sin(radians(lat1)) * sin(radians(lat2))
  );
$$;

create or replace function public.list_open_tasks_for_volunteer()
returns table (
  task_id uuid,
  pet_id uuid,
  pet_name text,
  photo_url text,
  public_code text,
  message text,
  created_at timestamptz,
  approx_lat double precision,
  approx_lon double precision
)
security definer
set search_path = public
language plpgsql
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  return query
  select
    vt.id,
    vt.pet_id,
    p.display_name,
    p.photo_url,
    p.public_code,
    vt.message,
    vt.created_at,
    round(vt.center_lat::numeric, 3)::double precision,
    round(vt.center_lon::numeric, 3)::double precision
  from rescue_volunteer_tasks vt
  join rescue_pets p on p.id = vt.pet_id
  where vt.status = 'open'
    and vt.is_hidden = false
    and p.is_hidden = false
    and exists (
      select 1
      from rescue_volunteer_subscriptions vs
      where vs.user_id = auth.uid()
        and public.haversine_km(vs.center_lat, vs.center_lon, vt.center_lat, vt.center_lon) <= (vs.radius_km + vt.radius_km)
    );
end;
$$;

create or replace function public.create_task_from_sighting(
  p_pet_id uuid,
  p_sighting_id uuid,
  p_radius_km double precision,
  p_message text
) returns uuid
security definer
set search_path = public
language plpgsql
as $$
declare
  v_owner_id uuid;
  v_lat double precision;
  v_lon double precision;
  v_task_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select owner_id, last_seen_lat, last_seen_lon
    into v_owner_id, v_lat, v_lon
  from rescue_pets
  where id = p_pet_id;

  if v_owner_id is null or v_owner_id <> auth.uid() then
    raise exception 'Not authorized';
  end if;

  if p_sighting_id is not null then
    select lat, lon into v_lat, v_lon
    from rescue_sightings
    where id = p_sighting_id;
  end if;

  if v_lat is null or v_lon is null then
    raise exception 'Missing location';
  end if;

  insert into rescue_volunteer_tasks (
    pet_id,
    sighting_id,
    created_by,
    center_lat,
    center_lon,
    radius_km,
    message
  ) values (
    p_pet_id,
    p_sighting_id,
    auth.uid(),
    v_lat,
    v_lon,
    coalesce(p_radius_km, 3),
    p_message
  ) returning id into v_task_id;

  if exists (select 1 from pg_tables where schemaname = 'public' and tablename = 'rescue_notification_events') then
    insert into rescue_notification_events (event_type, payload)
    values ('TASK_CREATED', jsonb_build_object('task_id', v_task_id, 'pet_id', p_pet_id));
  end if;

  return v_task_id;
end;
$$;

create or replace function public.find_similar_lost_pets(
  p_pet_id uuid,
  p_limit integer default 5
) returns table (
  pet_id uuid,
  public_code text,
  display_name text,
  photo_url text,
  last_seen_area text,
  approx_lat double precision,
  approx_lon double precision,
  score double precision
)
security definer
set search_path = public
language plpgsql
as $$
declare
  v_species text;
  v_lat double precision;
  v_lon double precision;
begin
  select species, last_seen_lat, last_seen_lon
    into v_species, v_lat, v_lon
  from rescue_pets
  where id = p_pet_id;

  return query
  select
    p.id,
    p.public_code,
    p.display_name,
    p.photo_url,
    p.last_seen_area,
    round(p.last_seen_lat::numeric, 3)::double precision,
    round(p.last_seen_lon::numeric, 3)::double precision,
    (public.haversine_km(v_lat, v_lon, p.last_seen_lat, p.last_seen_lon) +
      extract(epoch from (now() - p.updated_at)) / 86400) as score
  from rescue_pets p
  where p.id <> p_pet_id
    and p.species = v_species
    and p.status = 'lost'
    and p.is_public = true
    and p.is_hidden = false
    and p.updated_at >= now() - interval '14 days'
    and (
      v_lat is null
      or v_lon is null
      or public.haversine_km(v_lat, v_lon, p.last_seen_lat, p.last_seen_lon) <= 10
    )
  order by score asc
  limit coalesce(p_limit, 5);
end;
$$;

-- RLS policies
create policy pets_owner_hide on rescue_pets
  for update
  using (owner_id = auth.uid());

create policy sightings_owner_hide on rescue_sightings
  for update
  using (exists (select 1 from rescue_pets where rescue_pets.id = rescue_sightings.pet_id and rescue_pets.owner_id = auth.uid()));

create policy volunteer_tasks_owner_all on rescue_volunteer_tasks
  for all
  using (created_by = auth.uid())
  with check (created_by = auth.uid());

create policy volunteer_tasks_volunteer_read on rescue_volunteer_tasks
  for select
  using (
    status = 'open'
    and is_hidden = false
    and exists (
      select 1
      from rescue_volunteer_subscriptions vs
      where vs.user_id = auth.uid()
        and public.haversine_km(vs.center_lat, vs.center_lon, center_lat, center_lon) <= (vs.radius_km + radius_km)
    )
  );

create policy volunteer_task_responses_owner_read on rescue_volunteer_task_responses
  for select
  using (
    exists (
      select 1
      from rescue_volunteer_tasks vt
      where vt.id = rescue_volunteer_task_responses.task_id
        and vt.created_by = auth.uid()
    )
  );

create policy volunteer_task_responses_user_all on rescue_volunteer_task_responses
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy thanks_posts_public_read on rescue_thanks_posts
  for select
  using (is_published = true and is_hidden = false);

create policy thanks_posts_owner_all on rescue_thanks_posts
  for all
  using (
    exists (
      select 1
      from rescue_pets
      where rescue_pets.id = rescue_thanks_posts.pet_id
        and rescue_pets.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from rescue_pets
      where rescue_pets.id = rescue_thanks_posts.pet_id
        and rescue_pets.owner_id = auth.uid()
    )
  );

commit;
