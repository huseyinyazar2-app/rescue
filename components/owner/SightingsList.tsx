'use client';

import { useEffect, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

interface SightingsListProps {
  petId: string;
}

interface Sighting {
  id: string;
  created_at: string;
  approx_lat: number | null;
  approx_lon: number | null;
  location_accuracy_m: number | null;
  message: string | null;
  photo_url: string | null;
}

export default function SightingsList({ petId }: SightingsListProps) {
  const [items, setItems] = useState<Sighting[]>([]);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const supabase = createSupabaseBrowserClient();
      const { data, error } = await supabase.rpc('get_owner_sightings', { pet_id: petId });

      if (error) {
        setStatus(error.message);
        return;
      }

      setItems(data ?? []);
    };

    void load();
  }, [petId]);

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-xl font-semibold">Bulundu Bildirimleri</h2>
      {status ? <p className="text-sm text-rose-300">{status}</p> : null}
      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-700 p-6 text-slate-300">
          Henüz bildirim yok.
        </div>
      ) : (
        <div className="grid gap-4">
          {items.map((item) => (
            <article key={item.id} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm text-slate-300">
                  {new Date(item.created_at).toLocaleString('tr-TR')}
                </p>
                <p className="text-xs text-slate-400">
                  Yaklaşık konum: {item.approx_lat ?? '--'},{item.approx_lon ?? '--'}
                </p>
              </div>
              {item.photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img className="mt-4 w-full rounded-xl" src={item.photo_url} alt="Bulunma fotoğrafı" />
              ) : null}
              {item.message ? <p className="mt-4 text-sm text-slate-200">{item.message}</p> : null}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
