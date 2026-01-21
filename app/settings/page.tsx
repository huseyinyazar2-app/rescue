import { requireUser } from '@/lib/auth/requireUser';

export default async function SettingsPage() {
  await requireUser();

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-8 px-6 py-12">
      <header>
        <h1 className="text-3xl font-semibold">Ayarlar</h1>
        <p className="text-slate-300">Bildirim ve gizlilik tercihlerinizi yönetin.</p>
      </header>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
        <h2 className="text-xl font-semibold">Bildirim tercihleri</h2>
        <div className="mt-4 space-y-4 text-sm text-slate-300">
          <label className="flex items-center gap-3">
            <input className="h-4 w-4" type="checkbox" checked readOnly />
            E-posta ile bildirim al (zorunlu)
          </label>
          <label className="flex items-center gap-3">
            <input className="h-4 w-4" type="checkbox" />
            Kayıp modundayken yeni bildirim olduğunda e-posta gönder
          </label>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
        <h2 className="text-xl font-semibold">Gizlilik</h2>
        <p className="mt-2 text-sm text-slate-300">Kayıp ilan sayfasında hangi bilgiler görünsün?</p>
        <div className="mt-4 grid gap-3 text-sm text-slate-300">
          <label className="flex items-center gap-3">
            <input className="h-4 w-4" type="checkbox" checked readOnly />
            Pet adı
          </label>
          <label className="flex items-center gap-3">
            <input className="h-4 w-4" type="checkbox" checked readOnly />
            Fotoğraf
          </label>
          <label className="flex items-center gap-3">
            <input className="h-4 w-4" type="checkbox" />
            Tür
          </label>
          <label className="flex items-center gap-3">
            <input className="h-4 w-4" type="checkbox" />
            Notlar
          </label>
        </div>
      </section>
    </main>
  );
}
