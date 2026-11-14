import { liveEnabled } from "@/utils/supabase";
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
    <div className="relative z-[1] bg-ink px-4 py-1.5 text-center text-[12px] text-[#fff4db] sm:py-2">
      {liveBoot() || liveEnabled ? <>
        <span>{liveBoot() ? "Akun VAKSARA · data Anda tersimpan aman di server" : "VAKSARA · platform pernikahan adat Bugis–Makassar"}</span>
      </> : <>
        <span className="sm:hidden">DEMO · data contoh, bukan transaksi nyata</span>
        <span className="hidden sm:inline">DEMO LOKAL · Profil, rating, ulasan, transaksi dan status verifikasi adalah contoh UI. Foto merupakan ilustrasi, bukan bukti identitas atau layanan.</span>
      </>}
    </div>
    <App />
  </StrictMode>
);

