import Link from 'next/link';

export default function LostPetPage() {
  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <section className="rounded-lg border p-4">
        <h1 className="text-2xl font-semibold">Kayıp ilan</h1>
        <p className="text-sm text-muted-foreground">
          Kayıp ilan detayları burada listelenir.
        </p>
      </section>

      <section className="space-y-4 rounded-lg border p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Benzer kayıp ilanlar</h2>
          <Link className="text-sm text-blue-600" href="/community">
            Tüm ilanları gör
          </Link>
        </div>
        <ul className="space-y-3 text-sm">
          <li className="rounded-md border p-3">Yakındaki benzer ilan #1</li>
          <li className="rounded-md border p-3">Yakındaki benzer ilan #2</li>
        </ul>
      </section>
    </main>
  );
}
