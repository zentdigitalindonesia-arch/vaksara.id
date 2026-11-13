import { useCooperation } from "@/CooperationContext";
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
};

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
  const [saved, setSaved] = useState<string[]>(["lipa-sabbe"]);
  const [compare, setCompare] = useState<string[]>([]);
  const inquiries: Inquiry[] = flow.cases.map(c => ({ id: c.id, practitionerId: practitioners.find(p => p.name === c.vendor)?.id ?? "", practitioner: c.vendor, message: c.request, date: c.eventDate, packageName: c.offer?.scope ?? "Konsultasi", status: c.phase === "draft" ? "Draf" : c.phase === "inquiry" ? "Terkirim" : c.phase === "declined" ? "Ditolak" : c.phase === "cancelled" ? "Dibatalkan" : c.phase === "completed" ? "Selesai" : "Dibalas", createdAt: c.history[0]?.time ?? "" }));
  const [agreements, setAgreements] = useState<Agreement[]>(initialAgreements);
  const [checklist, setChecklist] = usePersisted("vaksara-planner-checklist-v1", initialChecklist, isArrayOf({ id: "string", done: "boolean" }));
  const [payments, setPayments] = useState<PaymentRecord[]>(initialPayments);
  const [disputes, setDisputes] = useState<Dispute[]>(initialDisputes);
  const [guests, setGuests] = usePersisted<{ name: string; group: string; party: number; rsvp: string; table: string; invitation: string }[]>("vaksara-planner-guests-v1", [
    { name: "Keluarga Andi Baso", group: "Keluarga", party: 6, rsvp: "Hadir", table: "A1", invitation: "Terkirim" },
    { name: "Rahmawati Husain", group: "Keluarga", party: 2, rsvp: "Hadir", table: "A2", invitation: "Terkirim" },
    { name: "Keluarga Saleh", group: "Keluarga", party: 5, rsvp: "Menunggu", table: "—", invitation: "Terkirim" },
    { name: "Dewi & Rahmat", group: "Sahabat", party: 2, rsvp: "Hadir", table: "B1", invitation: "Terkirim" },
    { name: "Tim Maesa Studio", group: "Rekan Kerja", party: 3, rsvp: "Hadir", table: "B2", invitation: "Dibuka" },
    { name: "Fadli & keluarga", group: "Rekan Kerja", party: 4, rsvp: "Tidak hadir", table: "—", invitation: "Terkirim" },
    { name: "Nanda Ayu", group: "Kampus", party: 1, rsvp: "Menunggu", table: "—", invitation: "Belum dikirim" },
    { name: "Keluarga Ibu Suharti", group: "Tetangga", party: 4, rsvp: "Hadir", table: "C1", invitation: "Terkirim" },
  ], isArrayOf({ name: "string", group: "string", party: "number", rsvp: "string" }));
  const [expenses, setExpenses] = usePersisted<{ id: string; category: string; label: string; amount: number; date: string }[]>("vaksara-planner-expenses-v1", [{ id: "demo-exp-1", category: "Busana", label: "Contoh pencatatan konsultasi busana (demo)", amount: 500000, date: "2026-10-25" }, { id: "demo-exp-2", category: "Dokumentasi", label: "Contoh biaya persiapan dokumentasi (demo)", amount: 750000, date: "2026-10-25" }], isArrayOf({ id: "string", category: "string", amount: "number" }));
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
  const [openRequests, setOpenRequests] = usePersisted<OpenRequest[]>("vaksara-open-requests-v1", seedOpenRequests, isArrayOf({ id: "string", title: "string", status: "string" }));
  const addOpenRequest = useCallback((r: Omit<OpenRequest, "id" | "createdAt" | "status" | "responses" | "mine" | "family"> & { family: string }) => setOpenRequests((prev) => [{ ...r, id: `or-${Date.now().toString(36)}`, mine: true, createdAt: new Date().toISOString().slice(0, 10), status: "open", responses: [] }, ...prev]), []);
  const respondOpenRequest = useCallback((id: string, r: Omit<OpenRequestResponse, "id" | "at">) => setOpenRequests((prev) => prev.map((o) => (o.id === id ? { ...o, responses: [...o.responses.filter((x) => x.vendor !== r.vendor), { ...r, id: `rs-${Date.now().toString(36)}`, at: new Date().toISOString().slice(0, 10) }] } : o))), []);
  const chooseOpenRequest = useCallback((id: string, vendor: string, caseId: string) => setOpenRequests((prev) => prev.map((o) => (o.id === id ? { ...o, status: "closed", chosen: vendor, caseId } : o))), []);
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

