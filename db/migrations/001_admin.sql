create extension if not exists "pgcrypto";

create table if not exists rescue_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  role text check (role in ('admin', 'user')) default 'user',
  created_at timestamptz default now()
);

create table if not exists rescue_batches (
  id uuid primary key default gen_random_uuid(),
  name text,
  quantity int not null,
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);

create table if not exists rescue_tags (
  id uuid primary key default gen_random_uuid(),
  public_code text unique not null,
  pin_hash text not null,
  status text check (status in ('unclaimed', 'claimed', 'archived')) default 'unclaimed',
  created_at timestamptz default now(),
  claimed_by uuid null references auth.users(id),
  claimed_at timestamptz null,
  batch_id uuid null references rescue_batches(id)
);

create table if not exists rescue_pets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade,
  tag_id uuid unique references rescue_tags(id) on delete set null,
  name text,
  species text,
  photo_url text null,
  notes text null,
  status text check (status in ('normal', 'lost', 'found')) default 'normal',
  last_seen_area text null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists rescue_sightings (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid references rescue_pets(id) on delete cascade,
  created_at timestamptz default now(),
  lat double precision null,
  lon double precision null,
  location_accuracy_m double precision null,
  message text null,
  photo_url text null,
  finder_contact text null,
  metadata jsonb null,
  ip_hash text null,
  is_suspected_spam boolean default false
);

create table if not exists rescue_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id),
  action text not null,
  target_type text not null,
  target_id uuid null,
  details jsonb null,
  created_at timestamptz default now()
);

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger pets_set_updated_at
before update on rescue_pets
for each row
execute function set_updated_at();

alter table rescue_profiles enable row level security;
alter table rescue_tags enable row level security;
alter table rescue_pets enable row level security;
alter table rescue_sightings enable row level security;
alter table rescue_audit_logs enable row level security;
alter table rescue_batches enable row level security;

create or replace function is_admin(uid uuid)
returns boolean as $$
  select exists(select 1 from rescue_profiles where id = uid and role = 'admin');
$$ language sql stable;

create policy "profiles_admin_select" on rescue_profiles
  for select
  using (is_admin(auth.uid()));

create policy "profiles_admin_update" on rescue_profiles
  for update
  using (is_admin(auth.uid()))
  with check (is_admin(auth.uid()));

create policy "tags_admin_all" on rescue_tags
  for all
  using (is_admin(auth.uid()))
  with check (is_admin(auth.uid()));

create policy "batches_admin_all" on rescue_batches
  for all
  using (is_admin(auth.uid()))
  with check (is_admin(auth.uid()));

create policy "pets_owner_select" on rescue_pets
  for select
  using (owner_id = auth.uid());

create policy "pets_admin_all" on rescue_pets
  for all
  using (is_admin(auth.uid()))
  with check (is_admin(auth.uid()));

create policy "sightings_admin_all" on rescue_sightings
  for all
  using (is_admin(auth.uid()))
  with check (is_admin(auth.uid()));

create policy "audit_admin_select" on rescue_audit_logs
  for select
  using (is_admin(auth.uid()));

create or replace view sightings_owner_safe as
select
  id,
  pet_id,
  created_at,
  round(lat::numeric, 3)::double precision as lat_approx,
  round(lon::numeric, 3)::double precision as lon_approx,
  location_accuracy_m,
  message,
  photo_url,
  is_suspected_spam
from rescue_sightings;

revoke select on table rescue_sightings from anon, authenticated;
alter view sightings_owner_safe set (security_barrier = true);

grant select on sightings_owner_safe to authenticated;
