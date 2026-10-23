# Dokumentasi Fitur Lengkap

Dokumentasi detail mengenai seluruh kapabilitas teknis, alur kerja, dan konfigurasi platform **Link**.

---

## 1. Tambah Cepat (Instant Shorten Engine)

Fitur *Tambah Cepat* dirancang untuk pengalaman pemendekan tautan tanpa hambatan (*zero-friction*).

- **Alur Kerja Instan:** Kolom input utama di Dashboard memungkinkan pengguna langsung menempelkan URL panjang dan menekan tombol `Enter`.
- **Normalisasi URL Otomatis:** Sistem mendeteksi jika URL belum memiliki skema protokol (`http://` atau `https://`) dan secara otomatis menambahkan `https://` sebelum disimpan.
- **Auto-Copy ke Clipboard:** Begitu API merespon sukses, tautan pendek (`https://link.solusikoding.com/:slug`) langsung disalin ke *clipboard* pengguna.
- **Banner Notifikasi Cepat:** Menampilkan slug yang baru dibuat, URL tujuan, serta tombol akses instan:
  - Salin ulang tautan.
  - Buka modal Kode QR.
  - Buka modal kustomisasi detail (untuk menambahkan sandi PIN atau kustomisasi iklan).
- **Laci Opsi Cepat (Opsional):** Tombol di sudut kanan atas bilah input untuk menentukan slug kustom atau memilih mode iklan (*Ikuti Global* vs *Direct 302*) tanpa membuka modal penuh.

---

## 2. Mesin Sponsor & Kontrol Lewati (Smart Ad Engine)

Mekanisme monetisasi dan promosi perantara yang berjalan di Cloudflare Edge tanpa membebani penyimpanan server.

### A. Kontrol Tombol Lewati (*Skip Behavior*)
- **Bisa Dilewati (`ad_skippable = true`):**
  - Pengunjung disajikan countdown timer (default 5 detik).
  - Selama timer berjalan, tombol lewati menampilkan waktu tunggu mundur.
  - Setelah timer 0 detik, tombol lewati berubah menjadi aktif dan pengunjung dapat mengkliknya untuk melanjutkan ke target URL.
- **Wajib Selesai / Forced (`ad_skippable = false`):**
  - Tombol lewati ditiadakan dari tampilan.
  - Pengunjung wajib menyaksikan materi promosi hingga hitung mundur selesai.
- **Otomatis Redirect (`ad_auto_redirect = true`):**
  - Saat hitung mundur mencapai 0 detik, browser pengunjung langsung dialihkan ke URL tujuan secara otomatis tanpa harus mengeklik tombol lewati.

### B. Hierarki Pengaturan Dua Tingkat
1. **Tingkat Global Akun (`users` table):**
   - Dikonfigurasi melalui modal *Iklan Global Akun*.
   - Menyimpan status aktif/non-aktif, tipe media (foto/YouTube), URL media, headline, detik timer, tombol CTA, dan aturan lewati.
   - Dicache pada Cloudflare KV (`user_ad:{user_id}`) untuk performa instan.
2. **Tingkat Tautan Individual (`links` table):**
   - Mode `inherit`: Mengikuti konfigurasi global akun secara otomatis.
   - Mode `custom`: Menimpa pengaturan global dengan materi iklan khusus untuk tautan tersebut.
   - Mode `disabled`: Pengalihan langsung HTTP 302 tanpa jeda halaman iklan.

### C. Anti-Adblock Friendly Shield
- Tampilan ramah yang mendeteksi jika ekstensi ad blocker memutus pemuatan iframe video YouTube atau script pelacak.
- Menyediakan pesan bantuan ramah agar pengunjung tetap dapat melanjutkan ke tautan tujuan tanpa gangguan.

---

## 3. Telemetri Sponsor & Laporan Publik Read-Only

Pelacakan interaksi pengunjung terhadap materi sponsor dengan kepatuhan kuota Cloudflare Free Tier.

### A. Metrik Telemetri yang Dicatat
- **Tayangan Iklan (*Impressions*):** Tercatat saat halaman iklan terbuka melalui beacon pelacakan edge (`POST /api/v1/track/event`).
- **Klik CTA Sponsor (*CTA Clicks* & CTR %):** Tercatat saat pengunjung menekan tombol penawaran sponsor.
- **Penyelesaian / Lewati (*Skips / Proceeded*):** Tercatat saat pengunjung berhasil melewati iklan ke tautan tujuan.
- **Drop-off / Bounce Rate:** Persentase pengunjung yang menutup tab sebelum melewati iklan (`Impressions - (CTA Clicks + Skips)`).

### B. Efisiensi Database D1 (Zero Row Explosion)
- Menggunakan tabel agregat harian `link_ad_metrics_daily` dengan constraint unik `(link_id, date)`.
- Menggunakan klausa SQL `ON CONFLICT(link_id, date) DO UPDATE SET ... = ... + excluded....` sehingga satu tautan hanya memakan maksimal 1 baris per hari.

### C. Laporan Publik Read-Only (`/report/:reportToken`)
- Setiap tautan memiliki token laporan unik (`report_token`).
- URL laporan publik: `https://link.solusikoding.com/report/:reportToken`.
- Halaman ini dapat dibuka oleh sponsor atau klien tanpa memerlukan autentikasi login.
- Menyajikan ringkasan metrik tayang, klik sponsor, CTR %, grafik tren harian, serta distribusi lokasi dan perangkat.

---

## 4. Keamanan & Kontrol Akses Tautan

Fitur pengamanan tingkat lanjut untuk tautan sensitif atau kampanye berbatas waktu.

- **Proteksi PIN / Sandi Rahasia:**
  - Password di-hash menggunakan algoritma SHA-256 sebelum disimpan di database D1.
  - Pengunjung yang membuka tautan akan diarahkan ke dialog verifikasi PIN sebelum halaman sponsor atau tautan tujuan dapat diakses.
- **Batas Kedaluwarsa Waktu (*Expiration Date*):**
  - Tautan memiliki batas waktu kedaluwarsa berbasis zona waktu WIB (`Asia/Jakarta`).
  - Setelah melewati waktu tersebut, tautan otomatis nonaktif dan mengembalikan halaman informasi kedaluwarsa.
- **Batas Maksimal Klik (*Click Limit*):**
  - Tautan dapat dibatasi kuota kliknya (misal: hanya untuk 100 pengunjung pertama).
  - Tautan otomatis tertutup setelah kuota klik tercapai.
- **Kustomisasi Open Graph (Medsos):**
  - Memungkinkan penyesuaian judul (`og:title`), deskripsi (`og:description`), dan gambar cover thumbnail (`og:image`) saat tautan dibagikan ke WhatsApp, Telegram, atau Facebook.

---

## 5. Dynamic QR Code Kustom

- **QR Code Dinamis:** Mengarah ke tautan pendek sehingga konten tujuan dapat diperbarui kapan saja tanpa mengubah fisik QR yang sudah dicetak.
- **Palet Warna:** Pilihan warna profesional yang lolos uji kontras keterbacaan scanner (Zinc, Sky, Emerald, Rose, Violet, Orange).
- **Format Ekspor:**
  - **PNG Resolusi Tinggi (1024x1024):** Untuk keperluan display digital, poster, dan materi presentasi.
  - **SVG Vektor Murni:** Format vektor lossless untuk percetakan skala besar (baliho, standing banner, merchandise).

---

## 6. Tata Letak Responsif Multi-Seksi (UI/UX)

- **Widescreen Multi-Section Panel:** Pada monitor lebar (`lg:max-w-5xl`, `xl:max-w-6xl`), form pengaturan tautan, iklan global, dan analitik ditata dalam kolom berdampingan (*side-by-side*). Menghilangkan ruang kosong hitam di sisi kiri-kanan dan meniadakan keharusan *scrolling* vertikal.
- **Live Real-Time Preview:** Pratinjau interaktif kartu medsos dan tampilan layar sponsor langsung ter-update saat pengguna mengetik input.
- **Navigasi Bersih & Bebas Redundansi:** Bilah atas terfokus pada navigasi global akun, sedangkan tombol tindakan halaman terintegrasi secara proporsional di header dashboard.
- **PWA Ready:** Mendukung instalasi aplikasi mandiri (*standalone window*) di Android, iOS, Windows, dan macOS.
