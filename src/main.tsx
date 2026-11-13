import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { liveBoot } from "./LiveContext";
import { phaseLabels } from "./utils/cooperation";

// Akun nyata: label tahap tanpa penanda demo.
if (liveBoot()) phaseLabels.inquiry = "Permintaan terkirim";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <div className="relative z-[1] bg-ink px-4 py-1.5 text-center text-[11px] text-[#fff4db] sm:py-2">
      {liveBoot() ? <>
        <span className="sm:hidden">Akun VAKSARA · data Anda tersimpan di server</span>
        <span className="hidden sm:inline">Akun VAKSARA · Data Anda tersimpan di server. Profil bertanda "Contoh" adalah ilustrasi; pelaku "Terdaftar di VAKSARA" adalah akun sungguhan.</span>
      </> : <>
        <span className="sm:hidden">DEMO · data contoh, bukan transaksi nyata</span>
        <span className="hidden sm:inline">DEMO LOKAL · Profil, rating, ulasan, transaksi dan status verifikasi adalah contoh UI. Foto merupakan ilustrasi, bukan bukti identitas atau layanan.</span>
      </>}
    </div>
    <App />
  </StrictMode>
);

