import Link from 'next/link';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { TaskResponseForm } from './task-response-form';

export default async function CommunityTasksPage() {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase.rpc('list_open_tasks_for_volunteer');

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Yakınınızdaki Görevler</h1>
        <p className="text-sm text-muted-foreground">
          Gönüllü olduğunuz bölgede doğrulama veya arama destek görevleri.
        </p>
      </header>

      {data?.length ? (
        <div className="space-y-6">
          {data.map((task) => (
            <section key={task.task_id} className="rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">
                    {task.pet_name ?? 'İsimsiz'}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Konum: ~{task.approx_lat}, {task.approx_lon}
                  </p>
                </div>
                <Link href={`/lost/${task.public_code}`} className="text-sm text-blue-600">
                  İlanı gör
                </Link>
              </div>
              {task.message ? <p className="mt-3 text-sm">{task.message}</p> : null}
              <TaskResponseForm taskId={task.task_id} />
            </section>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Şu anda açık görev yok.</p>
      )}
    </main>
  );
}
