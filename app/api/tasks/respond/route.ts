import { NextRequest, NextResponse } from 'next/server';

import { createSupabaseServerClient } from '@/lib/supabase/server';

type Payload = {
  taskId: string;
  responseType: 'seen' | 'not_seen' | 'maybe' | 'can_help' | 'cant_help';
  message?: string | null;
  photoUrl?: string | null;
};

export async function POST(request: NextRequest) {
  const payload = (await request.json()) as Payload;
  const supabase = createSupabaseServerClient();

  const { error } = await supabase.from('volunteer_task_responses').insert({
    task_id: payload.taskId,
    response_type: payload.responseType,
    message: payload.message ?? null,
    photo_url: payload.photoUrl ?? null,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
