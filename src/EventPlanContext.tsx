import { liveBoot } from "@/LiveContext";
import { createContext, useContext, useState, type ReactNode } from "react";

export const EVENT_KEY = "vaksara-event-plan-v1";
export const needs = [
  { id: "prosesi", label: "Pemandu prosesi adat", query: "prosesi", route: "jelajahi" },
  { id: "busana", label: "Busana adat", query: "busana", route: "jelajahi" },
  { id: "musik", label: "Musik tradisional", query: "musik", route: "jelajahi" },
  { id: "katering", label: "Katering", query: "katering", route: "layanan" },
  { id: "dokumentasi", label: "Dokumentasi", query: "dokumentasi", route: "layanan" },
] as const;
export type EventPlan = { schema: 1; name: string; date: string; location: string; budget: string; needs: string[]; step: number; complete: boolean; demo?: boolean };
export const blankPlan = (): EventPlan => ({ schema: 1, name: "", date: "", location: "", budget: "", needs: [], step: 0, complete: false });
// Kunjungan pertama langsung berisi acara contoh agar semua bagian demo terisi dan mudah dipahami.
export const demoPlan = (): EventPlan => ({ schema: 1, name: "Pernikahan Nurul & Fikri", date: "2027-06-12", location: "Makassar", budget: "127500000", needs: ["prosesi", "busana", "musik", "katering", "dokumentasi"], step: 2, complete: true, demo: true });
export function planError(plan: EventPlan): string {
  if (!plan.name.trim() || plan.name.length > 120) return "Isi nama pasangan atau acara, maksimal 120 karakter.";
  if (plan.location.length > 150) return "Lokasi maksimal 150 karakter.";
  if (plan.date && (!/^\d{4}-\d{2}-\d{2}$/.test(plan.date) || !Number.isFinite(Date.parse(plan.date)) || new Date(plan.date).toISOString().slice(0, 10) !== plan.date)) return "Pilih tanggal acara yang valid atau kosongkan dahulu.";
  if (plan.budget && (!/^\d+$/.test(plan.budget) || !Number.isSafeInteger(Number(plan.budget)) || Number(plan.budget) <= 0 || Number(plan.budget) > 1_000_000_000_000)) return "Isi perkiraan anggaran dalam Rupiah bulat, lebih dari nol dan maksimal Rp1 triliun, atau kosongkan dahulu.";
  return "";
}
function load(): { plan: EventPlan; warning: string } {
  try {
    const raw = localStorage.getItem(EVENT_KEY);
    if (!raw) return { plan: liveBoot() ? blankPlan() : demoPlan(), warning: "" };
    const p = JSON.parse(raw);
    if (p?.schema !== 1 || typeof p.name !== "string" || typeof p.date !== "string" || typeof p.location !== "string" || typeof p.budget !== "string" || !Array.isArray(p.needs) || !p.needs.every((id: unknown) => needs.some(n => n.id === id)) || ![0, 1, 2].includes(p.step) || typeof p.complete !== "boolean" || ((p.complete || p.step > 0) && planError(p))) throw new Error();
    return { plan: p, warning: "" };
  } catch { return { plan: blankPlan(), warning: "Rencana tersimpan tidak dapat dibaca. Data lama belum diubah; simpan ulang hanya jika ingin menggantinya." }; }
}
const Context = createContext<{ plan: EventPlan; warning: string; save: (plan: EventPlan) => boolean } | null>(null);
export function EventPlanProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(load);
  const save = (plan: EventPlan) => {
    try {
      localStorage.setItem(EVENT_KEY, JSON.stringify(plan));
      setState({ plan, warning: "" });
      return true;
    } catch {
      setState(current => ({ ...current, warning: "Rencana belum tersimpan. Penyimpanan browser tidak tersedia atau penuh. Coba lagi sebelum melanjutkan." }));
      return false;
    }
  };
  return <Context.Provider value={{ ...state, save }}>{children}</Context.Provider>;
}
export function useEventPlan() {
  const value = useContext(Context);
  if (!value) throw new Error("EventPlanProvider missing");
  return value;
}
