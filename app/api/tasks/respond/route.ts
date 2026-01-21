import { NextResponse } from 'next/server';

import { createSupabaseServerClient } from '@/lib/supabase/server';

const VALID_RESPONSES = new Set(['seen', 'not_seen', 'maybe', 'can_help', 'cant_help']);

export async function POST(request: Request) {
  const supabase = createSupabaseServerClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await request.formData();
  const taskId = formData.get('taskId');
  const responseType = formData.get('responseType');
  const message = formData.get('message');
  const photo = formData.get('photo');

  if (typeof taskId !== 'string' || typeof responseType !== 'string') {
    return NextResponse.json({ error: 'Missing taskId or responseType' }, { status: 400 });
  }

  if (!VALID_RESPONSES.has(responseType)) {
    return NextResponse.json({ error: 'Invalid response type' }, { status: 400 });
  }

  let photoUrl: string | null = null;

  if (photo instanceof File) {
    const path = `${authData.user.id}/${taskId}/${crypto.randomUUID()}-${photo.name}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('task-photos')
      .upload(path, photo, { contentType: photo.type });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 400 });
    }

    const { data: publicUrlData } = supabase.storage
      .from('task-photos')
      .getPublicUrl(uploadData.path);

    photoUrl = publicUrlData.publicUrl;
  }

  const { error } = await supabase.from('volunteer_task_responses').upsert(
    {
      task_id: taskId,
      user_id: authData.user.id,
      response_type: responseType,
      message: typeof message === 'string' ? message : null,
      photo_url: photoUrl,
    },
    { onConflict: 'task_id,user_id' }
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
