# VAKSARA

Marketplace dan perencana pernikahan adat Bugis-Makassar. Diikutsertakan dalam BUDAYA GO! 2026, Inovasi Digital, Subtema 2.

## Menjalankan

```bash
npm ci
npm run dev     # pengembangan
npm run build   # hasil di dist/
```

## Akun demo

| Peran | Nama pengguna | Kata sandi |
|---|---|---|
| Keluarga | keluarga | vaksara2026 |
| Pelaku budaya / vendor | pelaku | vaksara2026 |
| Peninjau | peninjau | vaksara2026 |

Data demo tersimpan di browser (localStorage). Tombol "Reset demo" mengembalikan data awal.

## Deploy

Vercel: import repo ini, framework Vite. Pengaturan build diambil dari `vercel.json`.
Kunci layanan (Supabase, Xendit, Resend) hanya dimasukkan di Environment Variables Vercel, jangan di kode.

## Daftar vendor publik

Edit `src/daftar-vendor.csv` (pemisah `;`). Vendor di daftar ini belum terdaftar di VAKSARA dan ditampilkan dengan label "Belum terdaftar".
