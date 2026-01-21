# MatrixC Rescue – Part 4A Community + Volunteers + Notifications

## Kurulum

### Env değişkenleri

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
APP_BASE_URL=
NOTIFICATIONS_CRON_SECRET=
EMAIL_PROVIDER=resend
RESEND_API_KEY=
FROM_EMAIL=
```

> `EMAIL_PROVIDER` boş ise bildirimler `notification_outbox` kuyruğunda kalır.

## Cron / Bildirim İşleme

`/api/notifications/process` endpoint’i kuyruktaki olayları işler.

Örnek çağrı:

```
curl -X POST \
  -H "x-cron-secret: <secret>" \
  https://your-domain.com/api/notifications/process
```

## RPC Fonksiyonları

- `get_public_lost_post(public_code)` – public lost sayfası için güvenli alanlar döner.
- `list_public_lost_posts_recent(species, query)` – son 7 gün içindeki ilanlar.
- `list_public_lost_posts_near(lat, lon, radius_km, species)` – yakın ilanlar.

## Notlar

- Public sayfalar yalnızca RPC üzerinden güvenli alanları kullanır.
- Gönüllü bildirimleri opt-in ve kapatılabilir.
- Bildirim e-postası hassas koordinat içermez; yalnızca bölge metni ve yönlendirme linkleri bulunur.
