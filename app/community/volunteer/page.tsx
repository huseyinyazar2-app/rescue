'use client';

import { useEffect, useState } from 'react';
import { supabaseClient } from '@/lib/supabase/client';

type Subscription = {
  id: string;
  name: string;
  center_lat: number;
  center_lon: number;
  radius_km: number;
  species_filter: string[];
  notify_lost: boolean;
  notify_found: boolean;
  is_enabled: boolean;
};

export default function VolunteerPage() {
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [isEnabled, setIsEnabled] = useState(true);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    const {
      data: { session },
    } = await supabaseClient.auth.getSession();

    if (!session?.user) {
      setSessionEmail(null);
      setSubscriptions([]);
      setLoading(false);
      return;
    }

    setSessionEmail(session.user.email ?? null);

    const { data: volunteer } = await supabaseClient
      .from('volunteers')
      .select('is_enabled')
      .eq('user_id', session.user.id)
      .maybeSingle();

    if (volunteer) {
      setIsEnabled(volunteer.is_enabled);
    }

    const { data: subs } = await supabaseClient
      .from('volunteer_subscriptions')
      .select('*')
      .order('created_at', { ascending: false });

    setSubscriptions(subs ?? []);
    setLoading(false);
  };

  useEffect(() => {
    void loadData();

    const { data: authListener } = supabaseClient.auth.onAuthStateChange(() => {
      void loadData();
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const sendMagicLink = async () => {
    setStatusMessage(null);
    const { error } = await supabaseClient.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/community/volunteer`,
      },
    });

    if (error) {
      setStatusMessage(error.message);
      return;
    }

    setStatusMessage('Giriş bağlantısı e-posta adresinize gönderildi.');
  };

  const toggleVolunteer = async () => {
    if (!sessionEmail) return;
    setStatusMessage(null);

    const {
      data: { session },
    } = await supabaseClient.auth.getSession();

    if (!session?.user) return;

    const nextValue = !isEnabled;

    const { error } = await supabaseClient
      .from('volunteers')
      .upsert(
        { user_id: session.user.id, is_enabled: nextValue, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' },
      );

    if (error) {
      setStatusMessage(error.message);
      return;
    }

    setIsEnabled(nextValue);
  };

  const createSubscription = async () => {
    setStatusMessage(null);
    const {
      data: { session },
    } = await supabaseClient.auth.getSession();

    if (!session?.user) return;

    const { error } = await supabaseClient.from('volunteer_subscriptions').insert({
      user_id: session.user.id,
      name: 'Yeni Bölge',
      center_lat: 40.99,
      center_lon: 29.03,
      radius_km: 5,
      species_filter: ['cat', 'dog'],
      notify_lost: true,
      notify_found: false,
      is_enabled: true,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      setStatusMessage(error.message);
      return;
    }

    await loadData();
  };

  const updateSubscription = async (id: string, updates: Partial<Subscription>) => {
    setStatusMessage(null);
    const { error } = await supabaseClient
      .from('volunteer_subscriptions')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      setStatusMessage(error.message);
      return;
    }

    await loadData();
  };

  const deleteSubscription = async (id: string) => {
    setStatusMessage(null);
    const { error } = await supabaseClient.from('volunteer_subscriptions').delete().eq('id', id);

    if (error) {
      setStatusMessage(error.message);
      return;
    }

    await loadData();
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <header>
          <h1 className="text-3xl font-semibold text-slate-900">Gönüllü Bildirimleri</h1>
          <p className="mt-2 text-sm text-slate-600">
            Yakın çevrenizdeki kayıp/found ilanları için bildirim almayı seçebilirsiniz. Abonelikler tamamen opt-in ve kolayca
            kapatılabilir.
          </p>
        </header>

        {!sessionEmail ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Gönüllü olmak için giriş yapın</h2>
            <p className="mt-1 text-sm text-slate-600">
              E-posta adresinizi girin, size giriş bağlantısı göndereceğiz.
            </p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="ornek@email.com"
                className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={sendMagicLink}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                Magic link gönder
              </button>
            </div>
          </section>
        ) : (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Merhaba {sessionEmail}</h2>
                <p className="text-sm text-slate-600">Gönüllülük durumunuzu buradan yönetebilirsiniz.</p>
              </div>
              <button
                type="button"
                onClick={async () => {
                  await supabaseClient.auth.signOut();
                }}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600"
              >
                Çıkış yap
              </button>
            </div>

            <div className="mt-6 flex items-center justify-between rounded-xl border border-slate-200 p-4">
              <div>
                <p className="text-sm font-semibold text-slate-900">Gönüllü bildirimleri</p>
                <p className="text-xs text-slate-500">Kayıp ilanlarında e-posta almayı aç/kapat.</p>
              </div>
              <button
                type="button"
                onClick={toggleVolunteer}
                className={`rounded-full px-4 py-2 text-sm ${
                  isEnabled ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                }`}
              >
                {isEnabled ? 'Açık' : 'Kapalı'}
              </button>
            </div>

            <div className="mt-6 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">Abonelikler</h3>
              <button
                type="button"
                onClick={createSubscription}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600"
              >
                Yeni abonelik
              </button>
            </div>

            <div className="mt-4 flex flex-col gap-4">
              {subscriptions.map((sub) => (
                <div key={sub.id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-center justify-between">
                    <input
                      className="text-sm font-semibold text-slate-900"
                      value={sub.name}
                      onChange={(event) => updateSubscription(sub.id, { name: event.target.value })}
                    />
                    <button
                      type="button"
                      onClick={() => deleteSubscription(sub.id)}
                      className="text-xs text-red-600"
                    >
                      Sil
                    </button>
                  </div>
                  <div className="mt-3 grid gap-3 text-xs text-slate-600 sm:grid-cols-2">
                    <label className="flex flex-col gap-1">
                      Merkez enlem
                      <input
                        type="number"
                        value={sub.center_lat}
                        onChange={(event) => updateSubscription(sub.id, { center_lat: Number(event.target.value) })}
                        className="rounded-lg border border-slate-200 px-2 py-1"
                      />
                    </label>
                    <label className="flex flex-col gap-1">
                      Merkez boylam
                      <input
                        type="number"
                        value={sub.center_lon}
                        onChange={(event) => updateSubscription(sub.id, { center_lon: Number(event.target.value) })}
                        className="rounded-lg border border-slate-200 px-2 py-1"
                      />
                    </label>
                    <label className="flex flex-col gap-1">
                      Yarıçap (km)
                      <input
                        type="number"
                        value={sub.radius_km}
                        onChange={(event) => updateSubscription(sub.id, { radius_km: Number(event.target.value) })}
                        className="rounded-lg border border-slate-200 px-2 py-1"
                      />
                    </label>
                    <label className="flex flex-col gap-1">
                      Tür filtresi
                      <select
                        value={sub.species_filter.join(',')}
                        onChange={(event) =>
                          updateSubscription(sub.id, { species_filter: event.target.value.split(',') })
                        }
                        className="rounded-lg border border-slate-200 px-2 py-1"
                      >
                        <option value="cat,dog">Kedi + Köpek</option>
                        <option value="cat">Sadece Kedi</option>
                        <option value="dog">Sadece Köpek</option>
                      </select>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={sub.notify_lost}
                        onChange={(event) => updateSubscription(sub.id, { notify_lost: event.target.checked })}
                      />
                      Kayıp bildirimi
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={sub.notify_found}
                        onChange={(event) => updateSubscription(sub.id, { notify_found: event.target.checked })}
                      />
                      Bulundu bildirimi
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={sub.is_enabled}
                        onChange={(event) => updateSubscription(sub.id, { is_enabled: event.target.checked })}
                      />
                      Abonelik açık
                    </label>
                  </div>
                </div>
              ))}

              {subscriptions.length === 0 && !loading && (
                <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
                  Henüz abonelik yok. “Yeni abonelik” ile başlayabilirsiniz.
                </div>
              )}
            </div>
          </section>
        )}

        <section className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
          <h3 className="text-base font-semibold text-slate-900">E-posta bildirimleri hakkında</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Bildirimler sadece opt-in abonelikler için gönderilir.</li>
            <li>İstediğiniz zaman aboneliği kapatabilir veya silebilirsiniz.</li>
            <li>Konum hassasiyeti için tam koordinatlar paylaşılmaz, yalnızca yaklaşık bölge kullanılır.</li>
          </ul>
        </section>

        {statusMessage && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">{statusMessage}</div>
        )}
      </div>
    </main>
  );
}
