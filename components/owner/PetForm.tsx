'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

export default function PetForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tagId = searchParams.get('tagId');
  const [name, setName] = useState('');
  const [species, setSpecies] = useState('');
  const [notes, setNotes] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus(null);

    const supabase = createSupabaseBrowserClient();
    let photoUrl: string | null = null;

    if (photo) {
      const filePath = `pets/${Date.now()}-${photo.name}`;
      const { error: uploadError } = await supabase.storage.from('pet-photos').upload(filePath, photo, {
        cacheControl: '3600',
        upsert: false,
      });

      if (uploadError) {
        setStatus(uploadError.message);
        return;
      }

      const { data: publicData } = supabase.storage.from('pet-photos').getPublicUrl(filePath);
      photoUrl = publicData.publicUrl;
    }

    const { data, error } = await supabase
      .from('pets')
      .insert({ name, species, notes, photo_url: photoUrl })
      .select('id')
      .single();

    if (error) {
      setStatus(error.message);
      return;
    }

    if (tagId) {
      await supabase.rpc('attach_tag_to_pet', { tag_id: tagId, pet_id: data.id });
    }

    router.push(`/app/pets/${data.id}`);
  };

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      <input
        className="rounded-md border border-slate-700 bg-slate-900 px-4 py-3"
        placeholder="Pet adı"
        value={name}
        onChange={(event) => setName(event.target.value)}
        required
      />
      <input
        className="rounded-md border border-slate-700 bg-slate-900 px-4 py-3"
        placeholder="Tür"
        value={species}
        onChange={(event) => setSpecies(event.target.value)}
      />
      <textarea
        className="min-h-[120px] rounded-md border border-slate-700 bg-slate-900 px-4 py-3"
        placeholder="Notlar"
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
      />
      <input
        className="rounded-md border border-slate-700 bg-slate-900 px-4 py-3"
        type="file"
        accept="image/*"
        onChange={(event) => setPhoto(event.target.files?.[0] ?? null)}
      />
      <button className="rounded-md bg-amber-400 px-4 py-3 font-semibold text-slate-950" type="submit">
        Pet Oluştur
      </button>
      {status ? <p className="text-sm text-rose-300">{status}</p> : null}
    </form>
  );
}
