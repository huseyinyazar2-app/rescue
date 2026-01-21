import { createSupabaseServerClient } from '@/lib/supabase/server';

export type SimilarPet = {
  pet_id: string;
  public_code: string;
  display_name: string | null;
  photo_url: string | null;
  last_seen_area: string | null;
  approx_lat: number | null;
  approx_lon: number | null;
  score: number;
};

export const findSimilarLostPets = async (petId: string, limit = 5): Promise<SimilarPet[]> => {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.rpc('find_similar_lost_pets', {
    p_pet_id: petId,
    p_limit: limit,
  });

  if (error) {
    console.error('find_similar_lost_pets failed', error);
    return [];
  }

  return (data ?? []) as SimilarPet[];
};
