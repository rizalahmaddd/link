# Memulai Link di Komputer Lokal

Panduan langkah demi langkah untuk menjalankan aplikasi **Link** di lingkungan pengembangan lokal.

---

## 1. Prasyarat

- **Node.js** versi 20 atau lebih baru ([nodejs.org](https://nodejs.org))
- **npm** (bawaan Node.js)
- Akun Cloudflare gratis ([dash.cloudflare.com](https://dash.cloudflare.com))
- Akun Resend gratis ([resend.com](https://resend.com)) *(opsional untuk dev, terdapat mode simulasi otomatis)*

---

## 2. Clone Repository & Install Dependensi

```bash
git clone https://github.com/rizalahmaddd/link.git
cd link
npm install
```

---

## 3. Inisialisasi Database SQLite Lokal (D1)

Jalankan perintah berikut untuk mengeksekusi migrasi skema tabel D1 di komputer lokal Anda:

```bash
npm run db:migrate:local
```

File database SQLite lokal akan tersimpan secara otomatis di direktori `.wrangler/state/v3/d1/`.

---

## 4. Build Aset Frontend & PWA

Kompilasi komponen React, CSS Tailwind v4, dan Service Worker PWA ke folder `./dist`:

```bash
npm run build
```

---

## 5. Jalankan Edge Server Lokal (Wrangler Dev)

```bash
npx wrangler dev --port 8799
```

Buka browser Anda dan akses:
👉 **[http://localhost:8799](http://localhost:8799)**

---

## 6. Menguji Passwordless Magic Link di Lokal

Jika Anda belum mengatur `RESEND_API_KEY`, aplikasi otomatis berjalan dalam **Mode Simulasi**:
1. Masukkan email sembarang di halaman login (contoh: `admin@contoh.com`).
2. Tautan verifikasi langsung ditampilkan di layar browser serta dicetak di terminal.
3. Klik tombol **"Masuk Sekarang (1-Klik Dev)"** untuk langsung login ke Dashboard tanpa perlu membuka email.
