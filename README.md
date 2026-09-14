# CircleUp — Re:Date Web App (MVP)

Website companion untuk CircleUp Re:Date, dibangun dari `CircleUp_Website_Blueprint_MVP.docx` dan
`CircleUp_ReDate_UIUX_Wireframe_Design.docx`. Stack: **Next.js (App Router) + Supabase**
(Auth, Postgres, Realtime, Storage), sesuai rekomendasi di blueprint bab 21.

## Yang sudah dibangun (scope P0 penuh)

**Participant**
- Landing, Event Detail
- Create Account & Login (Supabase Auth — email privat, tidak pernah ditampilkan)
- Build Profile (foto, max 5 interest, dating intent privat) & Profile Preview
- Participant Dashboard dengan progress tracker event
- Event Pass (QR code untuk check-in)
- Mingle Game (Human Bingo checklist)
- Speed Date: partner profile card + timer **server-authoritative** (realtime via Supabase)
- Voting privat (Interested / Maybe / Not for me), idempotent (upsert, anti double-submit)
- Match Reveal, Connect (consent-based share Instagram/WhatsApp), My Matches
- Feedback, Referral

**Admin / Crew**
- Dashboard operasional (KPI ringkas)
- Events (create & kelola status lewat event state machine bab 15)
- Participants (approve / waitlist / reject, check-in manual, generate participant code)
- Pairing Management: pairing engine constrained (`lib/pairing.js`) — tidak duplikat dengan
  round sebelumnya, ada preview + regenerate sebelum lock (human-in-the-loop)
- Round Control & Live Monitor: start / pause / end / complete round, memantau jumlah vote masuk
- Matches: hitung mutual match (`lib/matching.js`) dan reveal ke peserta
- Analytics: approval rate, check-in rate, votes/participant, match rate, avg comfort/conversation
  score, repeat intention

**Keamanan & privasi** (bab 8, 18, 19) diimplementasikan lewat **Row Level Security Postgres**
di `supabase/schema.sql`:
- Voting hanya bisa dibaca oleh pemilik vote sendiri atau staff (agregat) — peserta lain tidak
  pernah bisa melihat siapa memilih siapa.
- Pairing hanya terlihat oleh dua peserta yang terlibat + staff.
- Kontak tidak pernah exposed sebelum ada consent record.
- Audit log untuk approve, pairing lock, dan match reveal.

## Yang belum (P1/P2 — lihat blueprint bab 22 & 25)

Conversation prompts otomatis lebih kaya, referral reward otomatis, personality/compatibility
insight, gamifikasi, in-app chat, dan broader discovery sengaja **belum** dibuat — sesuai prinsip
MVP di blueprint ("curated, not infinite" & fokus P0 dulu).

## Status saat ini

✅ Sudah diprovision otomatis ke akun Supabase kamu:
- Project baru **`circleup`** (terpisah dari project finance tracker kamu yang lama) — id `rkqrnrekouiigscvwcal`, region ap-southeast-1.
- Seluruh schema database (15 tabel) + Row Level Security policies sudah terpasang dan lolos security advisor (0 warning).
- Storage bucket `photos` (public, untuk foto profil) sudah dibuat.
- `.env.local` di folder ini **sudah diisi** URL + anon key project tersebut — langsung `npm install && npm run dev` bisa jalan.
- Git repo lokal sudah di-`git init` + commit pertama, tinggal push ke GitHub kamu.

⏳ Belum bisa aku lakukan otomatis (butuh akses yang belum tersedia lewat tool):
- **Push ke GitHub** — belum ada koneksi GitHub, jadi kamu perlu jalankan 3 baris command di bawah.
- **Deploy ke Vercel** — connector Vercel kamu baru sebagian terhubung (OAuth belum selesai) dan tools yang tersedia cuma read-only (lihat project/deployment, tidak bisa create/deploy). Jadi import project ke Vercel tetap manual lewat dashboard, tapi cuma ambil ±2 menit karena env var sudah aku siapkan di bawah.

## Push ke GitHub & deploy

```bash
# di folder circleup/ ini
git remote add origin https://github.com/<username-kamu>/circleup.git
git branch -M main
git push -u origin main
```

Lalu di https://vercel.com → **Add New Project** → import repo `circleup` → sebelum klik deploy, isi Environment Variables:

| Key | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://rkqrnrekouiigscvwcal.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | (lihat file `.env.local` di project ini) |

Klik **Deploy**. Setelah selesai, hubungkan domain kamu di tab **Domains**.

## Setup awal (sudah otomatis, referensi saja)

## Cara menjalankan

### 1. Setup Supabase
1. Buat project baru di https://supabase.com.
2. Buka **SQL Editor**, jalankan seluruh isi `supabase/schema.sql`.
3. Buka **Storage**, buat bucket baru bernama `photos`, set ke **public** (untuk foto profil).
4. Salin `Project URL` dan `anon public key` dari Project Settings → API.

### 2. Setup environment
```bash
cp .env.local.example .env.local
# isi NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
```

### 3. Install & jalankan
```bash
npm install
npm run dev
```
Buka http://localhost:3000

### 4. Jadikan akun sebagai admin
Setelah mendaftar lewat `/register`, jalankan di SQL Editor Supabase:
```sql
update profiles set role = 'admin' where user_id = '<user-id-kamu>';
```
Lalu akses `/admin`.

### 5. Buat event pertama
Login sebagai admin → `/admin/events` → isi form buat event → set status event ke
`open_registration` di halaman detail event agar muncul di landing page.

## Deploy ke production (jadi website beneran)

1. Push folder ini ke repo GitHub.
2. Buat project baru di https://vercel.com, import repo tersebut.
3. Set environment variables yang sama seperti `.env.local` di Vercel project settings.
4. Deploy. Domain default `*.vercel.app` bisa langsung dipakai, atau hubungkan custom domain
   `circleup.xxx` di tab Domains Vercel.

## Struktur folder penting
```
app/                  → semua halaman (App Router)
app/admin/            → seluruh halaman admin/crew
components/           → komponen UI reusable
lib/pairing.js        → pairing engine (bab 10)
lib/matching.js       → logika mutual match (bab 11)
lib/supabaseClient.js → Supabase client untuk Client Component
lib/supabaseServer.js → Supabase client untuk Server Component/Action
middleware.js         → proteksi route participant & admin/crew
supabase/schema.sql   → database + RLS policies
```

## Catatan sebelum event beneran (Developer Handoff Checklist, bab 27)
- Konfirmasi kapasitas peserta & jumlah round final.
- Konfirmasi aturan gender/eligibility/preference untuk pairing.
- Konfirmasi durasi speed date: 5/6/7 menit.
- Konfirmasi channel contact exchange yang diaktifkan (Instagram/WhatsApp).
- Siapkan device crew + koneksi internet venue, dan fallback manual pairing/scorecard bila
  koneksi bermasalah.
- Jalankan dry-run penuh dengan akun dummy sebelum hari-H.
