# Berkontribusi

Terima kasih sudah tertarik berkontribusi ke Link!

## Alur Kontribusi

1. Buka issue terlebih dahulu untuk perubahan besar atau usulan fitur baru agar arah implementasi disepakati sebelum mulai coding.
2. Fork repo ini dan buat branch baru dari `main`.
3. Jalankan project di lokal mengikuti panduan [docs/getting-started.md](./docs/getting-started.md).
4. Pastikan semua verifikasi lolos sebelum membuat Pull Request:

   ```bash
   npm run build
   ```

5. Jika ada perubahan skema database, sertakan file SQL migrasi di folder `migrations/`.

## Panduan Kode

- TypeScript strict, minimalkan penggunaan `any`.
- Seluruh teks yang terlihat oleh pengguna memakai Bahasa Indonesia yang ramah dan jelas.
- Tulis komentar kode hanya untuk menjelaskan konteks *alasan* arsitektur (misal: optimasi kuota Cloudflare atau filter bot scraper).
- **PENTING**: Jangan pernah melakukan commit file secret (`.dev.vars`, `.env`, atau kredensial produksi).

## Melaporkan Masalah & Bug

Gunakan fitur **Issues** di GitHub. Untuk celah keamanan, silakan ikuti petunjuk pelaporan privat di [SECURITY.md](./SECURITY.md).
