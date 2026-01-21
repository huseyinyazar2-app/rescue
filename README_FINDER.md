# MatrixC Rescue – Finder (Part 3)

Bu doküman Finder (QR okutma / bulan) akışının nasıl çalıştığını özetler.

## Akış

- `/c/[public_code]` etiketteki QR linki için açılır.
- Sayfa açıldığında `tag_scans` tablosuna `action = 'view'` logu yazılır.
- Finder formu anonimdir ve tüm yazma işlemleri `/api/finder/report` üzerinden yapılır.
- Konum paylaşımı ayrıca `/api/finder/scan` ile `location_shared` logu olarak kaydedilir.

## Güvenlik Notları

- Finder tarafında Supabase anon key ile **doğrudan INSERT yapılmaz**.
- IP adresleri hashlenir ve raw IP saklanmaz.
- `finder_contact`, `ip_hash`, `metadata` gibi alanlar owner tarafına gösterilmemelidir.

## Depolama

- Fotoğraflar `sightings-photos` bucket’ına yüklenir.
- Maksimum boyut 5MB, sadece `image/*` kabul edilir.

## RPC

- `get_public_pet_by_code(public_code)` sadece public gösterime uygun alanları döndürür.

## Rate Limit

- Aynı `ip_hash + public_code` için 5 dakikada en fazla 3 bildirim yapılabilir.

