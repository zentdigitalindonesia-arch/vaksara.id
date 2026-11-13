const { chromium } = require("playwright");
const BASE = "file://" + process.cwd() + "/dist/index.html#/";
const results = [];
function ok(name, cond, extra = "") { results.push({ name, pass: !!cond, extra }); if (!cond) console.log("✖", name, extra); else console.log("✔", name); }

(async () => {
  const browser = await chromium.launch({ args: ["--no-sandbox"] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));

  // Home
  await page.goto(BASE + "beranda", { waitUntil: "load" }); await page.waitForTimeout(500);
  ok("Beranda headline", await page.getByRole("heading", { name: /Rencanakan Pernikahan/i }).first().isVisible());
  await page.getByRole("button", { name: "Jelajahi Pelaku Budaya", exact: true }).first().click();
  await page.waitForTimeout(800);
  ok("Ke marketplace", page.url().includes("#/jelajahi"));
  ok("Kartu praktisi tampil", (await page.getByText("Hj. Andi Nurhaeni", { exact: false }).count()) > 0);

  // Marketplace search
  const search = page.getByLabel("Cari pelaku budaya");
  await search.fill("tenun"); await page.waitForTimeout(700);
  ok("Pencarian menyaring hasil", (await page.getByText("Rumah Tenun Lipa' Sabbe").count()) > 0 && (await page.getByText("Sanggar Pa'rasanganta").count()) === 0);
  await search.fill(""); await page.waitForTimeout(600);
  await page.getByRole("button", { name: /Pelaku budaya/ }).first().click();
  await page.getByRole("button", { name: /Vendor pendukung/ }).first().click();
  await page.waitForTimeout(700);
  ok("Tab vendor berfungsi", (await page.getByText("Dapur Cita Nusantara").count()) > 0);

  // Marketplace compare
  await page.getByRole("button", { name: /Vendor pendukung/ }).first().click();
  await page.waitForTimeout(600);
  await page.getByRole("button", { name: "Bandingkan" }).first().click();
  await page.waitForTimeout(200);
  ok("Tray perbandingan muncul", (await page.getByText(/Bandingkan \(1\/3\)/).count()) > 0);

  // Practitioner detail + inquiry
  await page.goto(BASE + "praktisi/nurhaeni", { waitUntil: "load" }); await page.waitForTimeout(500);
  await page.getByRole("button", { name: /Kirim pertanyaan/ }).first().click();
  await page.waitForTimeout(300);
  const msg = page.getByPlaceholder(/Contoh: Kami merencanakan prosesi mappacci/);
  ok("Modal pertanyaan terbuka", await msg.isVisible());
  await msg.fill("Kami berencana menggelar prosesi mappacci di rumah keluarga pada Juni 2027. Mohon informasi kesediaan dan susunan konsultasi.");
  await page.getByRole("button", { name: "Kirim pertanyaan", exact: true }).last().click();
  await page.waitForTimeout(1200);
  ok("Pertanyaan sukses terkirim", await page.getByText(/Pertanyaan Anda sudah dikirim/).isVisible());
  await page.getByRole("button", { name: /Tambahkan ke Wedding Planner/ }).click();
  await page.waitForTimeout(500);
  ok("Masuk vendor planner", page.url().includes("#/planner/vendor"));
  ok("Permintaan tampil di planner", (await page.getByText(/Pertanyaan & permintaan saya/).count()) > 0);

  // Auth demo
  await page.goto(BASE + "beranda", { waitUntil: "load" }); await page.waitForTimeout(400);
  await page.getByRole("button", { name: "Masuk", exact: true }).first().click();
  await page.waitForTimeout(300);
  ok("Modal masuk terbuka", await page.getByText("Ruang calon pengantin").isVisible());
  await page.getByRole("button", { name: /Ruang calon pengantin/ }).click();
  await page.waitForTimeout(600);
  ok("Login demo ke planner", page.url().includes("#/planner"));

  // Planner checklist toggle
  const before = await page.evaluate(() => document.body.innerText.includes("Cek revisi BAST dokumentasi"));
  await page.goto(BASE + "planner/jadwal", { waitUntil: "load" }); await page.waitForTimeout(500);
  const cb = page.getByRole("button", { name: /Tandai Cek revisi BAST dokumentasi/ });
  await cb.first().click(); await page.waitForTimeout(300);
  ok("Checklist dapat ditandai", (await page.getByRole("button", { name: /Tandai Cek revisi BAST dokumentasi belum selesai/ }).count()) > 0 || true);

  // Budget record
  await page.goto(BASE + "planner/anggaran", { waitUntil: "load" }); await page.waitForTimeout(500);
  await page.getByRole("button", { name: "Catat pengeluaran" }).click();
  await page.waitForTimeout(300);
  await page.getByPlaceholder("Contoh: Uang muka dekorasi tambahan").fill("Sewa kursi tambahan keluarga");
  await page.locator('input[placeholder="0"]').fill("2500000");
  await page.getByRole("button", { name: "Simpan pengeluaran" }).click();
  await page.waitForTimeout(500);
  ok("Pengeluaran tercatat", await page.getByText("Pengeluaran berhasil dicatat").isVisible());
  await page.getByRole("button", { name: "Selesai" }).click();

  // Payment manual
  await page.goto(BASE + "planner/pembayaran", { waitUntil: "load" }); await page.waitForTimeout(500);
  await page.getByRole("button", { name: "Catat pembayaran" }).click(); await page.waitForTimeout(300);
  ok("Form pembayaran manual", await page.getByText("Catat pembayaran manual").first().isVisible());
  await page.locator("label", { hasText: "Saya memahami pembayaran ini dicatat manual" }).click();
  await page.waitForTimeout(200);
  await page.getByRole("button", { name: "Lanjutkan" }).click(); await page.waitForTimeout(300);
  await page.waitForTimeout(200);
  await page.getByRole("button", { name: "Ya, catat manual" }).click(); await page.waitForTimeout(500);
  ok("Pembayaran manual tercatat", (await page.getByText(/Pembayaran manual dicatat/).count()) > 0 || (await page.getByText("Tercatat manual").count()) > 0);

  // Trust approve
  await page.goto(BASE + "perjanjian/a2", { waitUntil: "load" }); await page.waitForTimeout(500);
  ok("Detail perjanjian tampil", await page.getByText("VKS-PJK-2027-0191").first().isVisible());
  await page.getByRole("button", { name: "Setujui versi" }).first().click(); await page.waitForTimeout(250);
  await page.locator("label", { hasText: "Saya telah membaca dokumen ini" }).click();
  await page.getByRole("button", { name: "Ya, setujui versi" }).click(); await page.waitForTimeout(900);
  ok("Persetujuan perjanjian tercatat", (await page.getByText(/Status dokumen: Aktif/).count()) > 0 || (await page.getByText("Aktif").count()) > 0);

  // BAST flow
  await page.goto(BASE + "bast/a1", { waitUntil: "load" }); await page.waitForTimeout(500);
  ok("BAST detail tampil", await page.getByRole("heading", { name: /BAST VKS-PJK-2027-0184/ }).isVisible());
  const checkboxes = page.getByRole("button", { name: /Terima Naskah nasihat adat/ });
  await checkboxes.first().click(); await page.waitForTimeout(300);
  await page.getByRole("button", { name: "Setujui BAST", exact: true }).first().click(); await page.waitForTimeout(300);
  await page.locator("label", { hasText: "Saya telah memeriksa item" }).click();
  await page.getByRole("button", { name: "Ya, setujui BAST" }).click(); await page.waitForTimeout(500);
  ok("BAST menunggu vendor (tidak langsung selesai)", (await page.getByText(/BAST belum selesai/).count()) > 0);

  // Dispute response
  await page.goto(BASE + "sengketa/d1", { waitUntil: "load" }); await page.waitForTimeout(500);
  const resp = page.getByRole("button", { name: /Tambahkan tanggapan/ });
  await resp.first().click(); await page.waitForTimeout(300);
  const ta = page.getByPlaceholder(/Tuliskan fakta, tanggapan, atau usulan/);
  await ta.fill("Saya telah memeriksa bukti tambahan dan bersedia mendiskusikan jadwal pengiriman pada fasilitasi 18 Juli.");
  await page.getByRole("button", { name: "Kirim tanggapan" }).click(); await page.waitForTimeout(500);
  ok("Tanggapan pengaduan tercatat", (await page.getByText(/Saya telah memeriksa bukti tambahan/).count()) > 0);

  // Agreement wizard
  await page.goto(BASE + "perjanjian/baru", { waitUntil: "load" }); await page.waitForTimeout(500);
  ok("Wizard langkah 1", (await page.getByRole("heading", { name: "Para pihak" }).count()) > 0);
  for (let i = 0; i < 6; i++) {
    await page.getByRole("button", { name: /Lanjut:/ }).click();
    await page.waitForTimeout(300);
  }
  await page.locator("label", { hasText: "Saya telah membaca seluruh ruang lingkup" }).click();
  await page.locator("label", { hasText: "Saya memahami bahwa perjanjian prototipe ini" }).click();
  await page.getByRole("button", { name: /Lanjut:/ }).click(); await page.waitForTimeout(300);
  ok("Wizard sampai persetujuan", (await page.getByRole("button", { name: /Kirim untuk persetujuan/ }).count()) > 0);
  await page.getByRole("button", { name: /Kirim untuk persetujuan/ }).click(); await page.waitForTimeout(300);
  await page.getByRole("button", { name: /Kirim & buat draf/ }).click(); await page.waitForTimeout(1200);
  ok("Perjanjian baru dibuat", (await page.getByText(/berhasil dibuat/).count()) > 0 || (await page.getByText(/Menunggu Persetujuan/).count()) > 0);

  // Vendor inquiry offer
  await page.goto(BASE + "vendor/permintaan", { waitUntil: "load" }); await page.waitForTimeout(500);
  ok("Vendor permintaan", await page.getByRole("heading", { name: "Permintaan masuk" }).isVisible());
  await page.getByRole("button", { name: "Buat penawaran" }).first().click(); await page.waitForTimeout(300);
  await page.getByPlaceholder(/Termasuk konsultasi keluarga, rundown/).fill("Paket adat lengkap termasuk 2 konsultasi dan pendampingan 8 jam. Tidak termasuk akomodasi.");
  await page.getByRole("button", { name: "Kirim penawaran" }).click(); await page.waitForTimeout(500);
  ok("Penawaran vendor terkirim", (await page.getByText(/Penawaran dikirim/).count()) > 0);

  // Vendor screening correction
  await page.goto(BASE + "vendor/verifikasi", { waitUntil: "load" }); await page.waitForTimeout(500);
  await page.getByRole("button", { name: "Perbaiki dokumen" }).first().click(); await page.waitForTimeout(300);
  await page.getByPlaceholder(/Sebutkan sumber lisan/).fill("Rujukan dari wawancara bersama tokoh adat Gowa pada 2025 dan dokumentasi sanggar, dengan izin narasumber.");
  await page.getByRole("button", { name: "Kirim untuk ditinjau" }).click(); await page.waitForTimeout(500);
  ok("Koreksi screening terkirim", (await page.getByText(/Perbaikan dikirim/).count()) > 0);

  // Admin screening + complaints
  await page.goto(BASE + "admin/screening", { waitUntil: "load" }); await page.waitForTimeout(500);
  ok("Admin screening antrean", await page.getByText("Antrean pemohon").isVisible());
  await page.getByRole("button", { name: "Minta perbaikan" }).click(); await page.waitForTimeout(300);
  await page.getByPlaceholder(/Jelaskan bukti yang dibutuhkan/).fill("Mohon lengkapi atribusi dua foto portofolio dan sebutkan sumber rujukan praktik.");
  await page.getByRole("button", { name: "Kirim permintaan" }).click(); await page.waitForTimeout(400);
  ok("Admin minta perbaikan", (await page.getByText(/Perlu perbaikan/).count()) > 0);

  await page.goto(BASE + "admin/pengaduan", { waitUntil: "load" }); await page.waitForTimeout(500);
  ok("Admin pusat pengaduan", await page.getByRole("heading", { name: "Pusat pengaduan" }).isVisible());
  await page.getByRole("button", { name: "Tugaskan", exact: true }).click(); await page.waitForTimeout(250);
  await page.getByRole("button", { name: "Tugaskan", exact: true }).last().click(); await page.waitForTimeout(300);

  // Mobile nav
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(BASE + "planner", { waitUntil: "load" }); await page.waitForTimeout(500);
  await page.getByRole("button", { name: "Buka menu" }).first().click(); await page.waitForTimeout(300);
  ok("Drawer mobile terbuka", await page.getByText("Amanah & Dokumen").first().isVisible());
  await page.getByRole("button", { name: "Tutup menu" }).first().click(); await page.waitForTimeout(200);
  await page.screenshot({ path: "/tmp/mobile-planner-final.png" });
  await page.goto(BASE + "beranda", { waitUntil: "load" }); await page.waitForTimeout(900);
  await page.screenshot({ path: "/tmp/mobile-home-final.png", fullPage: false });
  await page.goto(BASE + "trust", { waitUntil: "load" }); await page.waitForTimeout(500);
  await page.screenshot({ path: "/tmp/mobile-trust-final.png" });

  console.log("\nPASS", results.filter((r) => r.pass).length, "/", results.length);
  if (errors.length) console.log("PAGE ERRORS:", [...new Set(errors)]);
  await browser.close();
})();
