import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <div className="relative z-[1] bg-ink px-4 py-1.5 text-center text-[11px] text-[#fff4db] sm:py-2">
      <span className="sm:hidden">DEMO · data contoh, bukan transaksi nyata</span>
      <span className="hidden sm:inline">DEMO LOKAL · Profil, rating, ulasan, transaksi dan status verifikasi adalah contoh UI. Foto merupakan ilustrasi, bukan bukti identitas atau layanan.</span>
    </div>
    <App />
  </StrictMode>
);

