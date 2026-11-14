# Fungsi server kerja sama (cooperation-action)

Setiap langkah kerja sama (permintaan, penawaran, persetujuan, pembayaran, pelaksanaan, BAST, sengketa, mediasi,
pembatalan) dikirim ke Edge Function `cooperation-action`. Fungsi ini:

- memeriksa sesi akun ke Supabase Auth (token palsu atau kedaluwarsa ditolak);
- menentukan pihak dari akun: keluarga, pelaku budaya, atau peninjau (`is_admin`) — bukan dari isian browser;
- menjalankan aturan alur yang sama dengan aplikasi (`src/utils/cooperation.ts`), dengan waktu dari server;
- menolak Dana Amanah di akun nyata;
- menyimpan hasil, dengan pengaman bila dua pihak bertindak bersamaan.

Browser tidak lagi dapat menulis langsung ke tabel `cooperations` (dicabut di `schema.sql`).
Peninjau hanya dapat mencatat mediasi; tidak dapat bertindak atas nama keluarga atau pelaku.

## Pemasangan (urutan penting)

1. **Fungsi dulu.** Supabase → Edge Functions → Deploy a new function → Via Editor.
   Nama: `cooperation-action`. Hapus kode contoh, tempel **seluruh** isi
   `supabase/functions/cooperation-action/index.ts`, lalu Deploy.
2. Buka fungsi `cooperation-action` → Details → matikan **Verify JWT with legacy secret** → Save changes.
   (Sesi tetap diperiksa di dalam fungsi.)
3. **SQL kemudian.** SQL Editor → jalankan seluruh `supabase/schema.sql`.

Selama fungsi belum dipasang, aplikasi memakai jalur lama. Setelah SQL langkah 3 dijalankan, jalur lama ditolak,
jadi pastikan langkah 1–2 selesai lebih dulu.

## Mengubah aturan alur

Aturan ada di `src/utils/cooperation.ts`. Setelah mengubahnya, jalankan `npm run build:functions` lalu tempel ulang
`index.ts` di editor Supabase. `npm run check` gagal bila `index.ts` belum disusun ulang.

## Uji

`qa-live/qa-function.mjs`: 33 skenario lewat tiruan Supabase (Postgres asli + RLS asli), termasuk upaya pemalsuan.
