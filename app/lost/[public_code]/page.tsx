import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';

interface LostPageProps {
  params: { public_code: string };
}

export default async function LostPage({ params }: LostPageProps) {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase.rpc('get_public_pet_by_code', { public_code: params.public_code });
  const pet = data?.[0];

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-6 py-12">
      <header>
        <p className="text-sm text-slate-400">Kayıp ilanı</p>
        <h1 className="text-3xl font-semibold">{pet?.name ?? 'Kayıp Pet'}</h1>
      </header>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
        {pet?.photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="w-full rounded-xl" src={pet.photo_url} alt={pet.name ?? 'Pet'} />
        ) : (
          <div className="flex h-48 items-center justify-center rounded-xl bg-slate-800 text-slate-400">
            Fotoğraf yok
          </div>
        )}
        <div className="mt-4 space-y-2 text-sm text-slate-300">
          <p>
            <span className="font-semibold text-slate-200">Son görülen:</span>{' '}
            {pet?.last_seen_area ?? 'Bilinmiyor'}
          </p>
          <p>
            <span className="font-semibold text-slate-200">Durum:</span> {pet?.status ?? 'Bilinmiyor'}
          </p>
        </div>
      </section>

      <Link
        className="inline-flex w-fit rounded-md bg-amber-400 px-4 py-3 text-sm font-semibold text-slate-950"
        href={`/found/${params.public_code}`}
      >
        Gördüm / Buldum
      </Link>
    </main>
  );
}
