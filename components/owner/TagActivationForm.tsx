'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

export default function TagActivationForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [publicCode, setPublicCode] = useState('');
  const [pin, setPin] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setStatus(null);

    const supabase = createSupabaseBrowserClient();
    const { data, error } = await supabase.rpc('claim_tag', {
      public_code: publicCode,
      pin,
    });

    if (error) {
      setStatus(error.message);
      setLoading(false);
      return;
    }

    const redirectTarget = searchParams.get('redirect') ?? '/app/activate-tag';
    router.push(`${redirectTarget}?tagId=${data}`);
  };

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      <input
        className="rounded-md border border-slate-700 bg-slate-900 px-4 py-3"
        placeholder="Etiket kodu"
        value={publicCode}
        onChange={(event) => setPublicCode(event.target.value)}
        required
      />
      <input
        className="rounded-md border border-slate-700 bg-slate-900 px-4 py-3"
        placeholder="PIN"
        type="password"
        value={pin}
        onChange={(event) => setPin(event.target.value)}
        required
      />
      <button
        className="rounded-md bg-amber-400 px-4 py-3 font-semibold text-slate-950"
        type="submit"
        disabled={loading}
      >
        {loading ? 'Aktif ediliyor...' : 'Etiketi Aktif Et'}
      </button>
      {status ? <p className="text-sm text-rose-300">{status}</p> : null}
    </form>
  );
}
