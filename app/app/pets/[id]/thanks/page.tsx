import { createSupabaseServerClient } from '@/lib/supabase/server';

type Params = { params: { id: string } };

type ResponseRow = {
  id: string;
  response_type: string;
  message: string | null;
  created_at: string;
};

export default async function OwnerThanksPage({ params }: Params) {
  const supabase = createSupabaseServerClient();

  const { data: rescue_sightings } = await supabase
    .from('rescue_sightings')
    .select('id,hero_opt_in,hero_display_name')
    .eq('pet_id', params.id)
    .order('created_at', { ascending: false });

  const { data: responses } = await supabase
    .from('rescue_volunteer_task_responses')
    .select('id,response_type,message,created_at')
    .order('created_at', { ascending: false });

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      <header>
        <h1 className="text-2xl font-semibold">Teşekkür Postu</h1>
        <p className="text-sm text-muted-foreground">Bulundu paylaşımınızı hazırlayın.</p>
      </header>

      <form action="/api/thanks/publish" method="post" className="space-y-4">
        <input type="hidden" name="petId" value={params.id} />
        <textarea
          className="w-full rounded-md border p-2 text-sm"
          name="message"
          rows={4}
          placeholder="Teşekkür mesajınızı yazın"
        />

        <div className="space-y-2">
          <p className="text-sm font-medium">Kahraman seçimi</p>
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" name="heroKind" value="anonymous" defaultChecked />
            Anonim
          </label>
          {rescue_sightings?.map((sighting) => (
            <label key={sighting.id} className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="heroKind"
                value={`finder:${sighting.id}`}
                disabled={!sighting.hero_opt_in || !sighting.hero_display_name}
              />
              Finder: {sighting.hero_display_name ?? 'Anonim'}
            </label>
          ))}
          {responses?.map((response: ResponseRow) => (
            <label key={response.id} className="flex items-center gap-2 text-sm">
              <input type="radio" name="heroKind" value={`volunteer:${response.id}`} />
              Gönüllü: {response.response_type}
            </label>
          ))}
        </div>

        <button className="rounded-md bg-green-600 px-4 py-2 text-sm text-white">
          Yayınla
        </button>
      </form>
    </main>
  );
}
