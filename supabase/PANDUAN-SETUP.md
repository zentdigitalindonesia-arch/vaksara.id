# Menyalakan akun nyata VAKSARA (Supabase + Resend + Vercel)

Tanpa langkah ini aplikasi tetap berjalan sebagai demo. Setelah langkah ini, pengguna dapat mendaftar dengan email, data tersimpan di server, dan keluarga serta pelaku budaya bekerja sama dari perangkat masing-masing.

## 1. Buat tabel (sekali saja)
Supabase → **SQL Editor** → **New query** → tempel seluruh isi `supabase/schema.sql` → **Run**.
Aman dijalankan ulang bila ada pembaruan skema.

## 2. Pengaturan login email
Supabase → **Authentication**:
- **Sign In / Providers → Email**: aktif, **Confirm email** aktif.
- **URL Configuration**: Site URL `https://wedding.vaksara.id`. Redirect URLs: `https://wedding.vaksara.id/**`, `https://vaksaraid.vercel.app/**`.
- **Emails → Templates**: ubah dua template berikut agar berisi kode angka (aplikasi memakai kode, bukan tautan):
  - *Confirm signup*, subjek `Kode verifikasi VAKSARA`, isi:
    `<h2>Kode verifikasi VAKSARA</h2><p>Masukkan kode berikut di aplikasi:</p><h1>{{ .Token }}</h1><p>Kode berlaku 1 jam. Abaikan email ini bila Anda tidak mendaftar.</p>`
  - *Reset password*, subjek `Kode pemulihan kata sandi VAKSARA`, isi:
    `<h2>Pemulihan kata sandi</h2><p>Masukkan kode berikut di aplikasi:</p><h1>{{ .Token }}</h1><p>Abaikan bila Anda tidak memintanya.</p>`

## 3. Kirim email lewat Resend (wajib untuk pengguna sungguhan)
Pengirim bawaan Supabase hanya untuk uji coba dan dibatasi beberapa email per jam.
1. Resend → **Domains** → tambahkan `vaksara.id` → salin record DNS yang ditampilkan ke DomaiNesia (DNS Management) → tunggu status *Verified*.
2. Resend → **API Keys** → buat kunci baru (izin *Sending access*).
3. Supabase → **Authentication → Emails → SMTP Settings** → aktifkan Custom SMTP:
   - Host `smtp.resend.com`, Port `465`, Username `resend`, Password = API key Resend
   - Sender email `noreply@vaksara.id`, Sender name `VAKSARA`
4. Supabase → **Authentication → Rate Limits** → naikkan batas email per jam (mis. 100).

Kunci API hanya diisi di dashboard Supabase. Jangan ditulis di kode atau dikirim lewat chat.

## 4. Sambungkan Vercel
Vercel → proyek **vaksara.id** → **Settings → Environment Variables**, centang *Production* dan *Preview*:
- `VITE_SUPABASE_URL` = URL proyek (Supabase → tombol **Connect**, mis. `https://xxxx.supabase.co`)
- `VITE_SUPABASE_ANON_KEY` = kunci **anon** / **publishable** (bukan *service_role* / *secret*)

Lalu **Deployments → Redeploy**. Kunci anon memang dirancang untuk berada di browser; keamanan data dijaga aturan RLS di `schema.sql`.

## 5. Jadikan akun Anda admin
Daftar dulu lewat aplikasi seperti pengguna biasa, lalu di SQL Editor:
```sql
update public.profiles set is_admin = true where email = 'email-anda@contoh.com';
```
Akun admin dapat membuka **Screening pelaku budaya** (menyetujui profil pelaku) dan konsol pemilik (ekspor CSV semua data).

## 6. Uji alur lengkap
1. Daftar akun **pelaku budaya** (email A) → isi **Profil layanan**.
2. Masuk sebagai admin → **Screening pelaku budaya** → centang tiga pemeriksaan → **Setujui**.
3. Di perangkat lain, daftar akun **keluarga** (email B) → **Cari pelaku budaya** → bagian *Pelaku budaya terdaftar* → **Kirim permintaan**.
4. Pelaku membuka **Kerja sama**, membalas, mengirim penawaran; keluarga menyetujui, dan seterusnya.

## Batasan saat ini (jujur untuk juri)
- Perubahan tahap kerja sama divalidasi di aplikasi; database membatasi siapa yang boleh mengubah (hanya kedua pihak), tetapi validasi urutan tahap di server menyusul.
- Pembayaran / Dana Amanah masih simulasi pencatatan; integrasi Xendit menyusul.
- OTP WhatsApp menyusul; verifikasi saat ini lewat kode email.
