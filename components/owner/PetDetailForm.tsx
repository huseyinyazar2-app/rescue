'use client';

import { useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

interface PetDetailFormProps {
  id: string;
  name: string;
  species: string | null;
  notes: string | null;
  photoUrl: string | null;
  status: string | null;
  lastSeenArea: string | null;
}

export default function PetDetailForm({
  id,
  name,
  species,
  notes,
  photoUrl,
  status,
  lastSeenArea,
}: PetDetailFormProps) {
  const [formState, setFormState] = useState({
    name,
    species: species ?? '',
    notes: notes ?? '',
    status: status ?? 'normal',
    lastSeenArea: lastSeenArea ?? '',
    photoUrl: photoUrl ?? '',
  });
  const [message, setMessage] = useState<string | null>(null);

  const handleChange = (key: string, value: string) => {
    setFormState((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);

    if (formState.status === 'lost' && !formState.lastSeenArea.trim()) {
      setMessage('Kayıp modunda son görülen alan zorunludur.');
      return;
    }

    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase
      .from('rescue_pets')
      .update({
        name: formState.name,
        species: formState.species,
        notes: formState.notes,
        status: formState.status,
        last_seen_area: formState.lastSeenArea,
        photo_url: formState.photoUrl,
      })
      .eq('id', id);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage('Pet bilgileri güncellendi.');
  };

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSave}>
      <label className="text-sm text-slate-300" htmlFor="name">
        Pet adı
      </label>
      <input
        id="name"
        className="rounded-md border border-slate-700 bg-slate-900 px-4 py-3"
        value={formState.name}
        onChange={(event) => handleChange('name', event.target.value)}
      />

      <label className="text-sm text-slate-300" htmlFor="species">
        Tür
      </label>
      <input
        id="species"
        className="rounded-md border border-slate-700 bg-slate-900 px-4 py-3"
        value={formState.species}
        onChange={(event) => handleChange('species', event.target.value)}
      />

      <label className="text-sm text-slate-300" htmlFor="notes">
        Notlar
      </label>
      <textarea
        id="notes"
        className="min-h-[120px] rounded-md border border-slate-700 bg-slate-900 px-4 py-3"
        value={formState.notes}
        onChange={(event) => handleChange('notes', event.target.value)}
      />

      <label className="text-sm text-slate-300" htmlFor="photoUrl">
        Fotoğraf URL
      </label>
      <input
        id="photoUrl"
        className="rounded-md border border-slate-700 bg-slate-900 px-4 py-3"
        value={formState.photoUrl}
        onChange={(event) => handleChange('photoUrl', event.target.value)}
      />

      <label className="text-sm text-slate-300" htmlFor="status">
        Durum
      </label>
      <select
        id="status"
        className="rounded-md border border-slate-700 bg-slate-900 px-4 py-3"
        value={formState.status}
        onChange={(event) => handleChange('status', event.target.value)}
      >
        <option value="normal">Normal</option>
        <option value="lost">Kayıp</option>
        <option value="found">Bulundu</option>
      </select>

      {formState.status === 'lost' ? (
        <div className="flex flex-col gap-2">
          <label className="text-sm text-slate-300" htmlFor="lastSeenArea">
            Son görülen alan
          </label>
          <input
            id="lastSeenArea"
            className="rounded-md border border-rose-500/60 bg-slate-900 px-4 py-3"
            value={formState.lastSeenArea}
            onChange={(event) => handleChange('lastSeenArea', event.target.value)}
          />
        </div>
      ) : null}

      <button className="rounded-md bg-amber-400 px-4 py-3 font-semibold text-slate-950" type="submit">
        Kaydet
      </button>
      {message ? <p className="text-sm text-emerald-300">{message}</p> : null}
    </form>
  );
}
