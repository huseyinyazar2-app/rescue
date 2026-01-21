# MatrixC Rescue – Owner Console

Bu doküman, kedi sahibi (owner) akışlarını ve gerekli ortam değişkenlerini özetler.

## Akışlar

- **Giriş**: `/login` üzerinden e-posta magic link ile giriş yapılır.
- **Dashboard**: `/app` sayfası owner panelidir. Pet kartlarını, etiket kodunu ve durumları gösterir.
- **Etiket aktivasyonu**: `/app/activate-tag` sayfasında `public_code + PIN` ile etiket sahiplenilir.
- **Pet oluşturma**: `/app/pets/new` sayfasında pet profili oluşturulur.
- **Pet detayı**: `/app/pets/[id]` sayfasında düzenleme, kayıp modu ve bildirimler yer alır.
- **Paylaşım**: `/app/pets/[id]/share` sayfasında kayıp ilan linki ve poster indirilebilir.
- **Public ilan**: `/lost/[public_code]` sayfası public kayıp ilanıdır.

## Güvenlik Notları

- `rescue_sightings` tablosu owner rolü için **SELECT kapalıdır**.
- Owner, `get_owner_sightings` RPC’si üzerinden yalnızca yuvarlanmış koordinatları görür.
- `finder_contact`, `ip_hash`, `metadata` alanları owner’a döndürülmez.

## Ortam Değişkenleri

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

## Storage

- Pet fotoğrafları için `pet-photos` bucket kullanılmaktadır.

## RPC

- `claim_tag(public_code, pin)`
- `attach_tag_to_pet(tag_id, pet_id)`
- `get_owner_pet_overview()`
- `get_owner_sightings(pet_id)`
- `get_public_pet_by_code(public_code)`
