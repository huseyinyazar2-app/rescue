import Link from 'next/link';

interface PetCardProps {
  id: string;
  name: string;
  species?: string | null;
  photoUrl?: string | null;
  status?: string | null;
  tagPublicCode?: string | null;
  lastSeenArea?: string | null;
}

const statusMap: Record<string, string> = {
  normal: 'Normal',
  lost: 'Kayıp',
  found: 'Bulundu',
};

export default function PetCard({
  id,
  name,
  species,
  photoUrl,
  status,
  tagPublicCode,
  lastSeenArea,
}: PetCardProps) {
  return (
    <article className="flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow">
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 overflow-hidden rounded-xl bg-slate-800">
          {photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="h-full w-full object-cover" src={photoUrl} alt={name} />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
              Foto yok
            </div>
          )}
        </div>
        <div>
          <h3 className="text-lg font-semibold">{name}</h3>
          <p className="text-sm text-slate-300">{species ?? 'Tür belirtilmedi'}</p>
        </div>
      </div>
      <div className="grid gap-2 text-sm text-slate-300">
        <p>
          <span className="font-medium text-slate-200">Durum:</span>{' '}
          {status ? statusMap[status] ?? status : 'Bilinmiyor'}
        </p>
        <p>
          <span className="font-medium text-slate-200">Etiket:</span>{' '}
          {tagPublicCode ?? 'Bağlı değil'}
        </p>
        {lastSeenArea ? (
          <p>
            <span className="font-medium text-slate-200">Son görülen:</span> {lastSeenArea}
          </p>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-2">
        <Link
          className="rounded-md border border-slate-700 px-3 py-2 text-sm hover:border-amber-400 hover:text-amber-200"
          href={`/app/pets/${id}`}
        >
          Detay / Kayıp Modu
        </Link>
        <Link
          className="rounded-md border border-slate-700 px-3 py-2 text-sm hover:border-amber-400 hover:text-amber-200"
          href={`/app/pets/${id}/share`}
        >
          Paylaş
        </Link>
      </div>
    </article>
  );
}
