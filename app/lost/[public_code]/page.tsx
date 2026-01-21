import Link from 'next/link';

import { findSimilarLostPets } from '@/lib/community/similarity';
import { createSupabaseServerClient } from '@/lib/supabase/server';

type Params = { params: { public_code: string } };

export default async function LostPetPage({ params }: Params) {
  const supabase = createSupabaseServerClient();
  const { data: pet } = await supabase
    .from('pets')
    .select('id,display_name,photo_url,last_seen_area')
    .eq('public_code', params.public_code)
    .single();

  const similar = pet ? await findSimilarLostPets(pet.id, 5) : [];

  return (
    <main className="mx-auto max-w-4xl space-y-8 px-4 py-10">
      <section className="space-y-2">
        <h1 className="text-2xl font-semibold">{pet?.display_name ?? 'Kayıp İlanı'}</h1>
        <p className="text-sm text-muted-foreground">{pet?.last_seen_area ?? 'Konum belirtilmedi.'}</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Benzer kayıp ilanlar</h2>
        {similar.length ? (
          <div className="grid gap-3 md:grid-cols-2">
            {similar.map((item) => (
              <Link key={item.pet_id} href={`/lost/${item.public_code}`} className="rounded-lg border p-3">
                <p className="text-sm font-medium">{item.display_name ?? 'İsimsiz'}</p>
                <p className="text-xs text-muted-foreground">{item.last_seen_area ?? 'Bölge yok'}</p>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Benzer ilan bulunamadı.</p>
        )}
      </section>
    </main>
  );
}
