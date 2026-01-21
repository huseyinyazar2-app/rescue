import { NextResponse } from 'next/server';

import { createSupabaseServerClient } from '@/lib/supabase/server';

const DISPLAY_NAME_MIN = 2;
const DISPLAY_NAME_MAX = 20;
const FORBIDDEN_WORDS = ['spam', 'abuse', 'hakaret'];

function isCleanDisplayName(value: string) {
  const lowered = value.toLowerCase();
  return !FORBIDDEN_WORDS.some((word) => lowered.includes(word));
}

export async function POST(request: Request) {
  const supabase = createSupabaseServerClient();
  const body = await request.json();
  const {
    petId,
    lat,
    lon,
    message,
    finderContact,
    heroOptIn,
    heroDisplayName,
  } = body ?? {};

  if (!petId || typeof lat !== 'number' || typeof lon !== 'number') {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  let sanitizedHeroName: string | null = null;
  const heroOptInValue = Boolean(heroOptIn);

  if (heroOptInValue && typeof heroDisplayName === 'string') {
    const trimmed = heroDisplayName.trim();
    if (
      trimmed.length < DISPLAY_NAME_MIN ||
      trimmed.length > DISPLAY_NAME_MAX ||
      !isCleanDisplayName(trimmed)
    ) {
      return NextResponse.json({ error: 'Invalid hero display name' }, { status: 400 });
    }
    sanitizedHeroName = trimmed;
  }

  const { data, error } = await supabase.from('sightings').insert({
    pet_id: petId,
    lat,
    lon,
    message: message ?? null,
    finder_contact: finderContact ?? null,
    hero_opt_in: heroOptInValue,
    hero_display_name: sanitizedHeroName,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, data });
}
