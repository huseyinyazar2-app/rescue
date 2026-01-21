import CommunityList from '../CommunityList';

export default function CommunityLostPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto max-w-5xl px-4 pt-10">
        <h1 className="text-3xl font-semibold text-slate-900">Kayıp İlanları</h1>
        <p className="mt-2 text-sm text-slate-600">
          Kayıp ilanlarını filtreleyin ve güvenli paylaşım ilkelerine uygun şekilde yardımcı olun.
        </p>
      </section>
      <CommunityList defaultMode="recent" />
    </main>
  );
}
