"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type FinderFormProps = {
  publicCode: string;
  defaultEventType: "seen" | "found" | "info";
  petInfo: {
    is_activated: boolean;
    pet_id: string | null;
    pet_name: string | null;
    species: string | null;
    photo_url: string | null;
    pet_status: string | null;
    last_seen_area: string | null;
  } | null;
};

type SubmitState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

const EVENT_TYPE_LABELS: Record<string, string> = {
  seen: "Gördüm",
  found: "Buldum",
  info: "Bilgi",
};

export const FinderForm = ({ publicCode, defaultEventType, petInfo }: FinderFormProps) => {
  const [eventType, setEventType] = useState(defaultEventType);
  const [locationState, setLocationState] = useState<{
    lat: number | null;
    lon: number | null;
    accuracy: number | null;
    status: "idle" | "loading" | "ready" | "error";
    message?: string;
  }>({ lat: null, lon: null, accuracy: null, status: "idle" });
  const [message, setMessage] = useState("");
  const [finderContact, setFinderContact] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [submitState, setSubmitState] = useState<SubmitState>({ status: "idle" });

  const isLost = petInfo?.pet_status === "lost";
  const isActivated = petInfo?.is_activated ?? false;
  const defaultInfoLabel = useMemo(() => EVENT_TYPE_LABELS[eventType] ?? "Bilgi", [eventType]);

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setLocationState({ status: "error", lat: null, lon: null, accuracy: null, message: "Cihaz konum paylaşımını desteklemiyor." });
      return;
    }

    setLocationState((prev) => ({ ...prev, status: "loading" }));

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        const accuracy = position.coords.accuracy;

        setLocationState({ lat, lon, accuracy, status: "ready" });

        try {
          await fetch("/api/finder/scan", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              public_code: publicCode,
              action: "location_shared",
              lat,
              lon,
              location_accuracy_m: accuracy,
            }),
          });
        } catch (error) {
          console.error("Konum paylaşım logu başarısız", error);
        }
      },
      (error) => {
        setLocationState({ status: "error", lat: null, lon: null, accuracy: null, message: error.message });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitState({ status: "submitting" });

    try {
      const formData = new FormData();
      formData.append("public_code", publicCode);
      formData.append("event_type", eventType);

      if (locationState.lat != null && locationState.lon != null) {
        formData.append("lat", String(locationState.lat));
        formData.append("lon", String(locationState.lon));
      }

      if (locationState.accuracy != null) {
        formData.append("location_accuracy_m", String(locationState.accuracy));
      }

      if (message.trim().length > 0) {
        formData.append("message", message.trim());
      }

      if (finderContact.trim().length > 0) {
        formData.append("finder_contact", finderContact.trim());
      }

      if (photo) {
        formData.append("photo", photo);
      }

      const response = await fetch("/api/finder/report", {
        method: "POST",
        body: formData,
      });

      const payload = await response.json();

      if (!response.ok) {
        setSubmitState({ status: "error", message: payload?.message ?? "Gönderim başarısız." });
        return;
      }

      setSubmitState({ status: "success", message: payload?.message ?? "Bildirim alındı." });
    } catch (error) {
      setSubmitState({ status: "error", message: "Gönderim sırasında hata oluştu." });
    }
  };

  if (submitState.status === "success") {
    return (
      <div className="space-y-4 rounded-2xl border border-emerald-100 bg-emerald-50 p-6 text-emerald-900">
        <h2 className="text-xl font-semibold">Bildirim alındı ✅</h2>
        <p>{submitState.message}</p>
        <div className="space-y-2 text-sm">
          <p>Mahalle grubunda paylaşmak isterseniz bu sayfanın linkini gönderebilirsiniz.</p>
          <p className="font-medium">Güvenliğinizi riske atmayın, yalnız hareket etmeyin.</p>
        </div>
        <button
          type="button"
          onClick={() => navigator.clipboard?.writeText(window.location.href)}
          className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white"
        >
          Linki Kopyala
        </button>
        <Link href="/privacy" className="text-sm font-medium text-emerald-700 underline">
          Aydınlatma Metni
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-base font-semibold text-slate-900">Ne tür bir bilgi paylaşmak istiyorsunuz?</h2>
        <div className={`grid gap-2 text-sm ${isLost ? "grid-cols-2" : "grid-cols-3"}`}>
          {(isLost ? ["seen", "found"] : ["info", "seen", "found"]).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setEventType(value as "seen" | "found" | "info")}
              className={`rounded-xl border px-3 py-2 font-medium ${
                eventType === value ? "border-rose-500 bg-rose-50 text-rose-700" : "border-slate-200 text-slate-600"
              }`}
            >
              {EVENT_TYPE_LABELS[value]}
            </button>
          ))}
        </div>
        {!isLost && (
          <p className="text-xs text-slate-500">
            Bu hayvan kayıp olarak işaretlenmemiş. Yine de bilgi gönderebilirsiniz. Seçim: {defaultInfoLabel}.
          </p>
        )}
      </section>

      <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-base font-semibold text-slate-900">Konum paylaş</h2>
        <p className="text-sm text-slate-600">Konumunuz sadece yaklaşık bilgi olarak paylaşılır.</p>
        <button
          type="button"
          onClick={requestLocation}
          className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white"
        >
          {locationState.status === "loading" ? "Konum alınıyor…" : "Konumumu Paylaş"}
        </button>
        {locationState.status === "ready" && (
          <p className="text-xs text-emerald-700">Konum alındı. Dilerseniz not ekleyebilirsiniz.</p>
        )}
        {locationState.status === "error" && (
          <p className="text-xs text-rose-600">{locationState.message ?? "Konum alınamadı."}</p>
        )}
      </section>

      <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-base font-semibold text-slate-900">Fotoğraf ekle (opsiyonel)</h2>
        <input
          type="file"
          accept="image/*"
          onChange={(event) => setPhoto(event.target.files?.[0] ?? null)}
          className="w-full text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-slate-700"
        />
        {photo && <p className="text-xs text-slate-500">Seçilen fotoğraf: {photo.name}</p>}
      </section>

      <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-base font-semibold text-slate-900">Not</h2>
        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          rows={4}
          placeholder="Örn. Şu sokakta köşede gördüm…"
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700"
        />
      </section>

      <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-base font-semibold text-slate-900">İletişim (opsiyonel)</h2>
        <input
          value={finderContact}
          onChange={(event) => setFinderContact(event.target.value)}
          placeholder="Telefon / WhatsApp / Instagram"
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700"
        />
        <p className="text-xs text-slate-500">Bu bilgi sadece güvenlik için yönetici tarafından görülebilir.</p>
      </section>

      <button
        type="submit"
        disabled={submitState.status === "submitting"}
        className="w-full rounded-xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
      >
        {submitState.status === "submitting" ? "Gönderiliyor…" : "Gönder"}
      </button>

      {submitState.status === "error" && (
        <p className="text-sm text-rose-600">{submitState.message}</p>
      )}

      {!isActivated && (
        <p className="text-xs text-slate-500">
          Etiket aktif değilse de konum ve not güvenlik için kaydedilir.
        </p>
      )}

      <Link href="/privacy" className="text-xs font-medium text-slate-500 underline">
        Aydınlatma Metni
      </Link>
    </form>
  );
};
