import Link from 'next/link';

export default function CommunityThanksPage() {
  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Teşekkür Paylaşımları</h1>
        <p className="text-sm text-muted-foreground">
          Son 30 günde yayınlanan teşekkür gönderileri burada listelenir.
        </p>
        <Link className="text-sm text-blue-600" href="/community">
          Topluluk sayfasına dön
        </Link>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-lg border p-4">
          <h2 className="text-lg font-semibold">Maviş bulundu!</h2>
          <p className="text-sm text-muted-foreground">
            Kahraman: Anonim
          </p>
          <p className="mt-2 text-sm">
            “Gönüllüler sayesinde kısa sürede bulduk. Herkese teşekkürler!”
          </p>
        </article>

        <article className="rounded-lg border p-4">
          <h2 className="text-lg font-semibold">Boncuk eve döndü</h2>
          <p className="text-sm text-muted-foreground">
            Kahraman: Rumuz ile gönüllü
          </p>
          <p className="mt-2 text-sm">
            “Paylaşan ve arayan herkese minnettarız.”
          </p>
        </article>
      </section>

      <section className="rounded-lg border p-4">
        <h2 className="text-lg font-semibold">Günün Kahramanı</h2>
        <div className="mt-3 flex items-center justify-between rounded-md bg-muted/30 p-4 text-sm">
          <span>Bugünün teşekkür kartı</span>
          <button className="rounded-full border px-3 py-1">Kartı indir</button>
        </div>
      </section>
    </main>
  );
}
