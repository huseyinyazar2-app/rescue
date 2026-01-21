import CommunityList from './CommunityList';

export default function CommunityPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto max-w-5xl px-4 pt-10">
        <h1 className="text-3xl font-semibold text-slate-900">Topluluk İlanları</h1>
        <p className="mt-2 text-sm text-slate-600">
          Son 7 gün içindeki kayıp ilanlarını inceleyin veya konum izni vererek yakındaki ilanları görüntüleyin.
        </p>
      </section>
      <CommunityList defaultMode="recent" />
    </main>
  );
}
