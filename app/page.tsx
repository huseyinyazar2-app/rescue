import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col items-start justify-center gap-4 px-6 py-16">
      <h1 className="text-3xl font-semibold">MatrixC Rescue</h1>
      <p className="text-slate-600">Admin console scaffolding is available at /admin.</p>
      <Link className="text-blue-600 hover:underline" href="/admin">
        Go to Admin Console
      </Link>
    </main>
  );
}
