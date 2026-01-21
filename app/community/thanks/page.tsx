import { createSupabaseServerClient } from '@/lib/supabase/server';

export default async function CommunityThanksPage() {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase
    .from('thanks_posts')
    .select('id,message,hero_kind,hero_display_name,created_at,pet_id')
    .eq('is_published', true)
    .eq('is_hidden', false)
    .gte('published_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
    .order('published_at', { ascending: false });

  const heroOfDay = data?.[0];

  return (
    <main className="mx-auto max-w-3xl space-y-8 px-4 py-10">
      <header>
        <h1 className="text-2xl font-semibold">Teşekkürler</h1>
        <p className="text-sm text-muted-foreground">
          Son 30 günde paylaşılmış teşekkür postları.
        </p>
      </header>

      {heroOfDay ? (
        <section className="rounded-lg border bg-yellow-50 p-4">
          <p className="text-xs uppercase text-yellow-700">Günün Kahramanı</p>
          <p className="mt-1 text-lg font-semibold">
            {heroOfDay.hero_display_name ?? 'Anonim Kahraman'}
          </p>
          {heroOfDay.message ? <p className="text-sm">{heroOfDay.message}</p> : null}
        </section>
      ) : null}

      <section className="space-y-4">
        {data?.length ? (
          data.map((post) => (
            <article key={post.id} className="rounded-lg border p-4">
              <p className="text-sm">{post.message ?? 'Teşekkürler!'}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                {post.hero_display_name ?? 'Anonim Kahraman'}
              </p>
            </article>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">Henüz teşekkür paylaşımı yok.</p>
        )}
      </section>
    </main>
  );
}
