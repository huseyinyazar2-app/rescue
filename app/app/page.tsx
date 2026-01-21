import Link from 'next/link';
import PetCard from '@/components/owner/PetCard';
import { requireUser } from '@/lib/auth/requireUser';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export default async function OwnerDashboardPage() {
  await requireUser();
  const supabase = createSupabaseServerClient();
  const { data } = await supabase.rpc('get_owner_pet_overview');

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-8 px-6 py-12">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Kedi Sahibi Paneli</h1>
          <p className="text-slate-300">Etiketlerinizi yönetin, kayıp modunu açın ve bildirimleri takip edin.</p>
        </div>
        <div className="flex gap-3">
          <Link
            className="rounded-md border border-amber-400 px-4 py-2 text-sm font-semibold text-amber-200"
            href="/app/activate-tag"
          >
            Etiket Aktivasyonu
          </Link>
          <Link className="rounded-md bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-950" href="/app/pets/new">
            Yeni Pet Ekle
          </Link>
        </div>
      </header>

      <section className="grid gap-5 md:grid-cols-2">
        {data && data.length > 0 ? (
          data.map((pet) => (
            <PetCard
              key={pet.pet_id}
              id={pet.pet_id}
              name={pet.name}
              species={pet.species}
              photoUrl={pet.photo_url}
              status={pet.status}
              tagPublicCode={pet.tag_public_code}
              lastSeenArea={pet.last_seen_area}
            />
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-700 p-6 text-slate-300">
            Henüz pet eklemediniz. “Yeni Pet Ekle” ile başlayabilirsiniz.
          </div>
        )}
      </section>
    </main>
  );
}
