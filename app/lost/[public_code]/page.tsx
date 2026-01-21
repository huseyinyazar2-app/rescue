import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default async function PublicLostPage({ params }: { params: { public_code: string } }) {
  const { data, error } = await supabase.rpc('get_public_lost_post', {
    public_code: params.public_code,
  });

  if (error) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-12">
        <div className="mx-auto max-w-2xl rounded-2xl border border-red-200 bg-white p-6 text-sm text-red-700">
          İlan yüklenemedi. Lütfen daha sonra tekrar deneyin.
        </div>
      </main>
    );
  }

  const post = data?.[0];

  if (!post) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-12">
        <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
          Bu ilan bulunamadı veya yayından kaldırıldı.
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12">
      <div className="mx-auto flex max-w-3xl flex-col gap-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold text-slate-900">
            {post.pet_status === 'lost' ? 'KAYIP' : 'Durum Güncel'}
          </h1>
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
            {post.species}
          </span>
        </div>

        <div className="flex flex-col gap-4 md:flex-row">
          {post.photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={post.photo_url} alt="Kayıp ilan fotoğrafı" className="h-48 w-full rounded-2xl object-cover md:w-64" />
          ) : (
            <div className="flex h-48 w-full items-center justify-center rounded-2xl bg-slate-100 text-sm text-slate-500 md:w-64">
              Fotoğraf paylaşılmadı
            </div>
          )}
          <div className="flex flex-1 flex-col gap-3">
            <h2 className="text-xl font-semibold text-slate-900">
              {post.display_name ?? 'İsim paylaşılmadı'}
            </h2>
            <p className="text-sm text-slate-600">{post.public_blurb ?? 'Açıklama paylaşılmadı.'}</p>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              <p className="font-semibold text-slate-700">Son görülen bölge</p>
              <p>{post.last_seen_area ?? 'Paylaşılmadı'}</p>
              <p className="mt-2 text-xs text-slate-500">
                Yaklaşık konum: {post.last_seen_lat ?? '—'}, {post.last_seen_lon ?? '—'} (±{post.last_seen_radius_km ?? 2} km)
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <Link
            href={`/c/${post.public_code}`}
            className="flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            Gördüm
          </Link>
          <Link
            href={`/found/${post.public_code}`}
            className="flex items-center justify-center rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:border-slate-400"
          >
            Buldum
          </Link>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
          <p className="font-semibold text-slate-700">Sadece yardım etmek için konum paylaşın.</p>
          <p className="mt-1">
            Lütfen tam adres veya kişisel bilgi paylaşmayın. Güvenli teslim için veteriner veya petshop üzerinden buluşturmaya
            özen gösterin.
          </p>
        </div>
      </div>
    </main>
  );
}
