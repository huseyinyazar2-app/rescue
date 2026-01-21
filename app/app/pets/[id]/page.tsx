import Link from 'next/link';
import { notFound } from 'next/navigation';
import PetDetailForm from '@/components/owner/PetDetailForm';
import SightingsList from '@/components/owner/SightingsList';
import { requireUser } from '@/lib/auth/requireUser';
import { createSupabaseServerClient } from '@/lib/supabase/server';

interface PetDetailPageProps {
  params: { id: string };
}

export default async function PetDetailPage({ params }: PetDetailPageProps) {
  await requireUser();
  const supabase = createSupabaseServerClient();
  const { data: pet } = await supabase
    .from('rescue_pets')
    .select('id,name,species,notes,photo_url,status,last_seen_area,tag_id')
    .eq('id', params.id)
    .single();

  if (!pet) {
    notFound();
  }

  const { data: overview } = await supabase.rpc('get_owner_pet_overview');
  const petOverview = overview?.find((entry) => entry.pet_id === pet.id);

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-8 px-6 py-12">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">{pet.name}</h1>
          <p className="text-slate-300">Etiket kodu: {petOverview?.tag_public_code ?? 'Bağlı değil'}</p>
        </div>
        <Link className="rounded-md border border-slate-700 px-4 py-2 text-sm" href={`/app/pets/${pet.id}/share`}>
          Paylaşım Paketine Git
        </Link>
      </header>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
        <PetDetailForm
          id={pet.id}
          name={pet.name}
          species={pet.species}
          notes={pet.notes}
          photoUrl={pet.photo_url}
          status={pet.status}
          lastSeenArea={pet.last_seen_area}
        />
      </section>

      <SightingsList petId={pet.id} />
    </main>
  );
}
