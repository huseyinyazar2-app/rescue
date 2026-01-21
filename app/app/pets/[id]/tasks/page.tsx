import { createSupabaseServerClient } from '@/lib/supabase/server';

type Params = { params: { id: string } };

export default async function OwnerTasksPage({ params }: Params) {
  const supabase = createSupabaseServerClient();
  const { data: tasks } = await supabase
    .from('rescue_volunteer_tasks')
    .select('id,status,created_at,message,rescue_volunteer_task_responses(id,response_type,message,created_at)')
    .eq('pet_id', params.id)
    .order('created_at', { ascending: false });

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      <header>
        <h1 className="text-2xl font-semibold">Gönüllü Görevleri</h1>
        <p className="text-sm text-muted-foreground">Görev yanıtlarını buradan izleyin.</p>
      </header>

      {tasks?.length ? (
        tasks.map((task) => (
          <section key={task.id} className="rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">{task.status}</h2>
                <p className="text-xs text-muted-foreground">
                  {new Date(task.created_at).toLocaleString()}
                </p>
              </div>
              <form action="/api/tasks/close" method="post">
                <input type="hidden" name="taskId" value={task.id} />
                <button className="rounded-md border px-3 py-1 text-xs">Task kapat</button>
              </form>
            </div>
            {task.message ? <p className="mt-2 text-sm">{task.message}</p> : null}
            <div className="mt-4 space-y-2">
              {task.rescue_volunteer_task_responses?.length ? (
                task.rescue_volunteer_task_responses.map((response) => (
                  <div key={response.id} className="rounded-md bg-gray-50 p-2 text-sm">
                    <strong>{response.response_type}</strong>
                    {response.message ? <p>{response.message}</p> : null}
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground">Henüz yanıt yok.</p>
              )}
            </div>
          </section>
        ))
      ) : (
        <p className="text-sm text-muted-foreground">Henüz görev yok.</p>
      )}
    </main>
  );
}
