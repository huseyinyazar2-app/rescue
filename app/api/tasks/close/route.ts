import { NextRequest, NextResponse } from 'next/server';

import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const taskId = formData.get('taskId');
  const supabase = createSupabaseServerClient();

  if (!taskId || typeof taskId !== 'string') {
    return NextResponse.json({ error: 'Invalid task id' }, { status: 400 });
  }

  const { error } = await supabase
    .from('rescue_volunteer_tasks')
    .update({ status: 'closed', closed_at: new Date().toISOString() })
    .eq('id', taskId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.redirect(new URL(request.url).origin + '/app');
}
