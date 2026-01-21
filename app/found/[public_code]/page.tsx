import Link from 'next/link';

interface FoundPageProps {
  params: { public_code: string };
}

export default function FoundPage({ params }: FoundPageProps) {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-6 py-12 text-center">
      <h1 className="text-3xl font-semibold">Gördüm / Buldum</h1>
      <p className="text-slate-300">
        Bu sayfa Part 3 ile tamamlanacak. Şimdilik sadece placeholder.
      </p>
      <Link className="text-amber-200 underline" href={`/lost/${params.public_code}`}>
        Kayıp ilanına geri dön
      </Link>
    </main>
  );
}
