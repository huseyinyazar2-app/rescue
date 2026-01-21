import { NextRequest, NextResponse } from 'next/server';

import { createSupabaseServerClient } from '@/lib/supabase/server';

type Payload = {
  petId: string;
  sightingId?: string | null;
  radiusKm?: number | null;
  message?: string | null;
};

export async function POST(request: NextRequest) {
  const payload = (await request.json()) as Payload;
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase.rpc('create_task_from_sighting', {
    p_pet_id: payload.petId,
    p_sighting_id: payload.sightingId ?? null,
    p_radius_km: payload.radiusKm ?? null,
    p_message: payload.message ?? null,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ taskId: data });
}
