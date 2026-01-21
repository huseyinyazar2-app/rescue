import Link from 'next/link';

type PageProps = {
  params: { id: string };
};

export default function PetTasksPage({ params }: PageProps) {
  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Görev Yanıtları</h1>
        <p className="text-sm text-muted-foreground">
          Gönüllülerin geri bildirimleri sadece size görünür. Uygun olduğunda görevi kapatabilirsiniz.
        </p>
        <Link className="text-sm text-blue-600" href={`/app/pets/${params.id}`}>
          İlan detayına dön
        </Link>
      </header>

      <section className="space-y-4 rounded-lg border p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Açık Görevler</h2>
          <button className="rounded-md border px-3 py-1 text-sm">Görevi kapat</button>
        </div>
        <div className="space-y-3">
          <article className="rounded-md border p-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold">Yakınlarda görüldü doğrulama</h3>
              <span className="text-xs text-muted-foreground">2 yanıt</span>
            </div>
            <ul className="mt-2 space-y-2 text-sm">
              <li className="rounded-md bg-muted/30 p-2">
                <strong>Gördüm</strong> — “Parkın kuzeyinde olabilir.”
              </li>
              <li className="rounded-md bg-muted/30 p-2">
                <strong>Görmedim</strong> — “Sabah yürüyüşünde rastlamadım.”
              </li>
            </ul>
          </article>
        </div>
      </section>
    </main>
  );
}
