'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  listPublicLostPostsNear,
  listPublicLostPostsRecent,
} from '@/lib/community/publicRpc';

type Post = {
  pet_id: string;
  public_code: string;
  species: string;
  display_name: string | null;
  photo_url: string | null;
  public_blurb?: string | null;
  last_seen_area: string | null;
  approx_lat: number | null;
  approx_lon: number | null;
  created_at: string;
  updated_at: string;
};

const fallbackLocations = [
  { label: 'Kadıköy', lat: 40.987, lon: 29.028 },
  { label: 'Beşiktaş', lat: 41.043, lon: 29.009 },
  { label: 'Çankaya', lat: 39.917, lon: 32.862 },
  { label: 'Karşıyaka', lat: 38.456, lon: 27.101 },
];

export default function CommunityList({ defaultMode = 'recent' }: { defaultMode?: 'recent' | 'nearby' }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [species, setSpecies] = useState<'all' | 'cat' | 'dog'>('all');
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<'recent' | 'nearby'>(defaultMode);
  const [radiusKm, setRadiusKm] = useState(5);
  const [selectedLocation, setSelectedLocation] = useState(fallbackLocations[0]);
  const [geoEnabled, setGeoEnabled] = useState(false);
  const [geoLocation, setGeoLocation] = useState<{ lat: number; lon: number } | null>(null);

  const speciesFilter = useMemo(() => (species === 'all' ? null : species), [species]);

  const loadRecent = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listPublicLostPostsRecent({
        species: speciesFilter,
        query: query.trim() ? query.trim() : null,
      });
      setPosts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Liste yüklenemedi.');
    } finally {
      setLoading(false);
    }
  };

  const loadNearby = async (center: { lat: number; lon: number }) => {
    setLoading(true);
    setError(null);
    try {
      const data = await listPublicLostPostsNear({
        lat: center.lat,
        lon: center.lon,
        radiusKm,
        species: speciesFilter,
      });
      setPosts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Yakın ilanlar yüklenemedi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (mode === 'recent') {
      void loadRecent();
      return;
    }

    const center = geoLocation ?? selectedLocation;
    void loadNearby(center);
  }, [mode, speciesFilter, query, radiusKm, geoLocation, selectedLocation]);

  const requestGeolocation = () => {
    if (!navigator.geolocation) {
      setGeoEnabled(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGeoEnabled(true);
        setGeoLocation({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        });
        setMode('nearby');
      },
      () => {
        setGeoEnabled(false);
        setMode('nearby');
      },
    );
  };

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8">
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setMode('recent')}
            className={`rounded-full px-4 py-2 text-sm ${
              mode === 'recent' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            Son 7 gün
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('nearby');
              requestGeolocation();
            }}
            className={`rounded-full px-4 py-2 text-sm ${
              mode === 'nearby' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            Yakınımdaki ilanlar
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="text-sm font-medium text-slate-700">Tür</label>
          <select
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
            value={species}
            onChange={(event) => setSpecies(event.target.value as 'all' | 'cat' | 'dog')}
          >
            <option value="all">Tümü</option>
            <option value="cat">Kedi</option>
            <option value="dog">Köpek</option>
          </select>
          <label className="text-sm font-medium text-slate-700">Arama</label>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Kısa açıklama içinde ara"
            className="w-64 rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </div>

        {mode === 'nearby' && (
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-sm font-medium text-slate-700">Merkez</label>
            <select
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={selectedLocation.label}
              onChange={(event) => {
                const loc = fallbackLocations.find((item) => item.label === event.target.value);
                if (loc) {
                  setSelectedLocation(loc);
                  setGeoLocation(null);
                }
              }}
              disabled={geoEnabled && !!geoLocation}
            >
              {fallbackLocations.map((location) => (
                <option key={location.label} value={location.label}>
                  {location.label}
                </option>
              ))}
            </select>
            <label className="text-sm font-medium text-slate-700">Yarıçap (km)</label>
            <input
              type="number"
              min={1}
              max={50}
              value={radiusKm}
              onChange={(event) => setRadiusKm(Number(event.target.value))}
              className="w-24 rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
            {geoLocation ? (
              <span className="text-xs text-emerald-600">Konumunuz alındı.</span>
            ) : (
              <span className="text-xs text-slate-500">Konum izni yoksa şehir seçebilirsiniz.</span>
            )}
          </div>
        )}
      </div>

      {loading && <div className="text-sm text-slate-500">Yükleniyor...</div>}
      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <div className="grid gap-4 md:grid-cols-2">
        {posts.map((post) => (
          <div key={post.pet_id} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              {post.photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={post.photo_url} alt="Kayıp ilan fotoğrafı" className="h-16 w-16 rounded-xl object-cover" />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-slate-100 text-xs text-slate-500">
                  Foto yok
                </div>
              )}
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {post.display_name ?? 'İsim paylaşılmadı'}
                </p>
                <p className="text-xs text-slate-500">{post.species}</p>
              </div>
            </div>
            <p className="text-sm text-slate-700">{post.public_blurb ?? 'Açıklama yok.'}</p>
            <p className="text-xs text-slate-500">Bölge: {post.last_seen_area ?? 'Paylaşılmadı'}</p>
            <div className="mt-auto flex items-center justify-between text-xs text-slate-500">
              <span>{new Date(post.updated_at).toLocaleDateString('tr-TR')}</span>
              <Link href={`/lost/${post.public_code}`} className="text-emerald-600 hover:text-emerald-700">
                Detaylara git
              </Link>
            </div>
          </div>
        ))}
      </div>

      {!loading && posts.length === 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
          Kriterlere uygun ilan bulunamadı.
        </div>
      )}
    </div>
  );
}
