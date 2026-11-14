# Panduan Dana Amanah lewat Xendit

Dana Amanah di akun nyata memakai akun Xendit VAKSARA. Ikuti urutan ini. Mulai dengan **kunci uji (test mode)**, coba satu alur penuh, baru ganti ke kunci live.

## Cara kerjanya

| Cara bayar (dipilih pelaku di penawaran, disetujui kedua pihak) | Uang dari keluarga | Ditahan VAKSARA | Ke pelaku |
|---|---|---|---|
| Transfer langsung | Transfer sendiri ke pelaku | — | Langsung; pelaku mengonfirmasi di aplikasi |
| Dana Amanah penuh | Tagihan Xendit (virtual account) | 100% | Saat satu pihak mengusulkan dan pihak lain menyetujui |
| Dana Amanah sebagian (mis. 30%) | Tagihan Xendit | 30% | 70% otomatis saat bayar; 30% saat kedua pihak setuju |

Aturan dana:

- Dana Amanah ditahan **tanpa batas waktu dan nominal**, sampai disetujui kedua pihak. Saat sengketa, dana dibekukan.
- Biaya bayar (`PAYMENT_FEE`) ditambahkan ke tagihan keluarga.
- Biaya transfer (`PAYOUT_FEE`) dipotong dari jumlah yang diterima. Ini berlaku untuk pelaku, dan juga untuk keluarga pada refund.
- Pencairan ke pelaku **hanya ke rekening yang disetujui peninjau**. Pelaku mengisi rekening dan mengunggah buku rekening di halaman Profil. Atas nama harus sama dengan nama usaha (NIB) atau nama penanggung jawab (KTP). Bila rekening diubah, pencairan ditahan sampai rekening disetujui ulang.
- Refund ke keluarga: keluarga mengisi rekening tujuan, lalu peninjau mencocokkan nama dengan KTP sebelum mengirim.
- Setiap uang masuk dan keluar tercatat beserta pengirim, penerima, rekening tujuan, biaya, dan status. Catatan ini terlihat oleh kedua pihak dan peninjau.

## 1. Jalankan SQL

Supabase → SQL Editor → tempel seluruh isi `SUPABASE-schema.sql` → Run. Berkas ini aman dijalankan ulang.

## 2. Siapkan Xendit

1. Di Xendit Dashboard (mode **Test** dulu), buka **Settings → API Keys** dan buat kunci rahasia dengan izin:
   - Money-in: **Invoices**, izin Write
   - Money-out: **Payouts / Disbursements**, izin Write
   - Izin Read untuk keduanya
2. Buka **Settings → Webhooks** dan salin **Webhook Verification Token**.
3. Pastikan virtual account BCA, BNI, BRI, Mandiri, Permata, dan BSI sudah aktif. Kalau ada yang belum aktif, atur `XENDIT_PAYMENT_METHODS` di langkah 3 sesuai yang aktif.

## 3. Isi Secrets di Supabase

Edge Functions → **Secrets**:

| Nama | Isi |
|---|---|
| `XENDIT_SECRET_KEY` | Kunci rahasia Xendit (awalnya kunci test `xnd_development_…`) |
| `XENDIT_CALLBACK_TOKEN` | Webhook Verification Token dari Xendit |
| `PAYMENT_FEE` | Biaya virtual account per transaksi sesuai kontrak Xendit Anda, dalam rupiah bulat termasuk PPN (contoh: `4995`) |
| `PAYOUT_FEE` | Biaya transfer keluar per transaksi sesuai kontrak (contoh: `5550`) |
| `SITE_URL` | `https://vaksara.id` |
| `XENDIT_PAYMENT_METHODS` | (opsional) daftar VA dipisah koma, bawaan: `BCA,BNI,BRI,MANDIRI,PERMATA,BSI` |

Jangan tempel kunci rahasia di chat, email, atau berkas kode.

## 4. Pasang fungsi server

1. **cooperation-action**: ganti seluruh kodenya dengan isi `supabase/functions/cooperation-action/index.ts`, lalu Deploy.
2. **xendit-webhook** (fungsi baru): Edge Functions → Deploy a new function → nama `xendit-webhook` → tempel seluruh isi `supabase/functions/xendit-webhook/index.ts` → Deploy. Lalu matikan **Verify JWT**: Xendit tidak mengirim token Supabase, jadi keasliannya diperiksa dengan token webhook.

## 5. Daftarkan URL webhook di Xendit

Settings → Webhooks. Isi URL yang sama untuk:

- **Invoices paid** (dan expired, bila ada pilihannya)
- **Payouts / Disbursement** (berhasil atau gagal)

URL: `https://<ID-PROYEK>.supabase.co/functions/v1/xendit-webhook`

## 6. Uji di mode Test

1. Pelaku: Profil → isi rekening pencairan dan unggah buku rekening.
2. Admin: Screening → periksa rekening → Setujui.
3. Pelaku membuat penawaran "Dana Amanah sebagian 30%". Keluarga menerima, lalu kedua pihak menyetujui.
4. Keluarga: Pembayaran → **Buat tagihan & bayar**. Di halaman Xendit mode test, selesaikan dengan simulasi pembayaran.
5. Dalam beberapa detik, saldo di aplikasi berubah: 30% ditahan dan 70% "Sedang dikirim" ke rekening pelaku.
6. Pelaku mengusulkan pencairan, keluarga menyetujui, lalu transfer keluar tercatat.
7. Coba pembatalan dengan refund. Keluarga mengisi rekening refund, lalu admin menekan "Nama cocok, kirim refund".

Setelah semuanya jalan, ganti `XENDIT_SECRET_KEY` dan `XENDIT_CALLBACK_TOKEN` dengan kunci **live**, lalu daftarkan URL webhook yang sama di mode Live.

## Hal yang perlu diketahui

- **Saldo untuk pencairan.** Uang dari virtual account baru bisa ditransfer keluar setelah masuk saldo Xendit (settlement). Kalau saldo belum cukup, pencairan tercatat "Gagal" dan peninjau diberi tahu. Tekan "Kirim ulang" di Screening setelah saldo masuk.
- **Kode bank.** Daftar bank di aplikasi memakai kode payout Xendit (`ID_BCA`, `ID_BRI`, `ID_SULSELBAR`, …). Kalau Xendit menolak satu kode, pencairan tercatat gagal dengan pesannya, dan kodenya perlu dicek di daftar channel Xendit.
- **Izin dan kontrak.** Menahan dana pelanggan tanpa batas waktu di saldo akun VAKSARA perlu dipastikan sesuai kontrak Xendit dan ketentuan yang berlaku. Tanyakan ke tim Xendit, misalnya tentang xenPlatform untuk marketplace, dan ke penasihat hukum.
- **Uji otomatis.** `qa-live/qa-escrow.mjs` menjalankan 59 skenario terhadap Xendit tiruan, termasuk:
  - webhook palsu, webhook ganda, rekening diubah, pencairan gagal lalu dikirim ulang, refund, dan tagihan kedaluwarsa;
  - pembatasan hak baca: keluarga lain tidak dapat melihat data pembayaran dan rekening.
