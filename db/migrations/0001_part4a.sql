-- Part 4A: community + volunteers + notifications

ALTER TABLE pets
  ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS public_blurb text NULL,
  ADD COLUMN IF NOT EXISTS last_seen_lat double precision NULL,
  ADD COLUMN IF NOT EXISTS last_seen_lon double precision NULL,
  ADD COLUMN IF NOT EXISTS last_seen_radius_km double precision NULL DEFAULT 2,
  ADD COLUMN IF NOT EXISTS public_visibility jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE TABLE IF NOT EXISTS volunteers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  is_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS volunteer_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  center_lat double precision NOT NULL,
  center_lon double precision NOT NULL,
  radius_km double precision NOT NULL DEFAULT 5,
  species_filter text[] NOT NULL DEFAULT ARRAY['cat','dog']::text[],
  notify_lost boolean NOT NULL DEFAULT true,
  notify_found boolean NOT NULL DEFAULT false,
  is_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notification_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL CHECK (event_type IN ('PET_LOST_PUBLIC','PET_FOUND_PUBLIC')),
  pet_id uuid REFERENCES pets(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  processed_at timestamptz NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processed','failed')),
  error text NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS notification_outbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES notification_events(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  to_email text NOT NULL,
  subject text NOT NULL,
  body_html text NOT NULL,
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','sent','failed','skipped')),
  error text NULL,
  created_at timestamptz DEFAULT now(),
  sent_at timestamptz NULL
);

CREATE OR REPLACE FUNCTION haversine_km(lat1 double precision, lon1 double precision, lat2 double precision, lon2 double precision)
RETURNS double precision
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT 6371 * 2 * asin(
    sqrt(
      power(sin(radians((lat2 - lat1) / 2)), 2) +
      cos(radians(lat1)) * cos(radians(lat2)) * power(sin(radians((lon2 - lon1) / 2)), 2)
    )
  );
$$;

CREATE OR REPLACE FUNCTION on_pet_status_change()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status OR NEW.is_public IS DISTINCT FROM OLD.is_public THEN
    IF NEW.status = 'lost' AND NEW.is_public = true THEN
      INSERT INTO notification_events (event_type, pet_id)
      VALUES ('PET_LOST_PUBLIC', NEW.id);
    ELSIF NEW.status = 'found' AND NEW.is_public = true THEN
      INSERT INTO notification_events (event_type, pet_id)
      VALUES ('PET_FOUND_PUBLIC', NEW.id);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS pets_status_change_trigger ON pets;
CREATE TRIGGER pets_status_change_trigger
AFTER UPDATE OF status, is_public ON pets
FOR EACH ROW
EXECUTE FUNCTION on_pet_status_change();

ALTER TABLE volunteers ENABLE ROW LEVEL SECURITY;
ALTER TABLE volunteer_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_outbox ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "volunteers_select_own" ON volunteers;
CREATE POLICY "volunteers_select_own" ON volunteers
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "volunteers_insert_own" ON volunteers;
CREATE POLICY "volunteers_insert_own" ON volunteers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "volunteers_update_own" ON volunteers;
CREATE POLICY "volunteers_update_own" ON volunteers
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "volunteers_delete_own" ON volunteers;
CREATE POLICY "volunteers_delete_own" ON volunteers
  FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "subscriptions_select_own" ON volunteer_subscriptions;
CREATE POLICY "subscriptions_select_own" ON volunteer_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "subscriptions_insert_own" ON volunteer_subscriptions;
CREATE POLICY "subscriptions_insert_own" ON volunteer_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "subscriptions_update_own" ON volunteer_subscriptions;
CREATE POLICY "subscriptions_update_own" ON volunteer_subscriptions
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "subscriptions_delete_own" ON volunteer_subscriptions;
CREATE POLICY "subscriptions_delete_own" ON volunteer_subscriptions
  FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "notification_events_admin_select" ON notification_events;
CREATE POLICY "notification_events_admin_select" ON notification_events
  FOR SELECT USING ((auth.jwt() ->> 'role') = 'admin');

DROP POLICY IF EXISTS "notification_events_insert_admin" ON notification_events;
CREATE POLICY "notification_events_insert_admin" ON notification_events
  FOR INSERT WITH CHECK ((auth.jwt() ->> 'role') = 'admin');

DROP POLICY IF EXISTS "notification_events_update_admin" ON notification_events;
CREATE POLICY "notification_events_update_admin" ON notification_events
  FOR UPDATE USING ((auth.jwt() ->> 'role') = 'admin') WITH CHECK ((auth.jwt() ->> 'role') = 'admin');

DROP POLICY IF EXISTS "notification_outbox_admin_select" ON notification_outbox;
CREATE POLICY "notification_outbox_admin_select" ON notification_outbox
  FOR SELECT USING ((auth.jwt() ->> 'role') = 'admin');

DROP POLICY IF EXISTS "notification_outbox_insert_admin" ON notification_outbox;
CREATE POLICY "notification_outbox_insert_admin" ON notification_outbox
  FOR INSERT WITH CHECK ((auth.jwt() ->> 'role') = 'admin');

DROP POLICY IF EXISTS "notification_outbox_update_admin" ON notification_outbox;
CREATE POLICY "notification_outbox_update_admin" ON notification_outbox
  FOR UPDATE USING ((auth.jwt() ->> 'role') = 'admin') WITH CHECK ((auth.jwt() ->> 'role') = 'admin');

CREATE OR REPLACE FUNCTION get_public_lost_post(public_code text)
RETURNS TABLE (
  pet_id uuid,
  public_code text,
  is_activated boolean,
  pet_status text,
  display_name text,
  species text,
  photo_url text,
  public_blurb text,
  last_seen_area text,
  last_seen_lat double precision,
  last_seen_lon double precision,
  last_seen_radius_km double precision
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  visibility jsonb;
BEGIN
  RETURN QUERY
  SELECT
    pets.id,
    tags.public_code,
    tags.is_activated,
    pets.status,
    CASE WHEN COALESCE((pets.public_visibility ->> 'show_name')::boolean, true) THEN pets.name ELSE NULL END,
    pets.species,
    CASE WHEN COALESCE((pets.public_visibility ->> 'show_photo')::boolean, true) THEN pets.photo_url ELSE NULL END,
    CASE WHEN COALESCE((pets.public_visibility ->> 'show_blurb')::boolean, true) THEN pets.public_blurb ELSE NULL END,
    CASE WHEN COALESCE((pets.public_visibility ->> 'show_area_text')::boolean, true) THEN pets.last_seen_area ELSE NULL END,
    CASE WHEN pets.last_seen_lat IS NOT NULL THEN round(pets.last_seen_lat::numeric, 3)::double precision ELSE NULL END,
    CASE WHEN pets.last_seen_lon IS NOT NULL THEN round(pets.last_seen_lon::numeric, 3)::double precision ELSE NULL END,
    pets.last_seen_radius_km
  FROM tags
  JOIN pets ON pets.tag_id = tags.id
  WHERE tags.public_code = get_public_lost_post.public_code
  LIMIT 1;
END;
$$;

GRANT EXECUTE ON FUNCTION get_public_lost_post(text) TO anon;

CREATE OR REPLACE FUNCTION list_public_lost_posts_near(
  lat double precision,
  lon double precision,
  radius_km double precision,
  species text DEFAULT NULL
)
RETURNS TABLE (
  pet_id uuid,
  public_code text,
  species text,
  display_name text,
  photo_url text,
  last_seen_area text,
  approx_lat double precision,
  approx_lon double precision,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    pets.id,
    tags.public_code,
    pets.species,
    CASE WHEN COALESCE((pets.public_visibility ->> 'show_name')::boolean, true) THEN pets.name ELSE NULL END,
    CASE WHEN COALESCE((pets.public_visibility ->> 'show_photo')::boolean, true) THEN pets.photo_url ELSE NULL END,
    CASE WHEN COALESCE((pets.public_visibility ->> 'show_area_text')::boolean, true) THEN pets.last_seen_area ELSE NULL END,
    round(pets.last_seen_lat::numeric, 3)::double precision,
    round(pets.last_seen_lon::numeric, 3)::double precision,
    pets.created_at,
    pets.updated_at
  FROM pets
  JOIN tags ON tags.id = pets.tag_id
  WHERE pets.status = 'lost'
    AND pets.is_public = true
    AND pets.last_seen_lat IS NOT NULL
    AND pets.last_seen_lon IS NOT NULL
    AND haversine_km(lat, lon, pets.last_seen_lat, pets.last_seen_lon) <= radius_km
    AND (species IS NULL OR pets.species = species);
$$;

GRANT EXECUTE ON FUNCTION list_public_lost_posts_near(double precision, double precision, double precision, text) TO anon;

CREATE OR REPLACE FUNCTION list_public_lost_posts_recent(
  species text DEFAULT NULL,
  query text DEFAULT NULL
)
RETURNS TABLE (
  pet_id uuid,
  public_code text,
  species text,
  display_name text,
  photo_url text,
  public_blurb text,
  last_seen_area text,
  approx_lat double precision,
  approx_lon double precision,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    pets.id,
    tags.public_code,
    pets.species,
    CASE WHEN COALESCE((pets.public_visibility ->> 'show_name')::boolean, true) THEN pets.name ELSE NULL END,
    CASE WHEN COALESCE((pets.public_visibility ->> 'show_photo')::boolean, true) THEN pets.photo_url ELSE NULL END,
    CASE WHEN COALESCE((pets.public_visibility ->> 'show_blurb')::boolean, true) THEN pets.public_blurb ELSE NULL END,
    CASE WHEN COALESCE((pets.public_visibility ->> 'show_area_text')::boolean, true) THEN pets.last_seen_area ELSE NULL END,
    CASE WHEN pets.last_seen_lat IS NOT NULL THEN round(pets.last_seen_lat::numeric, 3)::double precision ELSE NULL END,
    CASE WHEN pets.last_seen_lon IS NOT NULL THEN round(pets.last_seen_lon::numeric, 3)::double precision ELSE NULL END,
    pets.created_at,
    pets.updated_at
  FROM pets
  JOIN tags ON tags.id = pets.tag_id
  WHERE pets.status = 'lost'
    AND pets.is_public = true
    AND pets.updated_at >= now() - interval '7 days'
    AND (species IS NULL OR pets.species = species)
    AND (
      query IS NULL OR
      (pets.public_blurb IS NOT NULL AND pets.public_blurb ILIKE '%' || query || '%')
    )
  ORDER BY pets.updated_at DESC;
$$;

GRANT EXECUTE ON FUNCTION list_public_lost_posts_recent(text, text) TO anon;
