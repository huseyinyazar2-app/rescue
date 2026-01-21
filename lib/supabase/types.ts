export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      rescue_pets: {
        Row: {
          id: string;
          owner_id: string;
          tag_id: string | null;
          name: string;
          species: string | null;
          photo_url: string | null;
          notes: string | null;
          status: string | null;
          last_seen_area: string | null;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          owner_id: string;
          tag_id?: string | null;
          name: string;
          species?: string | null;
          photo_url?: string | null;
          notes?: string | null;
          status?: string | null;
          last_seen_area?: string | null;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['rescue_pets']['Insert']>;
      };
      rescue_tags: {
        Row: {
          id: string;
          public_code: string;
          status: string;
          claimed_by: string | null;
        };
        Insert: {
          id?: string;
          public_code: string;
          status?: string;
          claimed_by?: string | null;
        };
        Update: Partial<Database['public']['Tables']['rescue_tags']['Insert']>;
      };
    };
    Functions: {
      claim_tag: {
        Args: { public_code: string; pin: string };
        Returns: string;
      };
      attach_tag_to_pet: {
        Args: { tag_id: string; pet_id: string };
        Returns: void;
      };
      get_owner_pet_overview: {
        Args: Record<string, never>;
        Returns: Array<{
          pet_id: string;
          name: string;
          species: string | null;
          photo_url: string | null;
          status: string | null;
          last_seen_area: string | null;
          tag_id: string | null;
          tag_public_code: string | null;
          created_at: string;
          updated_at: string | null;
        }>;
      };
      get_owner_sightings: {
        Args: { pet_id: string };
        Returns: Array<{
          id: string;
          created_at: string;
          approx_lat: number | null;
          approx_lon: number | null;
          location_accuracy_m: number | null;
          message: string | null;
          photo_url: string | null;
        }>;
      };
      get_public_pet_by_code: {
        Args: { public_code: string };
        Returns: Array<{
          pet_id: string;
          name: string;
          species: string | null;
          photo_url: string | null;
          status: string | null;
          last_seen_area: string | null;
          tag_public_code: string | null;
        }>;
      };
    };
  };
}
