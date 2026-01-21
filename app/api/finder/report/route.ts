import { NextRequest, NextResponse } from 'next/server';

import { createSupabaseServerClient } from '@/lib/supabase/server';

type FinderReportPayload = {
  petId: string;
  lat?: number | null;
  lon?: number | null;
  message?: string | null;
  hero_opt_in?: boolean;
  hero_display_name?: string | null;
};

const blacklist = [/\b(kufur1|kufur2)\b/i];

const validateHeroName = (name: string | null | undefined) => {
  if (!name) {
    return { ok: true, value: null } as const;
  }

  const trimmed = name.trim();
  if (trimmed.length < 2 || trimmed.length > 20) {
    return { ok: false, error: 'Hero name must be 2-20 characters.' } as const;
  }

  if (blacklist.some((regex) => regex.test(trimmed))) {
    return { ok: false, error: 'Hero name contains blocked words.' } as const;
  }

  return { ok: true, value: trimmed } as const;
};

export async function POST(request: NextRequest) {
  const payload = (await request.json()) as FinderReportPayload;
  const supabase = createSupabaseServerClient();

  const heroName = validateHeroName(payload.hero_display_name);
  if (!heroName.ok) {
    return NextResponse.json({ error: heroName.error }, { status: 400 });
  }

  const { error } = await supabase.from('sightings').insert({
    pet_id: payload.petId,
    lat: payload.lat ?? null,
    lon: payload.lon ?? null,
    message: payload.message ?? null,
    hero_opt_in: payload.hero_opt_in ?? false,
    hero_display_name: heroName.value,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
