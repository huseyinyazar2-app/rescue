import Link from 'next/link';
import { notFound } from 'next/navigation';
import SharePoster from '@/components/owner/SharePoster';
import { requireUser } from '@/lib/auth/requireUser';
import { createSupabaseServerClient } from '@/lib/supabase/server';

interface PetSharePageProps {
  params: { id: string };
}

export default async function PetSharePage({ params }: PetSharePageProps) {
  await requireUser();
  const supabase = createSupabaseServerClient();
  const { data: pet } = await supabase
    .from('pets')
    .select('id,name,photo_url,last_seen_area,tag_id')
    .eq('id', params.id)
    .single();

  if (!pet) {
    notFound();
  }

  const { data: overview } = await supabase.rpc('get_owner_pet_overview');
  const petOverview = overview?.find((entry) => entry.pet_id === pet.id);
  const publicCode = petOverview?.tag_public_code;
  const lostUrl = publicCode ? `/lost/${publicCode}` : '/lost/unknown';
  const whatsappText = `${pet.name} kayıp. Son görülen: ${pet.last_seen_area ?? 'Bilinmiyor'}. ` +
    `Görenler: ${lostUrl}`;

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-8 px-6 py-12">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Paylaşım Paketi</h1>
          <p className="text-slate-300">Kayıp ilan linkini ve posteri paylaşın.</p>
        </div>
        <Link className="rounded-md border border-slate-700 px-4 py-2 text-sm" href={`/app/pets/${pet.id}`}>
          Pet Detayına Dön
        </Link>
      </header>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
        <h2 className="text-xl font-semibold">Kayıp ilan linki</h2>
        <p className="mt-2 text-sm text-slate-300">Paylaşılacak link: {lostUrl}</p>
        <a className="mt-3 inline-flex text-amber-200 underline" href={lostUrl}>
          Linki aç
        </a>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
        <h2 className="text-xl font-semibold">WhatsApp metni</h2>
        <p className="mt-2 rounded-md border border-slate-800 bg-slate-950 p-4 text-sm text-slate-200">
          {whatsappText}
        </p>
      </section>

      <SharePoster petName={pet.name} lastSeenArea={pet.last_seen_area} photoUrl={pet.photo_url} lostUrl={lostUrl} />
    </main>
  );
}
