import { supabaseClient } from '@/lib/supabase/client';

type PublicLostPost = {
  pet_id: string;
  public_code: string;
  is_activated: boolean;
  pet_status: string;
  display_name: string | null;
  species: string;
  photo_url: string | null;
  public_blurb: string | null;
  last_seen_area: string | null;
  last_seen_lat: number | null;
  last_seen_lon: number | null;
  last_seen_radius_km: number | null;
};

type PublicLostPostListItem = {
  pet_id: string;
  public_code: string;
  species: string;
  display_name: string | null;
  photo_url: string | null;
  public_blurb?: string | null;
  last_seen_area: string | null;
  approx_lat: number | null;
  approx_lon: number | null;
  created_at: string;
  updated_at: string;
};

export async function getPublicLostPost(publicCode: string) {
  const { data, error } = await supabaseClient.rpc<PublicLostPost>('get_public_lost_post', {
    public_code: publicCode,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data?.[0] ?? null;
}

export async function listPublicLostPostsNear({
  lat,
  lon,
  radiusKm,
  species,
}: {
  lat: number;
  lon: number;
  radiusKm: number;
  species?: string | null;
}) {
  const { data, error } = await supabaseClient.rpc<PublicLostPostListItem>(
    'list_public_lost_posts_near',
    {
      lat,
      lon,
      radius_km: radiusKm,
      species: species ?? null,
    },
  );

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function listPublicLostPostsRecent({
  species,
  query,
}: {
  species?: string | null;
  query?: string | null;
}) {
  const { data, error } = await supabaseClient.rpc<PublicLostPostListItem>(
    'list_public_lost_posts_recent',
    {
      species: species ?? null,
      query: query ?? null,
    },
  );

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}
