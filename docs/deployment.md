# Panduan Deployment ke Cloudflare

Aplikasi **Link** dirancang untuk berjalan 100% di atas Cloudflare Free Tier (Workers + Static Assets + D1 Database + KV Cache).

---

## 1. Login ke Cloudflare CLI

Pastikan Anda sudah menginstal Wrangler dan terhubung ke akun Cloudflare:

```bash
npx wrangler login
```

---

## 2. Buat Database D1 di Cloudflare

Buat database D1 di jaringan Cloudflare:

```bash
npx wrangler d1 create link-db
```

Output akan menampilkan `database_id`. Salin ID tersebut ke file `wrangler.jsonc` pada bagian `d1_databases`:
```jsonc
"d1_databases": [
  {
    "binding": "DB",
    "database_name": "link-db",
    "database_id": "MASUKKAN_DATABASE_ID_ANDA",
    "migrations_dir": "migrations"
  }
]
```

---

## 3. Buat Namespace KV di Cloudflare

Buat KV Namespace untuk fast-path caching pengalihan:

```bash
npx wrangler kv namespace create LINK_KV
```

Salin nilai `id` yang didapatkan ke `wrangler.jsonc`:
```jsonc
"kv_namespaces": [
  {
    "binding": "LINKS_KV",
    "id": "MASUKKAN_KV_ID_ANDA"
  }
]
```

---

## 4. Jalankan Migrasi Skema ke Database Remote

```bash
npm run db:migrate:remote
```

---

## 5. Simpan Secret Variables ke Cloudflare

Daftarkan variabel rahasia (Secret) agar tidak pernah bocor ke git:

```bash
# Token rahasia penandatanganan JWT
npx wrangler secret put JWT_SECRET

# API Key gratis dari Resend.com
npx wrangler secret put RESEND_API_KEY
```

---

## 6. Atur Custom Domain (Subdomain)

Di file `wrangler.jsonc`, atur rute subdomain Cloudflare Anda (contoh: `link.solusikoding.com`):

```jsonc
"routes": [
  {
    "pattern": "link.solusikoding.com",
    "custom_domain": true
  }
]
```

---

## 7. Build & Deploy

Kompilasi aset produksi dan luncurkan Worker Anda ke Cloudflare Edge:

```bash
npm run build
npx wrangler deploy
```

Selesai! Aplikasi Anda kini live secara global dengan sertifikat SSL otomatis dari Cloudflare.
