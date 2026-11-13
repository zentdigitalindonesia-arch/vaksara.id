import { useCooperation } from "@/CooperationContext";
import { liveBoot, liveUserId } from "@/LiveContext";
import { friendly, rest } from "@/utils/supabase";
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import {
  practitioners,
  agreements as initialAgreements,
  checklistItems as initialChecklist,
  seedOpenRequests,
  type ChecklistItem,
  type OpenRequest,
  type OpenRequestResponse,
  type TaskStatus,
  disputes as initialDisputes,
  payments as initialPayments,
  type Agreement,
  type Dispute,
  rundown as seedRundown,
} from "./data";

export type Role = "public" | "couple" | "vendor" | "admin";
export type ToastTone = "success" | "error" | "info" | "warn";
export type ToastItem = { id: number; message: string; tone: ToastTone; title?: string };
export type Inquiry = {
  id: string;
  practitionerId: string;
  practitioner: string;
  message: string;
  date: string;
  packageName: string;
  status: "Draf" | "Terkirim" | "Dibalas" | "Ditolak" | "Dibatalkan" | "Selesai";
  createdAt: string;
};
export type PaymentRecord = (typeof initialPayments)[number];

type Store = {
  route: string;
  navigate: (to: string) => void;
  role: Role;
  toasts: ToastItem[];
  toast: (message: string, tone?: ToastTone, title?: string) => void;
  dismissToast: (id: number) => void;
  authMode: "masuk" | "daftar" | null;
  setAuthMode: (m: "masuk" | "daftar" | null) => void;
  saved: string[];
  toggleSaved: (id: string) => void;
  compare: string[];
  toggleCompare: (id: string) => void;
  inquiries: Inquiry[];
  sendInquiry: (i: Omit<Inquiry, "id" | "status" | "createdAt">) => string | null;
  agreements: Agreement[];
  addAgreement: (a: Agreement) => void;
  updateAgreement: (id: string, patch: Partial<Agreement>) => void;
  checklist: ChecklistItem[];
  toggleChecklist: (id: string) => void;
  setChecklistStatus: (id: string, status: TaskStatus) => void;
  addChecklist: (task: Omit<ChecklistItem, "id" | "done">) => void;
  openRequests: OpenRequest[];
  addOpenRequest: (r: Omit<OpenRequest, "id" | "createdAt" | "status" | "responses" | "mine" | "family"> & { family: string }) => void;
  respondOpenRequest: (id: string, r: Omit<OpenRequestResponse, "id" | "at">) => void;
  chooseOpenRequest: (id: string, vendor: string, caseId: string) => void;
  payments: PaymentRecord[];
  addPayment: (p: PaymentRecord) => void;
  disputes: Dispute[];
  addDispute: (d: Dispute) => void;
  updateDispute: (id: string, patch: Partial<Dispute>) => void;
  guests: { name: string; group: string; party: number; rsvp: string; table: string; invitation: string }[];
  addGuest: (g: { name: string; group: string; party: number; rsvp: string; table: string; invitation: string }) => void;
  expenses: { id: string; category: string; label: string; amount: number; date: string }[];
  recordExpense: (e: { category: string; label: string; amount: number; date: string }) => void;
  notificationsRead: boolean;
  markNotificationsRead: () => void;
  rundownItems: RundownItem[];
  setRundownItems: (items: RundownItem[] | ((prev: RundownItem[]) => RundownItem[])) => void;
};
export type RundownItem = (typeof seedRundown)[number];

const Ctx = createContext<Store | null>(null);

// Alat perencanaan (tamu, checklist, pengeluaran) disimpan di browser agar tidak hilang saat dimuat ulang.
function usePersisted<T>(key: string, initial: T, valid: (value: unknown) => boolean) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return initial;
      const parsed: unknown = JSON.parse(raw);
      return valid(parsed) ? (parsed as T) : initial;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* penyimpanan penuh atau tidak tersedia: data tetap di memori sesi ini */
    }
  }, [key, value]);
  return [value, setValue] as const;
}
const isArrayOf = (shape: Record<string, string>) => (value: unknown) =>
  Array.isArray(value) && value.every((item) => item && typeof item === "object" && Object.entries(shape).every(([k, t]) => typeof (item as Record<string, unknown>)[k] === t));

export function getInitialRoute() {
  const hash = window.location.hash.replace(/^#\/?/, "");
  return hash || "beranda";
}

export function roleForRoute(route: string): Role {
  if (route.startsWith("vendor")) return "vendor";
  if (route.startsWith("admin")) return "admin";
  if (
    route.startsWith("akun/") ||
    route.startsWith("planner") ||
    route.startsWith("trust") ||
    route.startsWith("perjanjian") ||
    route.startsWith("pengiriman") ||
    route.startsWith("bast") ||
    route.startsWith("sengketa") ||
    route.startsWith("bantuan")
  )
    return "couple";
  return "public";
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { flow, dispatch: dispatchFlow } = useCooperation();
  const [route, setRoute] = useState(getInitialRoute);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [authMode, setAuthMode] = useState<"masuk" | "daftar" | null>(null);
  // Akun nyata tidak memuat data contoh dalam memori.
  const [live] = useState(liveBoot);
  const [saved, setSaved] = useState<string[]>(live ? [] : ["lipa-sabbe"]);
  const [compare, setCompare] = useState<string[]>([]);
  const inquiries: Inquiry[] = flow.cases.map(c => ({ id: c.id, practitionerId: practitioners.find(p => p.name === c.vendor)?.id ?? "", practitioner: c.vendor, message: c.request, date: c.eventDate, packageName: c.offer?.scope ?? "Konsultasi", status: c.phase === "draft" ? "Draf" : c.phase === "inquiry" ? "Terkirim" : c.phase === "declined" ? "Ditolak" : c.phase === "cancelled" ? "Dibatalkan" : c.phase === "completed" ? "Selesai" : "Dibalas", createdAt: c.history[0]?.time ?? "" }));
  const [agreements, setAgreements] = useState<Agreement[]>(live ? [] : initialAgreements);
  const [checklist, setChecklist] = usePersisted("vaksara-planner-checklist-v1", live ? [] : initialChecklist, isArrayOf({ id: "string", done: "boolean" }));
  const [payments, setPayments] = useState<PaymentRecord[]>(live ? [] : initialPayments);
  const [disputes, setDisputes] = useState<Dispute[]>(live ? [] : initialDisputes);
  const [guests, setGuests] = usePersisted<{ name: string; group: string; party: number; rsvp: string; table: string; invitation: string }[]>("vaksara-planner-guests-v1", live ? [] : [
    { name: "Keluarga Andi Baso", group: "Keluarga", party: 6, rsvp: "Hadir", table: "A1", invitation: "Terkirim" },
    { name: "Rahmawati Husain", group: "Keluarga", party: 2, rsvp: "Hadir", table: "A2", invitation: "Terkirim" },
    { name: "Keluarga Saleh", group: "Keluarga", party: 5, rsvp: "Menunggu", table: "—", invitation: "Terkirim" },
    { name: "Dewi & Rahmat", group: "Sahabat", party: 2, rsvp: "Hadir", table: "B1", invitation: "Terkirim" },
    { name: "Tim Maesa Studio", group: "Rekan Kerja", party: 3, rsvp: "Hadir", table: "B2", invitation: "Dibuka" },
    { name: "Fadli & keluarga", group: "Rekan Kerja", party: 4, rsvp: "Tidak hadir", table: "—", invitation: "Terkirim" },
    { name: "Nanda Ayu", group: "Kampus", party: 1, rsvp: "Menunggu", table: "—", invitation: "Belum dikirim" },
    { name: "Keluarga Ibu Suharti", group: "Tetangga", party: 4, rsvp: "Hadir", table: "C1", invitation: "Terkirim" },
  ], isArrayOf({ name: "string", group: "string", party: "number", rsvp: "string" }));
  // Rundown milik akun: kosong untuk akun nyata baru, contoh untuk mode demo.
  const [rundownItems, setRundownItems] = usePersisted<RundownItem[]>("vaksara-planner-rundown-v1", live ? [] : seedRundown, isArrayOf({ id: "string", title: "string", date: "string" }));
  const [expenses, setExpenses] = usePersisted<{ id: string; category: string; label: string; amount: number; date: string }[]>("vaksara-planner-expenses-v1", live ? [] : [{ id: "demo-exp-1", category: "Busana", label: "Contoh pencatatan konsultasi busana (demo)", amount: 500000, date: "2026-10-25" }, { id: "demo-exp-2", category: "Dokumentasi", label: "Contoh biaya persiapan dokumentasi (demo)", amount: 750000, date: "2026-10-25" }], isArrayOf({ id: "string", category: "string", amount: "number" }));
  const [notificationsRead, setNotificationsRead] = useState(false);
  const toastId = useRef(0);

  const navigate = useCallback((to: string) => {
    const clean = to.replace(/^#\/?/, "");
    window.location.hash = `/${clean}`;
    setRoute(clean);
    window.scrollTo({ top: 0, behavior: "auto" });
  }, []);

  useEffect(() => {
    const onHash = () => {
      setRoute(getInitialRoute());
      window.scrollTo({ top: 0, behavior: "auto" });
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const toast = useCallback((message: string, tone: ToastTone = "success", title?: string) => {
    const id = ++toastId.current;
    setToasts((t) => [...t.slice(-2), { id, message, tone, title }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4800);
  }, []);

  const toastRef = useRef(toast);
  toastRef.current = toast;
  const dismissToast = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const toggleSaved = useCallback((id: string) => {
    setSaved((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }, []);

  const toggleCompare = useCallback(
    (id: string) => {
      setCompare((prev) => {
        if (prev.includes(id)) return prev.filter((x) => x !== id);
        if (prev.length >= 3) {
          toast("Bandingkan maksimal 3 pelaku budaya sekaligus.", "warn", "Batas perbandingan");
          return prev;
        }
        return [...prev, id];
      });
    },
    [toast]
  );

  const sendInquiry = useCallback(
    (i: Omit<Inquiry, "id" | "status" | "createdAt">) => {
      const next = dispatchFlow({ type: "lead", actor: "couple", data: { vendor: i.practitioner, request: i.message, date: i.date } });
      return next?.cases[0]?.id ?? null;

    },
    [dispatchFlow]
  );

  const addAgreement = useCallback((a: Agreement) => setAgreements((prev) => [a, ...prev]), []);
  const updateAgreement = useCallback(
    (id: string, patch: Partial<Agreement>) =>
      setAgreements((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a))),
    []
  );
  const toggleChecklist = useCallback(
    (id: string) => setChecklist((prev) => prev.map((c) => (c.id === id ? { ...c, done: !c.done, status: c.done ? "todo" : "done" } : c))),
    []
  );
  const setChecklistStatus = useCallback(
    (id: string, status: TaskStatus) => setChecklist((prev) => prev.map((c) => (c.id === id ? { ...c, status, done: status === "done" } : c))),
    []
  );
  const addChecklist = useCallback((task: Omit<ChecklistItem, "id" | "done">) => setChecklist((prev) => [...prev, { ...task, id: `t-${Date.now().toString(36)}`, done: task.status === "done" }]), []);
  const [localRequests, setLocalRequests] = usePersisted<OpenRequest[]>("vaksara-open-requests-v1", seedOpenRequests, isArrayOf({ id: "string", title: "string", status: "string" }));
  const [liveRequests, setLiveRequests] = useState<OpenRequest[]>([]);
  const openRequests = live ? liveRequests : localRequests;
  type ReqRow = { id: string; owner_id: string; family: string; category: string; title: string; event_date: string; location: string; budget: string; detail: string; status: "open" | "closed"; chosen: string | null; case_id: string | null; created_at: string; open_request_responses?: { id: string; vendor_name: string; note: string; price: number; created_at: string }[] };
  const loadRequests = useCallback(async () => {
    if (!live) return;
    try {
      const rows = await rest<ReqRow[]>("open_requests?select=*,open_request_responses(id,vendor_name,note,price,created_at)&order=created_at.desc");
      const uid = liveUserId();
      setLiveRequests(rows.map((r) => ({ id: r.id, family: r.family, mine: r.owner_id === uid, category: r.category, title: r.title, date: r.event_date, location: r.location, budget: r.budget, detail: r.detail, createdAt: r.created_at.slice(0, 10), status: r.status, chosen: r.chosen ?? undefined, caseId: r.case_id ?? undefined, responses: (r.open_request_responses ?? []).map((x) => ({ id: x.id, vendor: x.vendor_name, note: x.note, price: Number(x.price), at: x.created_at.slice(0, 10) })) })));
    } catch { /* tampilkan data terakhir; dicoba lagi pada siklus berikutnya */ }
  }, [live]);
  useEffect(() => {
    if (!live) return;
    loadRequests();
    const t = window.setInterval(() => { if (document.visibilityState === "visible") loadRequests(); }, 30000);
    return () => window.clearInterval(t);
  }, [live, loadRequests]);
  const liveWrite = useCallback((work: Promise<unknown>, _done: string) => { work.then(() => { loadRequests(); }).catch((e) => { loadRequests(); toastRef.current(friendly(e), "error", "Belum tersimpan"); }); }, [loadRequests]);
  const addOpenRequest = useCallback((r: Omit<OpenRequest, "id" | "createdAt" | "status" | "responses" | "mine" | "family"> & { family: string }) => {
    const item: OpenRequest = { ...r, id: `or-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`, mine: true, createdAt: new Date().toISOString().slice(0, 10), status: "open", responses: [] };
    if (!live) { setLocalRequests((prev) => [item, ...prev]); return; }
    setLiveRequests((prev) => [item, ...prev]);
    liveWrite(rest("open_requests", { method: "POST", body: { id: item.id, family: r.family, category: r.category, title: r.title, event_date: r.date, location: r.location, budget: r.budget, detail: r.detail }, prefer: "return=minimal" }), "Permintaan terbuka tersimpan dan dapat dilihat pelaku budaya terverifikasi.");
  }, [live, setLocalRequests, liveWrite]);
  const respondOpenRequest = useCallback((id: string, r: Omit<OpenRequestResponse, "id" | "at">) => {
    const response = { ...r, id: `rs-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`, at: new Date().toISOString().slice(0, 10) };
    const apply = (prev: OpenRequest[]) => prev.map((o) => (o.id === id ? { ...o, responses: [...o.responses.filter((x) => x.vendor !== r.vendor), response] } : o));
    if (!live) { setLocalRequests(apply); return; }
    setLiveRequests(apply);
    liveWrite(rest("open_request_responses?on_conflict=request_id,vendor_id", { method: "POST", body: { id: response.id, request_id: id, vendor_name: r.vendor, note: r.note, price: r.price }, prefer: "resolution=merge-duplicates,return=minimal" }), "Minat Anda terkirim ke keluarga.");
  }, [live, setLocalRequests, liveWrite]);
  const chooseOpenRequest = useCallback((id: string, vendor: string, caseId: string) => {
    const apply = (prev: OpenRequest[]) => prev.map((o) => (o.id === id ? { ...o, status: "closed" as const, chosen: vendor, caseId } : o));
    if (!live) { setLocalRequests(apply); return; }
    setLiveRequests(apply);
    liveWrite(rest(`open_requests?id=eq.${encodeURIComponent(id)}`, { method: "PATCH", body: { status: "closed", chosen: vendor, case_id: caseId }, prefer: "return=minimal" }), "Permintaan ditutup; kerja sama dengan pelaku terpilih dibuat.");
  }, [live, setLocalRequests, liveWrite]);
  const addPayment = useCallback((p: PaymentRecord) => setPayments((prev) => [p, ...prev]), []);
  const addDispute = useCallback((d: Dispute) => setDisputes((prev) => [d, ...prev]), []);
  const updateDispute = useCallback(
    (id: string, patch: Partial<Dispute>) => setDisputes((prev) => prev.map((d) => (d.id === id ? { ...d, ...patch } : d))),
    []
  );
  const addGuest = useCallback(
    (g: { name: string; group: string; party: number; rsvp: string; table: string; invitation: string }) =>
      setGuests((prev) => [g, ...prev]),
    []
  );

  const recordExpense = useCallback((e: { category: string; label: string; amount: number; date: string }) => {
    setExpenses((prev) => [{ ...e, id: `exp-${Date.now()}` }, ...prev]);
  }, []);


  const value: Store = {
    route,
    navigate,
    role: roleForRoute(route),
    toasts,
    toast,
    dismissToast,
    authMode,
    setAuthMode,
    saved,
    toggleSaved,
    compare,
    toggleCompare,
    inquiries,
    sendInquiry,
    agreements,
    addAgreement,
    updateAgreement,
    checklist,
    toggleChecklist,
    setChecklistStatus,
    addChecklist,
    openRequests,
    addOpenRequest,
    respondOpenRequest,
    chooseOpenRequest,
    payments,
    addPayment,
    disputes,
    addDispute,
    updateDispute,
    guests,
    addGuest,
    expenses,
    recordExpense,
    notificationsRead,
    markNotificationsRead: () => setNotificationsRead(true),
    rundownItems,
    setRundownItems,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

export function useQueryParam(name: string) {
  const { route } = useApp();
  const idx = route.indexOf("?");
  const query = idx >= 0 ? route.slice(idx + 1) : "";
  return new URLSearchParams(query).get(name);
}

