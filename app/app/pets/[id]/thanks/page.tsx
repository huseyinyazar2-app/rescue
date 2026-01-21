import Link from 'next/link';

type PageProps = {
  params: { id: string };
};

export default function PetThanksPage({ params }: PageProps) {
  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Teşekkür Paylaşımı</h1>
        <p className="text-sm text-muted-foreground">
          Kahraman paylaşımı sadece açık rıza ile yapılır. İsterseniz anonim paylaşabilirsiniz.
        </p>
        <Link className="text-sm text-blue-600" href={`/app/pets/${params.id}`}>
          İlan detayına dön
        </Link>
      </header>

      <section className="space-y-4 rounded-lg border p-4">
        <label className="block text-sm font-medium" htmlFor="thanks-message">
          Teşekkür mesajı
        </label>
        <textarea
          id="thanks-message"
          className="h-32 w-full rounded-md border px-3 py-2"
          placeholder="Gönüllülere ve destek olanlara teşekkür edin..."
        />

        <div className="space-y-2">
          <span className="text-sm font-medium">Kahraman görünürlüğü</span>
          <div className="flex flex-col gap-2 text-sm">
            <label className="flex items-center gap-2">
              <input type="radio" name="hero" defaultChecked />
              Anonim
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" name="hero" />
              Finder (opt-in ise)
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" name="hero" />
              Gönüllü (rumuz ile)
            </label>
          </div>
        </div>

        <button className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white">
          Paylaşımı yayınla
        </button>
      </section>

      <section className="rounded-lg border p-4">
        <h2 className="text-lg font-medium">Günün Kahramanı Kartı</h2>
        <p className="text-sm text-muted-foreground">
          Bu kart yalnızca onaylı teşekkür paylaşımlarından oluşur.
        </p>
        <div className="mt-3 rounded-md border border-dashed p-6 text-center text-sm">
          Kart önizlemesi (PNG) burada üretilecek.
        </div>
      </section>
    </main>
  );
}
