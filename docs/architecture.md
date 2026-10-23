# Arsitektur Teknis Link

Arsitektur aplikasi **Link** dirancang untuk memaksimalkan performa edge komputasi dan menjamin biaya server tetap **Rp 0 (100% Cloudflare Free Tier)**.

---

## 1. Diagram Alur & Komposisi Sistem

```
                                [ END-USER / PENGUNJUNG ]
                                            │
                                            ▼
                           [ CLOUDFLARE EDGE NETWORK (CGK Jakarta) ]
                                            │
                  ┌─────────────────────────┴────────────────────────┐
                  ▼                                                  ▼
         [ Frontend PWA Static ]                            [ Backend Worker (Hono) ]
      (Cloudflare Pages / Assets)                                    │
                                            ┌────────────────────────┴────────────────────────┐
                                            ▼                                                 ▼
                                   [ Cloudflare KV ]                                  [ Cloudflare D1 ]
                                (Lookup Slug & User Ad)                            (Relational DB & Stats)
                                            │
                                            ▼
                        [ Iklan Disajikan via URL Eksternal Pengguna ]
                        (Foto via Direct Image URL / Video via YouTube Embed)
                        *0 Byte Penyimpanan & Bandwidth Media di Server*
```

---

## 2. Alur Pengalihan Cerdas (Edge Redirection Engine)

Saat pengunjung membuka URL pendek `/:slug`:

1. **Pemeriksaan Cache KV (< 15ms)**:
   - Worker membaca key `link:{slug}` dari Cloudflare KV.
   - Jika *cache miss*, membaca D1 dan melakukan *background cache warming* ke KV.

2. **Filter Bot Scraper WhatsApp / Medsos**:
   - Jika terdeteksi User-Agent robot crawler (`WhatsApp`, `facebookexternalhit`, `TelegramBot`, `Twitterbot`), server mengembalikan metadata OpenGraph (`og:title`, `og:image`, `og:description`) dengan kode HTTP 200.
   - **Trafik robot scraper TIDAK dicatat sebagai klik manusia**, sehingga angka analitik tidak membengkak palsu.

3. **Perekaman Analitik Non-Blocking**:
   - Pencatatan analitik dijalankan di latar belakang menggunakan `ctx.waitUntil()` sehingga pengunjung tidak menunggu query database selesai sebelum dialihkan.
   - Header Edge Cloudflare diekstrak untuk memetakan provinsi dan operator seluler/ISP (Telkomsel, Indihome, Indosat, XL, Biznet, dll.).
   - Alamat IP di-hash satu arah bersama salt harian sesuai kepatuhan UU PDP (tanpa menyimpan IP mentah).

4. **Resolusi Iklan & Pengalihan**:
   - **Mode Direct (`disabled`)**: Pengalihan langsung HTTP 302 instan (0-byte payload).
   - **Mode Custom (`custom`)**: Menampilkan halaman interstitial iklan khusus untuk tautan tersebut.
   - **Mode Inherit (`inherit`)**: Membaca setelan akun global pengguna (`user_ad:{user_id}`). Jika aktif, merender interstitial; jika non-aktif, langsung dialihkan 302.

---

## 3. Zero-Server Burden Advertising Architecture

Seluruh materi promosi tidak diunggah ke server kita, melainkan berupa **link eksternal** yang dimasukkan oleh pengguna:
- **Iklan Foto**: URL langsung ke gambar (CDN eksternal, Imgur, Cloudinary, hosting foto publik, dll.).
- **Iklan Video**: URL link YouTube standar (`youtube.com/watch?v=...`, `youtu.be/...`, atau Shorts) yang otomatis diekstrak Video ID-nya dan dirender via iframe responsif.

Hasilnya:
- Server bebas biaya penyimpanan file biner.
- Penggunaan kuota Cloudflare Free Tier tetap aman dan terjaga.
