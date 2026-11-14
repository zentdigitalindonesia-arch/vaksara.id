# Pemberitahuan VAKSARA: lonceng dan email

Pemicu di database mencatat kejadian penting ke tabel `notifications`. Lonceng di aplikasi membaca tabel itu. Email dikirim oleh Edge Function `notify-email` lewat Resend setiap kali ada baris baru.

| Penerima | Contoh kejadian |
|---|---|
| Pelaku budaya | Profil disetujui / perlu perbaikan / ditinjau ulang · permintaan baru · keluarga menerima penawaran, menyetujui perjanjian, mencatat pembayaran, meminta revisi, menerima BAST · sengketa · permintaan terbuka di kategorinya |
| Keluarga | Pelaku membalas / menolak · penawaran baru atau revisi · pelaku menyetujui perjanjian · pembayaran dikonfirmasi / ditolak · pelaksanaan dimulai · BAST diajukan · ada pelaku berminat pada permintaan terbuka · hasil mediasi |
| Peninjau (`is_admin`) | Pendaftar baru · profil diubah atau diajukan ulang · sengketa menunggu mediasi |

Pihak yang melakukan tindakan tidak diberi tahu tentang tindakannya sendiri.

## Langkah 1 — Database (wajib, untuk lonceng)

Supabase → **SQL Editor** → New query → tempel seluruh isi `supabase/schema.sql` → **Run**. Berkas ini aman dijalankan ulang.

Setelah langkah ini lonceng sudah bekerja. Langkah 2–4 menambahkan email.

## Langkah 2 — Secrets

Supabase → **Edge Functions** → **Secrets** → tambahkan:

| Nama | Isi |
|---|---|
| `RESEND_API_KEY` | Kunci API Resend. Boleh kunci yang sama dengan sandi SMTP di Auth → SMTP Settings. |
| `NOTIFY_FROM` | Pengirim yang sama dengan email kode verifikasi, mis. `VAKSARA <notifikasi@vaksara.id>`. Domainnya harus sudah terverifikasi di Resend. |
| `WEBHOOK_SECRET` | Teks acak panjang buatan Anda sendiri, mis. 32 huruf dan angka. Simpan, dipakai lagi di langkah 4. |

`SUPABASE_URL` dan `SUPABASE_SERVICE_ROLE_KEY` sudah tersedia otomatis; jangan ditambahkan.

## Langkah 3 — Edge Function

Supabase → **Edge Functions** → **Deploy a new function** → **Via Editor**:

1. Nama fungsi: `notify-email`.
2. Hapus isi contoh, tempel seluruh isi `supabase/functions/notify-email/index.ts`, lalu **Deploy**.
3. Buka fungsi `notify-email` → **Details / Settings** → matikan **Enforce JWT verification** (Verify JWT), lalu simpan. Keamanannya dijaga oleh `WEBHOOK_SECRET`.

## Langkah 4 — Database Webhook

Supabase → **Database** → **Webhooks** (aktifkan bila diminta) → **Create a new hook**:

- Name: `kirim-email-notifikasi`
- Table: `notifications` · Events: **Insert** saja
- Type: **Supabase Edge Functions** · Function: `notify-email` · Method: POST
- HTTP Headers → tambah `x-webhook-secret` dengan isi yang sama persis dengan `WEBHOOK_SECRET`

Simpan.

## Mencoba

1. Dengan akun pelaku budaya, ubah deskripsi profil lalu simpan.
2. Akun peninjau akan menerima email "Tinjau ulang: …" dan angka merah di lonceng.
3. Bila email tidak datang: Edge Functions → `notify-email` → **Logs**.
   - `forbidden` → header webhook tidak sama dengan `WEBHOOK_SECRET`.
   - `resend failed` → periksa `RESEND_API_KEY` dan domain `NOTIFY_FROM`.
   - `skipped` → pengguna mematikan email di lonceng, atau profil tanpa email.

Pengguna dapat mematikan email lewat ikon lonceng → **Kirim juga ke email**. Lonceng tetap bekerja.
