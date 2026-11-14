# Dokumen verifikasi dan verifikasi wajah

## Aturan

| Pengguna | Dokumen | Kapan |
|---|---|---|
| Pelaku budaya | **Wajib:** KTP penanggung jawab, 2–5 foto kegiatan, verifikasi wajah. **Opsional:** NIB / izin usaha, surat rekomendasi sanggar/komunitas | Sebelum peninjau dapat menyetujui profil (ditegakkan database) |
| Keluarga | KTP salah satu anggota keluarga | Sebelum menyetujui perjanjian (ditegakkan database) |

- Berkas disimpan di bucket privat `verifikasi`, folder per akun. Hanya pemilik dan peninjau (`is_admin`) yang dapat membuka, lewat tautan sementara 5 menit.
- Pelaku budaya tidak dapat membuka KTP keluarga; ia hanya tahu KTP sudah tersedia.
- Verifikasi wajah: 6 langkah acak (lurus, toleh kiri/kanan, senyum, atas/bawah). Wajah diproses di perangkat pengguna dengan MediaPipe Face Landmarker. VAKSARA menyimpan **satu foto posisi lurus** dan urutan langkah yang diselesaikan. Peninjau mencocokkan foto itu dengan foto di KTP.
- Persetujuan foto wajah diminta tegas sebelum kamera dibuka (data biometrik = data pribadi spesifik, UU 27/2022).

## Batasan yang perlu diketahui

- Verifikasi wajah membuktikan ada orang sungguhan di depan kamera, bukan bahwa orang itu pemilik KTP. Pencocokan dilakukan peninjau dengan melihat. Pencocokan otomatis dengan data Dukcapil memerlukan penyedia e-KYC berizin.
- Pemeriksaan gerakan berjalan di browser; orang yang paham teknis dapat memalsukan hasilnya. Foto yang tersimpan tetap diperiksa peninjau.
- Profil yang sudah disetujui sebelum fitur ini wajib melengkapi dokumen saat ditinjau ulang.

## Pemasangan

Supabase → SQL Editor → jalankan seluruh `supabase/schema.sql` (aman dijalankan ulang). Bucket `verifikasi` dan aturannya dibuat otomatis.

Pengecekan: Storage → bucket `verifikasi` ada dan berstatus **Private**.
