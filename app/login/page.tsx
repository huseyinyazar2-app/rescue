'use client';

import { useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<string | null>(null);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/app`,
      },
    });

    if (error) {
      setStatus(error.message);
      return;
    }

    setStatus('Mail gönderildi. Lütfen gelen kutunuzu kontrol edin.');
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="text-3xl font-semibold">MatrixC Rescue</h1>
      <p className="text-slate-300">Kedi sahibi paneline giriş yapın.</p>
      <form className="flex w-full flex-col gap-4" onSubmit={handleLogin}>
        <input
          className="w-full rounded-md border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100"
          type="email"
          placeholder="E-posta"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <button
          className="rounded-md bg-amber-400 px-4 py-3 font-semibold text-slate-950"
          type="submit"
        >
          Magic link gönder
        </button>
      </form>
      {status ? <p className="text-sm text-slate-300">{status}</p> : null}
    </main>
  );
}
