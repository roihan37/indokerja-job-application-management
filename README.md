# IndoKerja | Job Application Management System

IndoKerja adalah aplikasi pengelolaan lamaran kerja dengan dua peran: Job Seeker dan Company. Kandidat dapat melamar pekerjaan dan memantau statusnya, sedangkan perusahaan dapat meninjau pelamar untuk lowongan miliknya.

**[Live Demo](https://indokerja-job-application-managemen-theta.vercel.app/)** · **[GitHub Repository](https://github.com/roihan37/indokerja-job-application-management)**

## Demo Accounts

| Role         | Email                |
| ------------ | -------------------- |
| Company 1    | company1@example.com |
| Company 2    | company2@example.com |
| Job Seeker 1 | seeker@example.com   |
| Job Seeker 2 | seeker2@example.com  |

**Password demo production untuk semua akun: `DemoIndokerja123!`**

Akun disiapkan melalui seed database. Password lokal mengikuti `DEMO_PASSWORD` dan dapat berbeda dari password production. Gunakan akun dan dokumen contoh khusus demo.

## Fitur

**Job Seeker**

- Menelusuri, mencari, dan memfilter lowongan; melihat detail pekerjaan.
- Melamar satu kali per lowongan, dengan pilihan lampiran resume.
- Melihat daftar lamaran sendiri dan status terkininya.
- Mengubah profil kandidat serta mengunggah, memilih, melihat, dan mengunduh resume PDF.

**Company**

- Membuat lowongan dan melihat daftar lowongan perusahaan sendiri.
- Melihat pelamar, profil kandidat, dan resume yang dilampirkan pada lamaran untuk lowongan miliknya.
- Mengubah status menjadi `Applied`, `Reviewing`, `Shortlisted`, `Rejected`, atau `Accepted`.

Backend memvalidasi JWT, peran, dan kepemilikan sumber daya. Duplikasi lamaran dicegah dengan unique constraint database. Status awal dan setiap perubahan status disimpan dalam `ApplicationHistory`; pembaruan status dan riwayat berjalan dalam satu transaksi. Status yang tidak berubah tidak menghasilkan riwayat tambahan. Riwayat perubahan belum ditampilkan sebagai timeline di UI atau endpoint baca tersendiri.

## Tech Stack

Versi berikut mengikuti deklarasi dependency di repository; lockfile menentukan versi instalasi.

| Bagian                 | Teknologi                                                                                              |
| ---------------------- | ------------------------------------------------------------------------------------------------------ |
| Frontend               | React 19, TypeScript 5.9, Vite 8, React Router 8, Tailwind CSS 4, komponen shadcn/ui berbasis Radix UI |
| Data dan form frontend | TanStack Query 5, React Hook Form 7, Zod 4                                                             |
| Backend                | Node.js, Express 5, TypeScript 5.9, Zod 4                                                              |
| Database / ORM         | PostgreSQL / Prisma 6                                                                                  |
| Authentication         | JWT bearer token, bcryptjs untuk password hash                                                         |
| File Storage           | Supabase Storage, private bucket                                                                       |
| Testing                | Node.js test runner, Supertest; Vitest, React Testing Library, jsdom                                   |
| Deployment             | Vercel, Railway, Supabase                                                                              |

## Struktur dan Arsitektur

```text
.
├── client/
│   ├── src/{components,pages,routes,services,types}/
│   ├── test/
│   └── .env.example
├── server/
│   ├── src/{routes,controllers,services,middleware,validators,lib,types,utils}/
│   ├── prisma/{migrations,schema.prisma,seed.ts}
│   ├── test/
│   └── .env.example
├── docs/
│   ├── api.md
│   └── railway-migration-recovery.md
├── AGENTS.md
└── README.md
```

Alur backend: **Routes → Controllers → Services → Prisma → PostgreSQL**. Middleware menangani authentication, authorization, validation, dan error terpusat. API client frontend berada di `client/src/services/`.

Relasi utama: User memiliki Company atau profil kandidat; Company memiliki Job; Application menghubungkan Job dengan Job Seeker dan opsional Resume. Setiap Application memiliki ApplicationHistory. Gaji disimpan sebagai bilangan bulat rupiah per bulan, minimal nol.

## Menjalankan Secara Lokal

1. **Siapkan prasyarat.** Instal Git, npm, PostgreSQL beserta CLI `createdb`, dan Node.js yang sesuai `engines` kedua aplikasi: `^22.22.2 || ^24.15.0 || >=26.0.0`. Pilihan praktis: Node.js 24.15.0 atau patch 24.x yang lebih baru. Pastikan PostgreSQL aktif dan akun database dapat membuat database.

2. **Clone repository dan buat database lokal.**

   ```bash
   git clone https://github.com/roihan37/indokerja-job-application-management.git
   cd indokerja-job-application-management
   createdb -h localhost -U <postgres-user> indokerja
   ```

   Ganti `<postgres-user>` dengan akun PostgreSQL Anda. CLI akan menggunakan mekanisme authentication PostgreSQL lokal; bila diminta, masukkan password akun tersebut.

3. **Terminal pertama: instal dan konfigurasi backend.**

   ```bash
   cd server
   npm ci
   cp .env.example .env
   ```

   Edit `server/.env`: isi `DATABASE_URL` dengan pola `postgresql://<user>:<password>@localhost:5432/indokerja?schema=public`, gunakan password yang di-URL-encode bila mengandung karakter khusus. Tetapkan `JWT_SECRET` acak minimal 32 karakter dan `DEMO_PASSWORD` khusus demo minimal 12 karakter, maksimal 72 byte UTF-8. Placeholder harus diganti sebelum menjalankan aplikasi atau seed.

   Pertahankan `PORT=4000` dan `CLIENT_ORIGIN=http://localhost:5173`. Konfigurasi Supabase dijelaskan di bawah; fitur inti selain penyimpanan resume dapat berjalan tanpa Supabase.

4. **Generate Prisma Client, jalankan migration, lalu seed dan server.** Masih di `server/`:

   ```bash
   npm run db:generate
   npm run db:migrate
   npm run db:seed
   npm run dev
   ```

   API lokal: `http://localhost:4000/api`. Tidak ada halaman beranda atau health endpoint khusus; membuka `/` dapat menghasilkan respons 404.

5. **Terminal kedua: instal dan jalankan frontend.** Mulai dari root repository:

   ```bash
   cd client
   npm ci
   cp .env.example .env
   npm run dev
   ```

   Pastikan `client/.env` berisi `VITE_API_BASE_URL=http://localhost:4000/api`. Buka **http://localhost:5173**, lalu login memakai email demo dan nilai `DEMO_PASSWORD` lokal. Gunakan port 5173; jika Vite memakai port lain, sesuaikan `CLIENT_ORIGIN` dan restart backend. Restart Vite setelah mengubah `.env`.

## Environment Variables

File lokal: `server/.env` dan `client/.env`, dibuat dari `.env.example` masing-masing. Jangan commit `.env` atau secret. Pada production, atur variabel lewat platform deployment.

| Variabel                  | Lokasi / kebutuhan         | Keterangan                                                                                                                   |
| ------------------------- | -------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`            | Backend, wajib             | URL PostgreSQL untuk runtime, Prisma migration, dan seed.                                                                    |
| `JWT_SECRET`              | Backend, wajib             | Secret minimal 32 karakter; gunakan nilai acak yang kuat.                                                                    |
| `PORT`                    | Backend, opsional          | Default `4000`; Railway menyediakan port runtime.                                                                            |
| `CLIENT_ORIGIN`           | Backend                    | Origin frontend yang diizinkan CORS; default `http://localhost:5173`. Production memakai origin Vercel tanpa trailing slash. |
| `DEMO_PASSWORD`           | Seed saja, wajib saat seed | Password semua akun demo; minimal 12 karakter dan maksimal 72 byte UTF-8.                                                    |
| `SUPABASE_URL`            | Backend, untuk resume      | URL project Supabase.                                                                                                        |
| `SUPABASE_SECRET_KEY`     | Backend, untuk resume      | Secret server-only Supabase; jangan kirim ke browser.                                                                        |
| `SUPABASE_STORAGE_BUCKET` | Backend                    | Nama private bucket; default `candidate-resumes`.                                                                            |
| `TEST_DATABASE_URL`       | Backend tests              | Database PostgreSQL terpisah dengan nama berakhiran `_test`, schema `public`.                                                |
| `VITE_API_BASE_URL`       | Frontend, public           | Base URL API termasuk `/api`; lokal `http://localhost:4000/api`, production URL HTTPS backend Railway dengan `/api`.         |

Semua variabel `VITE_` masuk ke bundle browser. Jangan menyimpan `JWT_SECRET`, `DATABASE_URL`, atau Supabase secret pada frontend.

## Resume dan Supabase Storage

1. Buat project Supabase dan bucket **private** bernama `candidate-resumes`.
2. Isi `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, dan `SUPABASE_STORAGE_BUCKET` di backend; restart server.
3. Login sebagai Job Seeker, buka **Profil saya** dari menu akun, lalu unggah PDF asli maksimal **5 MiB**.

Backend mengakses bucket dengan secret server-only dan memberikan signed URL yang berlaku **60 detik** setelah pemeriksaan hak akses. Perusahaan hanya dapat mengakses resume yang terlampir pada lamaran untuk lowongan miliknya. Tanpa konfigurasi storage, operasi yang memerlukan storage mengembalikan `503`; jangan membuat bucket public untuk mengatasi masalah akses.

Seed tidak mengunggah PDF atau membuat lampiran palsu. Unggah dokumen contoh melalui halaman profil, lalu pilih resume saat melamar lowongan baru.

## Database dan Seed

Prisma mengelola schema dan migration PostgreSQL. Selalu jalankan `npm run db:migrate` sebelum `npm run db:seed`, dari direktori `server/`.

Pada database baru, seed menyiapkan dua perusahaan, dua lowongan, dua Job Seeker beserta profilnya, dan empat lamaran dengan riwayat awal `Applied`. Kedua kandidat sudah melamar kedua lowongan demo; buat lowongan baru untuk mencoba alur Apply.

Seed menggunakan upsert: menjalankannya kembali memperbarui password akun demo, nama perusahaan, dan data lowongan demo. Profil yang sudah ada, lampiran, status, dan riwayat lamaran dipertahankan. Seed tidak menghapus seluruh data dan **tidak boleh dijalankan otomatis pada setiap deployment production**. Jalankan hanya secara sengaja pada database tujuan yang telah diperiksa.

## API Documentation

Kontrak request, response, error, dan aturan akses: **[docs/api.md](docs/api.md)**.

- `/api/auth/login`: login.
- `/api/jobs`: daftar, detail, dan pembuatan lowongan; nested `/applications` untuk melamar atau melihat pelamar.
- `/api/applications/me`, `/api/applications/:id/status`: lamaran sendiri dan pembaruan status oleh perusahaan pemilik.
- `/api/profile/me`: profil kandidat dan endpoint resume terkait.
- `/api/applications/:id/candidate` dan `/api/applications/:id/resume-url`: akses kandidat dan resume oleh perusahaan pemilik.

Endpoint memerlukan bearer token sesuai perannya, kecuali login. Error menggunakan envelope JSON konsisten; lamaran duplikat menghasilkan `409 Conflict`.

## Testing dan Quality Checks

Jalankan per aplikasi, dari direktorinya masing-masing:

| Pemeriksaan      | `server/`              | `client/`              |
| ---------------- | ---------------------- | ---------------------- |
| Lint             | `npm run lint`         | `npm run lint`         |
| TypeScript       | `npm run typecheck`    | `npm run typecheck`    |
| Format           | `npm run format:check` | `npm run format:check` |
| Production build | `npm run build`        | `npm run build`        |
| Unit tests       | `npm run test:unit`    | `npm test`             |
| Seluruh tests    | `npm test`             | `npm test`             |

Untuk integration tests backend, buat database khusus dan isi `TEST_DATABASE_URL` di `server/.env`:

```bash
createdb -h localhost -U <postgres-user> indokerja_test
cd server
npm run test:integration
```

Jalankan blok ini dari root repository. Gunakan URL database `indokerja_test` pada `TEST_DATABASE_URL`, bukan database development atau production. Test harness menerapkan migration dan membersihkan data test. Guard mewajibkan nama database berakhiran `_test`, schema `public`, dan database berbeda dari `DATABASE_URL`. `npm test` backend dan `npm run test:coverage` juga mencakup integration tests dan membutuhkan konfigurasi ini.

Lakukan pengecekan manual: login kedua peran, buat lowongan, unggah/pilih resume, melamar, cek penolakan duplikat, ubah status, dan pastikan perusahaan lain tidak dapat mengakses pelamar.

## Deployment

| Komponen       | Platform         |
| -------------- | ---------------- |
| Frontend       | Vercel           |
| Backend        | Railway          |
| PostgreSQL     | Railway          |
| Resume Storage | Supabase Storage |

- **Vercel:** root directory `client`, build `npm run build`, output `dist`. Atur `VITE_API_BASE_URL` ke URL HTTPS API Railway berakhiran `/api` sebelum build. `client/vercel.json` menyediakan SPA rewrite.
- **Railway:** root directory `server`. `server/railway.json` menetapkan build `npm run db:generate && npm run build`, pre-deploy `npm run db:migrate`, dan start `npm start`.
- **Backend environment:** sediakan `DATABASE_URL` PostgreSQL Railway, `JWT_SECRET`, `CLIENT_ORIGIN` sesuai origin Vercel, serta konfigurasi Supabase untuk resume. Validasi environment tetap wajib; secret yang hilang harus diperbaiki di Railway.
- **Seed production:** set `DEMO_PASSWORD` sesuai akun demo publik di atas, lalu jalankan `npm run db:seed` satu kali secara sengaja di environment Railway setelah migration berhasil. Jangan menjalankannya terhadap database lokal dan menganggap production telah terisi.
- Jika migration terblokir oleh catatan gagal/P3009, ikuti **[panduan recovery Railway](docs/railway-migration-recovery.md)** setelah memeriksa status dan SQL yang mungkin sudah diterapkan; jangan reset database production.

**Live frontend:** https://indokerja-job-application-managemen-theta.vercel.app/

Tautan production disediakan untuk review. Ketersediaan deployment, login demo, dan upload production perlu diverifikasi langsung; keberadaan konfigurasi deployment tidak membuktikan seluruh alur production sudah berhasil.

## Assessment Submission

- Repository: https://github.com/roihan37/indokerja-job-application-management
- Live demo: https://indokerja-job-application-managemen-theta.vercel.app/
- Akun dan password review: lihat **Demo Accounts** di awal dokumen.
