# SMK NU Attendance — Starter React

Starter frontend untuk portal sekolah SMK NU. Dibangun dengan React + Vite dan disiapkan agar dapat dideploy ke Vercel.

## Menjalankan project

```bash
npm install
npm run dev
```

## Build untuk deployment

```bash
npm run build
```

Folder hasil build: `dist`.

## Deploy ke Vercel

1. Upload repository ini ke GitHub.
2. Import repository di Vercel.
3. Framework preset: Vite.
4. Build command: `npm run build`.
5. Output directory: `dist`.

`vercel.json` sudah menyertakan rewrite untuk client-side routing.

## Catatan

- Konten jurusan masih contoh; ganti sesuai data resmi sekolah.
- Fitur login, Supabase, absensi, dan pengenalan wajah belum diimplementasikan.
- Jangan masukkan data siswa asli atau kredensial rahasia ke repository.
- Untuk penggunaan biometrik di sekolah, siapkan perlindungan data, persetujuan yang sesuai, kebijakan retensi/penghapusan, dan metode absensi alternatif.
