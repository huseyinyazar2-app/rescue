'use client';

import { useEffect, useState } from 'react';
import { supabaseClient } from '@/lib/supabase/client';

const defaultVisibility = {
  show_name: true,
  show_photo: true,
  show_blurb: true,
  show_area_text: true,
};

type PetRecord = {
  id: string;
  name: string;
  species: string;
  status: string;
  is_public: boolean;
  public_blurb: string | null;
  last_seen_area: string | null;
  last_seen_lat: number | null;
  last_seen_lon: number | null;
  last_seen_radius_km: number | null;
  public_visibility: Record<string, boolean> | null;
};

export default function PetOwnerPage({ params }: { params: { id: string } }) {
  const [pet, setPet] = useState<PetRecord | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadPet = async () => {
    setLoading(true);
    const { data, error } = await supabaseClient
      .from('pets')
      .select(
        'id,name,species,status,is_public,public_blurb,last_seen_area,last_seen_lat,last_seen_lon,last_seen_radius_km,public_visibility',
      )
      .eq('id', params.id)
      .single();

    if (error) {
      setStatusMessage(error.message);
      setLoading(false);
      return;
    }

    setPet(data as PetRecord);
    setLoading(false);
  };

  useEffect(() => {
    void loadPet();
  }, []);

  const updatePet = async (updates: Partial<PetRecord>) => {
    if (!pet) return;
    setStatusMessage(null);

    const { error } = await supabaseClient.from('pets').update(updates).eq('id', pet.id);

    if (error) {
      setStatusMessage(error.message);
      return;
    }

    setPet({ ...pet, ...updates });
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-12 text-sm text-slate-500">Yükleniyor...</main>
    );
  }

  if (!pet) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-12 text-sm text-slate-500">Kayıt bulunamadı.</main>
    );
  }

  const visibility = { ...defaultVisibility, ...(pet.public_visibility ?? {}) };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12">
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <header>
          <h1 className="text-2xl font-semibold text-slate-900">{pet.name} - İlan Ayarları</h1>
          <p className="mt-1 text-sm text-slate-600">
            Toplulukta paylaşım ve görünürlük ayarlarını buradan yönetebilirsiniz.
          </p>
        </header>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900">Toplulukta paylaş</p>
              <p className="text-xs text-slate-500">İlanınız topluluk listelerinde görünecek.</p>
            </div>
            <button
              type="button"
              onClick={() => updatePet({ is_public: !pet.is_public })}
              className={`rounded-full px-4 py-2 text-sm ${
                pet.is_public ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
              }`}
            >
              {pet.is_public ? 'Açık' : 'Kapalı'}
            </button>
          </div>

          <div className="mt-6 grid gap-4">
            <label className="text-sm font-medium text-slate-700">Kısa public açıklama</label>
            <textarea
              value={pet.public_blurb ?? ''}
              onChange={(event) => updatePet({ public_blurb: event.target.value })}
              className="min-h-[80px] rounded-xl border border-slate-200 px-3 py-2 text-sm"
            />
          </div>

          <div className="mt-6 grid gap-3">
            <p className="text-sm font-semibold text-slate-900">Görünürlük ayarları</p>
            {(
              [
                { key: 'show_name', label: 'İsim' },
                { key: 'show_photo', label: 'Fotoğraf' },
                { key: 'show_blurb', label: 'Açıklama' },
                { key: 'show_area_text', label: 'Bölge metni' },
              ] as const
            ).map((item) => (
              <label key={item.key} className="flex items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={visibility[item.key]}
                  onChange={(event) =>
                    updatePet({
                      public_visibility: { ...visibility, [item.key]: event.target.checked },
                    })
                  }
                />
                {item.label} göster
              </label>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Yaklaşık konum</h2>
          <p className="mt-1 text-sm text-slate-600">
            Kayıp durumu için last_seen_area zorunludur. Konum noktası eklemeniz önerilir.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm text-slate-600">
              Son görülen bölge
              <input
                value={pet.last_seen_area ?? ''}
                onChange={(event) => updatePet({ last_seen_area: event.target.value })}
                className="rounded-lg border border-slate-200 px-3 py-2"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm text-slate-600">
              Yarıçap (km)
              <input
                type="number"
                value={pet.last_seen_radius_km ?? 2}
                onChange={(event) => updatePet({ last_seen_radius_km: Number(event.target.value) })}
                className="rounded-lg border border-slate-200 px-3 py-2"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm text-slate-600">
              Enlem
              <input
                type="number"
                value={pet.last_seen_lat ?? ''}
                onChange={(event) => updatePet({ last_seen_lat: Number(event.target.value) })}
                className="rounded-lg border border-slate-200 px-3 py-2"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm text-slate-600">
              Boylam
              <input
                type="number"
                value={pet.last_seen_lon ?? ''}
                onChange={(event) => updatePet({ last_seen_lon: Number(event.target.value) })}
                className="rounded-lg border border-slate-200 px-3 py-2"
              />
            </label>
          </div>
        </section>

        {statusMessage && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">{statusMessage}</div>
        )}
      </div>
    </main>
  );
}
