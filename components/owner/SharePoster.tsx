'use client';

import { useMemo, useState } from 'react';

interface SharePosterProps {
  petName: string;
  lastSeenArea: string | null;
  photoUrl: string | null;
  lostUrl: string;
}

export default function SharePoster({ petName, lastSeenArea, photoUrl, lostUrl }: SharePosterProps) {
  const [downloading, setDownloading] = useState(false);
  const qrUrl = useMemo(() => {
    const encoded = encodeURIComponent(lostUrl);
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encoded}`;
  }, [lostUrl]);

  const downloadPoster = async () => {
    setDownloading(true);
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1350;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      setDownloading(false);
      return;
    }

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#facc15';
    ctx.font = 'bold 96px sans-serif';
    ctx.fillText('KAYIP', 80, 140);

    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'bold 56px sans-serif';
    ctx.fillText(petName, 80, 230);

    ctx.font = '32px sans-serif';
    ctx.fillStyle = '#cbd5f5';
    ctx.fillText(`Son görülen: ${lastSeenArea ?? 'Bilinmiyor'}`, 80, 300);

    if (photoUrl) {
      const image = new Image();
      image.crossOrigin = 'anonymous';
      image.src = photoUrl;
      await new Promise((resolve) => {
        image.onload = resolve;
        image.onerror = resolve;
      });
      ctx.drawImage(image, 80, 340, 920, 520);
    } else {
      ctx.fillStyle = '#1f2937';
      ctx.fillRect(80, 340, 920, 520);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '28px sans-serif';
      ctx.fillText('Fotoğraf yok', 420, 620);
    }

    const qrImage = new Image();
    qrImage.crossOrigin = 'anonymous';
    qrImage.src = qrUrl;
    await new Promise((resolve) => {
      qrImage.onload = resolve;
      qrImage.onerror = resolve;
    });
    ctx.drawImage(qrImage, 80, 920, 250, 250);

    ctx.fillStyle = '#e2e8f0';
    ctx.font = '28px sans-serif';
    ctx.fillText('Gördüyseniz bildirin', 360, 1010);
    ctx.fillStyle = '#facc15';
    ctx.font = '24px sans-serif';
    ctx.fillText(lostUrl, 360, 1060);

    const link = document.createElement('a');
    link.download = `matrixc-${petName}-poster.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    setDownloading(false);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
        <div className="flex flex-col gap-4 md:flex-row">
          <div className="flex-1">
            <h3 className="text-lg font-semibold">Poster Önizleme</h3>
            <p className="text-sm text-slate-300">
              QR kodlu paylaşım posteri hazır. PNG olarak indirip yazdırabilirsiniz.
            </p>
            <button
              className="mt-4 rounded-md bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-950"
              type="button"
              onClick={downloadPoster}
              disabled={downloading}
            >
              {downloading ? 'Hazırlanıyor...' : 'Posteri indir'}
            </button>
          </div>
          <div className="flex-1 rounded-xl border border-slate-800 bg-slate-950 p-4 text-center">
            {photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="mx-auto h-40 w-40 rounded-full object-cover" src={photoUrl} alt={petName} />
            ) : (
              <div className="mx-auto flex h-40 w-40 items-center justify-center rounded-full bg-slate-800 text-xs text-slate-400">
                Fotoğraf yok
              </div>
            )}
            <h4 className="mt-4 text-xl font-semibold text-amber-200">{petName}</h4>
            <p className="text-sm text-slate-300">{lastSeenArea ?? 'Son görülen alan bilinmiyor'}</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="mx-auto mt-4 h-28 w-28" src={qrUrl} alt="QR" />
          </div>
        </div>
      </div>
    </div>
  );
}
