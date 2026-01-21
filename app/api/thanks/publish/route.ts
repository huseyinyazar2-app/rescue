import { NextRequest, NextResponse } from 'next/server';

import { createSupabaseServerClient } from '@/lib/supabase/server';

type HeroSelection = {
  kind: 'anonymous' | 'finder' | 'volunteer';
  refId?: string | null;
};

const parseHeroSelection = (value: string | null): HeroSelection => {
  if (!value || value === 'anonymous') {
    return { kind: 'anonymous' };
  }

  const [kind, refId] = value.split(':');
  if (kind === 'finder' || kind === 'volunteer') {
    return { kind, refId };
  }

  return { kind: 'anonymous' };
};

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const petId = formData.get('petId');
  const message = formData.get('message');
  const heroKindRaw = formData.get('heroKind');

  if (!petId || typeof petId !== 'string') {
    return NextResponse.json({ error: 'Invalid pet id' }, { status: 400 });
  }

  const heroSelection = parseHeroSelection(typeof heroKindRaw === 'string' ? heroKindRaw : null);
  const supabase = createSupabaseServerClient();

  let heroDisplayName: string | null = null;
  let sightingId: string | null = null;

  if (heroSelection.kind === 'finder' && heroSelection.refId) {
    const { data } = await supabase
      .from('rescue_sightings')
      .select('hero_opt_in,hero_display_name')
      .eq('id', heroSelection.refId)
      .single();

    if (data?.hero_opt_in && data.hero_display_name) {
      heroDisplayName = data.hero_display_name;
      sightingId = heroSelection.refId;
    }
  }

  if (heroSelection.kind === 'volunteer' && heroSelection.refId) {
    const { data } = await supabase
      .from('rescue_volunteer_task_responses')
      .select('response_type')
      .eq('id', heroSelection.refId)
      .single();

    if (data?.response_type) {
      heroDisplayName = `Gönüllü (${data.response_type})`;
    }
  }

  const { error } = await supabase.from('rescue_thanks_posts').upsert({
    pet_id: petId,
    message: typeof message === 'string' ? message : null,
    hero_kind: heroSelection.kind,
    hero_display_name: heroDisplayName,
    sighting_id: sightingId,
    is_published: true,
    published_at: new Date().toISOString(),
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.redirect(new URL(request.url).origin + '/community/thanks');
}
