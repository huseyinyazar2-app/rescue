import { NextResponse } from 'next/server';

import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const supabase = createSupabaseServerClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { petId, sightingId, radiusKm, message } = body ?? {};

  if (!petId || !sightingId) {
    return NextResponse.json({ error: 'Missing petId or sightingId' }, { status: 400 });
  }

  const { data, error } = await supabase.rpc('create_task_from_sighting', {
    pet_id_input: petId,
    sighting_id_input: sightingId,
    radius_km_input: radiusKm,
    message_input: message ?? null,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ taskId: data });
}
