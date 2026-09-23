# Haber Panosu

RSS kaynaklarından her gün haber toplayan, kategoriye ayıran; kendi köşe yazılarımızı
ve seçtiğimiz dış köşe yazarlarını gösteren Next.js uygulaması (Vercel + Upstash Redis).

## Sayfalar
- `/` — ana sayfa: hero + yan sütunlar, Köşe Yazıları, Seçme Köşe Yazıları, kategori blokları, Diğer Haberler
- `/yazi/[id]` — kendi yazarlarımızın yazılarının tam metni
- `/ayarlar` — şifreli yönetim sayfası: kategoriler, kendi yazarlarımız, kendi yazılarımız, seçme köşe yazarları, "Şimdi güncelle"

## Ortam değişkenleri (Vercel → Settings → Environment Variables)
| Değişken | Açıklama |
|---|---|
| `KV_REST_API_URL`, `KV_REST_API_TOKEN` | Upstash for Redis bağlanınca otomatik eklenir |
| `ADMIN_PASSWORD` | Ayarlar sayfasının şifresi (sen belirlersin) |
| `CRON_SECRET` | İsteğe bağlı; tanımlıysa `/api/cron` yalnızca bu anahtarla çalışır |

## Zamanlama
`vercel.json` içindeki cron günde iki kez çalışır: 05:00 ve 15:00 UTC (TR 08:00 ve 18:00).
Yalnızca bugüne ait haberler tutulur; önceki günlerin haberleri her çalışmada düşer.

## Haber kaynağı eklemek
`config/sources.js` içindeki `FEEDS` listesine aynı formatta satır ekle.
