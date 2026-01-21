import Link from 'next/link';

export default function CommunityTasksPage() {
  return (
    <main className="mx-auto max-w-3xl space-y-8 px-4 py-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Yakınımdaki Gönüllü Görevleri</h1>
        <p className="text-sm text-muted-foreground">
          Bu sayfa sadece giriş yapan gönüllülere açıktır. Yakınınızdaki açık görevleri
          buradan görüntüleyebilir ve geri bildirim bırakabilirsiniz.
        </p>
      </header>

      <section className="space-y-4 rounded-lg border p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Açık Görevler</h2>
          <Link className="text-sm text-blue-600" href="/community">
            Haritaya dön
          </Link>
        </div>
        <div className="space-y-4">
          <article className="rounded-md border p-4">
            <h3 className="text-base font-semibold">Kayıp Kedi - Maviş</h3>
            <p className="text-sm text-muted-foreground">
              Son görülme alanı: Kadıköy çevresi. 3 km içinde teyit rica ediyoruz.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button className="rounded-full border px-3 py-1 text-sm">Gördüm</button>
              <button className="rounded-full border px-3 py-1 text-sm">Görmedim</button>
              <button className="rounded-full border px-3 py-1 text-sm">Belki</button>
            </div>
          </article>

          <article className="rounded-md border p-4">
            <h3 className="text-base font-semibold">Kayıp Köpek - Boncuk</h3>
            <p className="text-sm text-muted-foreground">
              Park çevresinde destek isteyen owner için kısa not bırakabilirsiniz.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button className="rounded-full border px-3 py-1 text-sm">Yardım edebilirim</button>
              <button className="rounded-full border px-3 py-1 text-sm">Şu an uygun değilim</button>
            </div>
          </article>
        </div>
      </section>
    </main>
  );
}
