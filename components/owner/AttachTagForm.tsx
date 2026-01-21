'use client';

import { useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

interface PetOption {
  id: string;
  name: string;
}

interface AttachTagFormProps {
  tagId: string;
  pets: PetOption[];
}

export default function AttachTagForm({ tagId, pets }: AttachTagFormProps) {
  const [petId, setPetId] = useState(pets[0]?.id ?? '');
  const [status, setStatus] = useState<string | null>(null);

  const handleAttach = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus(null);

    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.rpc('attach_tag_to_pet', {
      tag_id: tagId,
      pet_id: petId,
    });

    if (error) {
      setStatus(error.message);
      return;
    }

    setStatus('Etiket başarıyla bağlandı.');
  };

  return (
    <form className="flex flex-col gap-4" onSubmit={handleAttach}>
      <label className="text-sm text-slate-300" htmlFor="pet-select">
        Bağlanacak pet
      </label>
      <select
        id="pet-select"
        className="rounded-md border border-slate-700 bg-slate-900 px-4 py-3"
        value={petId}
        onChange={(event) => setPetId(event.target.value)}
      >
        {pets.map((pet) => (
          <option key={pet.id} value={pet.id}>
            {pet.name}
          </option>
        ))}
      </select>
      <button className="rounded-md bg-amber-400 px-4 py-3 font-semibold text-slate-950" type="submit">
        Etiketi Bağla
      </button>
      {status ? <p className="text-sm text-emerald-300">{status}</p> : null}
    </form>
  );
}
