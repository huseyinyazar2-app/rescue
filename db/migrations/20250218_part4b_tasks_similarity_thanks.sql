BEGIN;

ALTER TABLE sightings
  ADD COLUMN IF NOT EXISTS hero_opt_in boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS hero_display_name text,
  ADD COLUMN IF NOT EXISTS is_hidden boolean NOT NULL DEFAULT false;

ALTER TABLE pets
  ADD COLUMN IF NOT EXISTS is_hidden boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS volunteer_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id uuid NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  sighting_id uuid REFERENCES sightings(id) ON DELETE SET NULL,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'cancelled')),
  task_type text NOT NULL DEFAULT 'confirm_sighting' CHECK (task_type IN ('confirm_sighting', 'search_help')),
  center_lat double precision NOT NULL,
  center_lon double precision NOT NULL,
  radius_km double precision NOT NULL DEFAULT 3,
  message text,
  created_at timestamptz DEFAULT now(),
  closed_at timestamptz,
  is_hidden boolean NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS volunteer_task_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES volunteer_tasks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  response_type text NOT NULL CHECK (response_type IN ('seen', 'not_seen', 'maybe', 'can_help', 'cant_help')),
  message text,
  photo_url text,
  created_at timestamptz DEFAULT now(),
  UNIQUE (task_id, user_id)
);

CREATE TABLE IF NOT EXISTS thanks_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id uuid UNIQUE NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  message text,
  hero_kind text NOT NULL DEFAULT 'anonymous' CHECK (hero_kind IN ('anonymous', 'finder', 'volunteer')),
  hero_display_name text,
  sighting_id uuid REFERENCES sightings(id) ON DELETE SET NULL,
  is_published boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  is_hidden boolean NOT NULL DEFAULT false
);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_event_type') THEN
    ALTER TYPE notification_event_type ADD VALUE IF NOT EXISTS 'TASK_CREATED';
  END IF;
END $$;

ALTER TABLE volunteer_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE volunteer_task_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE thanks_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY volunteer_tasks_owner_manage
  ON volunteer_tasks
  FOR ALL
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY volunteer_tasks_volunteer_read
  ON volunteer_tasks
  FOR SELECT
  USING (
    status = 'open'
    AND is_hidden = false
    AND EXISTS (
      SELECT 1
      FROM volunteer_subscriptions vs
      WHERE vs.user_id = auth.uid()
      AND (
        6371 * 2 * asin(
          sqrt(
            pow(sin(radians((center_lat - vs.center_lat) / 2)), 2) +
            cos(radians(vs.center_lat)) * cos(radians(center_lat)) *
            pow(sin(radians((center_lon - vs.center_lon) / 2)), 2)
          )
        )
      ) <= (radius_km + vs.radius_km)
    )
  );

CREATE POLICY volunteer_task_responses_user_crud
  ON volunteer_task_responses
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY volunteer_task_responses_owner_read
  ON volunteer_task_responses
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM volunteer_tasks vt
      WHERE vt.id = task_id
      AND vt.created_by = auth.uid()
    )
  );

CREATE POLICY thanks_posts_public_read
  ON thanks_posts
  FOR SELECT
  USING (is_published = true AND is_hidden = false);

CREATE POLICY thanks_posts_owner_manage
  ON thanks_posts
  FOR ALL
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY pets_owner_or_admin_hide
  ON pets
  FOR UPDATE
  USING (
    owner_id = auth.uid()
    OR COALESCE(auth.jwt() ->> 'role', '') = 'admin'
  )
  WITH CHECK (
    owner_id = auth.uid()
    OR COALESCE(auth.jwt() ->> 'role', '') = 'admin'
  );

CREATE POLICY sightings_owner_or_admin_hide
  ON sightings
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM pets
      WHERE pets.id = sightings.pet_id
      AND pets.owner_id = auth.uid()
    )
    OR COALESCE(auth.jwt() ->> 'role', '') = 'admin'
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM pets
      WHERE pets.id = sightings.pet_id
      AND pets.owner_id = auth.uid()
    )
    OR COALESCE(auth.jwt() ->> 'role', '') = 'admin'
  );

CREATE OR REPLACE FUNCTION list_open_tasks_for_volunteer()
RETURNS TABLE (
  task_id uuid,
  pet_id uuid,
  pet_display_name text,
  photo_url text,
  message text,
  created_at timestamptz,
  approx_lat double precision,
  approx_lon double precision,
  distance_km double precision
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH subscriptions AS (
    SELECT
      vs.user_id,
      vs.center_lat,
      vs.center_lon,
      vs.radius_km
    FROM volunteer_subscriptions vs
    WHERE vs.user_id = auth.uid()
  ),
  candidate_tasks AS (
    SELECT
      vt.id AS task_id,
      vt.pet_id,
      vt.message,
      vt.created_at,
      vt.center_lat,
      vt.center_lon,
      vt.radius_km
    FROM volunteer_tasks vt
    WHERE vt.status = 'open'
      AND vt.is_hidden = false
  ),
  matches AS (
    SELECT
      ct.task_id,
      ct.pet_id,
      ct.message,
      ct.created_at,
      ct.center_lat,
      ct.center_lon,
      (6371 * 2 * asin(
        sqrt(
          pow(sin(radians((ct.center_lat - s.center_lat) / 2)), 2) +
          cos(radians(s.center_lat)) * cos(radians(ct.center_lat)) *
          pow(sin(radians((ct.center_lon - s.center_lon) / 2)), 2)
        )
      )) AS distance_km
    FROM candidate_tasks ct
    JOIN subscriptions s ON true
    WHERE (6371 * 2 * asin(
      sqrt(
        pow(sin(radians((ct.center_lat - s.center_lat) / 2)), 2) +
        cos(radians(s.center_lat)) * cos(radians(ct.center_lat)) *
        pow(sin(radians((ct.center_lon - s.center_lon) / 2)), 2)
      )
    )) <= (ct.radius_km + s.radius_km)
  )
  SELECT
    m.task_id,
    m.pet_id,
    p.display_name AS pet_display_name,
    p.photo_url,
    m.message,
    m.created_at,
    ROUND(m.center_lat::numeric, 2)::double precision AS approx_lat,
    ROUND(m.center_lon::numeric, 2)::double precision AS approx_lon,
    m.distance_km
  FROM matches m
  JOIN pets p ON p.id = m.pet_id
  WHERE p.is_public = true
    AND p.is_hidden = false
  ORDER BY m.created_at DESC;
$$;

CREATE OR REPLACE FUNCTION create_task_from_sighting(
  pet_id_input uuid,
  sighting_id_input uuid,
  radius_km_input double precision,
  message_input text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  owner_id uuid;
  task_center_lat double precision;
  task_center_lon double precision;
  new_task_id uuid;
BEGIN
  SELECT owner_id INTO owner_id
  FROM pets
  WHERE id = pet_id_input;

  IF owner_id IS NULL OR owner_id <> auth.uid() THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  SELECT s.lat, s.lon
  INTO task_center_lat, task_center_lon
  FROM sightings s
  WHERE s.id = sighting_id_input;

  IF task_center_lat IS NULL OR task_center_lon IS NULL THEN
    SELECT p.last_seen_lat, p.last_seen_lon
    INTO task_center_lat, task_center_lon
    FROM pets p
    WHERE p.id = pet_id_input;
  END IF;

  IF task_center_lat IS NULL OR task_center_lon IS NULL THEN
    RAISE EXCEPTION 'missing location';
  END IF;

  INSERT INTO volunteer_tasks (
    pet_id,
    sighting_id,
    created_by,
    center_lat,
    center_lon,
    radius_km,
    message
  ) VALUES (
    pet_id_input,
    sighting_id_input,
    auth.uid(),
    task_center_lat,
    task_center_lon,
    COALESCE(radius_km_input, 3),
    message_input
  )
  RETURNING id INTO new_task_id;

  BEGIN
    INSERT INTO notification_events (event_type, actor_id, entity_id, created_at)
    VALUES ('TASK_CREATED', auth.uid(), new_task_id, now());
  EXCEPTION WHEN undefined_table THEN
    NULL;
  END;

  RETURN new_task_id;
END;
$$;

CREATE OR REPLACE FUNCTION find_similar_lost_pets(
  pet_id_input uuid,
  limit_input integer DEFAULT 5
)
RETURNS TABLE (
  pet_id uuid,
  public_code text,
  display_name text,
  photo_url text,
  last_seen_area text,
  approx_lat double precision,
  approx_lon double precision,
  score double precision
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH target AS (
    SELECT
      id,
      species,
      last_seen_lat,
      last_seen_lon
    FROM pets
    WHERE id = pet_id_input
  ),
  candidates AS (
    SELECT
      p.id,
      p.public_code,
      p.display_name,
      p.photo_url,
      p.last_seen_area,
      p.last_seen_lat,
      p.last_seen_lon,
      p.updated_at,
      (6371 * 2 * asin(
        sqrt(
          pow(sin(radians((p.last_seen_lat - t.last_seen_lat) / 2)), 2) +
          cos(radians(t.last_seen_lat)) * cos(radians(p.last_seen_lat)) *
          pow(sin(radians((p.last_seen_lon - t.last_seen_lon) / 2)), 2)
        )
      )) AS distance_km
    FROM pets p
    JOIN target t ON true
    WHERE p.id <> t.id
      AND p.species = t.species
      AND p.status = 'lost'
      AND p.is_public = true
      AND p.is_hidden = false
      AND p.updated_at >= now() - interval '14 days'
      AND p.last_seen_lat IS NOT NULL
      AND p.last_seen_lon IS NOT NULL
      AND t.last_seen_lat IS NOT NULL
      AND t.last_seen_lon IS NOT NULL
  )
  SELECT
    c.id AS pet_id,
    c.public_code,
    c.display_name,
    c.photo_url,
    c.last_seen_area,
    ROUND(c.last_seen_lat::numeric, 2)::double precision AS approx_lat,
    ROUND(c.last_seen_lon::numeric, 2)::double precision AS approx_lon,
    (c.distance_km + EXTRACT(EPOCH FROM (now() - c.updated_at)) / 86400.0) AS score
  FROM candidates c
  WHERE c.distance_km <= 10
  ORDER BY score ASC
  LIMIT COALESCE(limit_input, 5);
$$;

COMMIT;
