import Link from 'next/link';
import AttachTagForm from '@/components/owner/AttachTagForm';
import TagActivationForm from '@/components/owner/TagActivationForm';
import { requireUser } from '@/lib/auth/requireUser';
import { createSupabaseServerClient } from '@/lib/supabase/server';

interface ActivateTagPageProps {
  searchParams?: { tagId?: string };
}

export default async function ActivateTagPage({ searchParams }: ActivateTagPageProps) {
  await requireUser();
  const supabase = createSupabaseServerClient();
  const { data: pets } = await supabase.from('rescue_pets').select('id,name').order('created_at', { ascending: false });
  const tagId = searchParams?.tagId;

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-8 px-6 py-12">
      <header>
        <h1 className="text-3xl font-semibold">Etiket Aktivasyonu</h1>
        <p className="text-slate-300">Etiket kodu ve PIN ile etiketi sahiplenin.</p>
      </header>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
        <TagActivationForm />
      </section>

      {tagId ? (
        <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
          <h2 className="text-xl font-semibold">Etiketi bir pete bağlayın</h2>
          {pets && pets.length > 0 ? (
            <AttachTagForm
              tagId={tagId}
              pets={pets.map((pet) => ({ id: pet.id, name: pet.name }))}
            />
          ) : (
            <p className="text-slate-300">
              Henüz pet yok. Önce{' '}
              <Link className="text-amber-200 underline" href={`/app/pets/new?tagId=${tagId}`}>
                yeni pet ekleyin
              </Link>{' '}
              ve ardından etiketi bağlayın.
            </p>
          )}
        </section>
      ) : null}
    </main>
  );
}
