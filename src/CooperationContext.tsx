import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { initialFlow, isAmanah, transitionFlow, validFlow, type Cooperation, type Flow, type FlowAction } from "@/utils/cooperation";
import { demoCooperations } from "@/utils/demo-cooperations";
import { practitioners } from "@/data";
import { liveBoot, liveUserId } from "@/LiveContext";
import { callFunction, friendly, FunctionMissingError, q, rest } from "@/utils/supabase";
import { T } from "@/utils/live-text";
const KEY = "vaksara-connected-demo-v1";
// Profil contoh yang identitasnya ditandai lolos di direktori demo dapat menerima permintaan.
const catalog = practitioners.filter(p => p.verifiedIdentity === "verified").map(p => p.name);
const withCatalog = (flow: Flow): Flow => ({ ...flow, catalog });
const examples = () => withCatalog(demoCooperations(practitioners[0].name));
const load = () => { try { const data = localStorage.getItem(KEY); if (data === null) return examples(); const parsed: unknown = JSON.parse(data); return validFlow(parsed) ? withCatalog(parsed) : withCatalog(initialFlow()); } catch { return withCatalog(initialFlow()); } };
type Model = { flow: Flow; error: string };
type API = Model & { live: boolean; loading: boolean; storageError: boolean; dispatch: (action: Omit<FlowAction, "id" | "time"> & { id?: string }) => Flow | null; reset: () => void; loadExamples: () => void; reload: () => Promise<void> };
const Context = createContext<API | null>(null);

type Row = { id: string; couple_id: string; vendor_id: string; couple_name: string; vendor_name: string; data: Cooperation; updated_at: string };
type Me = { role: "couple" | "vendor"; full_name: string; phone: string; is_admin: boolean };
type MyListing = { id: string; name: string; review_status: string; identity_ok: boolean; culture_ok: boolean; consent_ok: boolean };

export function CooperationProvider({ children }: { children: ReactNode }) {
  const [live] = useState(liveBoot);
  const [model, setModel] = useState<Model>(() => ({ flow: live ? initialFlow() : load(), error: "" }));
  const [loading, setLoading] = useState(live);
  const loadingRef = useRef(live);
  const latest = useRef(model);
  const [storageError, setStorageError] = useState(false);
  // Mode akun nyata: id vendor per nama, cap waktu baris untuk mencegah tumpang tindih perubahan dua pihak.
  const vendorIds = useRef(new Map<string, string>());
  const stamps = useRef(new Map<string, string>());
  const coupleNames = useRef(new Map<string, string>());
  const me = useRef<{ profile: Me | null; listing: MyListing | null }>({ profile: null, listing: null });
  const queue = useRef<Promise<void>>(Promise.resolve());
  const busy = useRef(0);
  const commit = (next: Model) => { latest.current = next; setModel(next); };
  useEffect(() => { if (live) return; try { localStorage.setItem(KEY, JSON.stringify(model.flow)); setStorageError(false); } catch { setStorageError(true); } }, [model.flow, live]);

  const loadRemote = async (keepError = false) => {
    const uid = liveUserId(); if (!uid) return;
    try {
      const [profile] = await rest<Me[]>(`profiles?select=role,full_name,phone,is_admin&id=eq.${q(uid)}`);
      const listing = profile?.role === "vendor" ? (await rest<MyListing[]>(`vendor_listings?select=id,name,review_status,identity_ok,culture_ok,consent_ok&id=eq.${q(uid)}`))[0] ?? null : null;
      const listed = await rest<{ id: string; name: string }[]>("vendor_directory?select=id,name&order=name");
      const rows = await rest<Row[]>("cooperations?select=id,couple_id,vendor_id,couple_name,vendor_name,data,updated_at&order=updated_at.desc");
      me.current = { profile: profile ?? null, listing };
      vendorIds.current = new Map(listed.map(l => [l.name, l.id]));
      stamps.current = new Map(rows.map(r => [r.id, r.updated_at]));
      coupleNames.current = new Map(rows.map(r => [r.id, r.couple_name]));
      // Profil yang diubah setelah disetujui kembali "pending" untuk ditinjau ulang. Kerja sama yang sudah berjalan
      // tetap dapat dilanjutkan bila pemeriksaan terakhir lengkap; profil yang ditolak tidak dapat bertindak.
      const checked = Boolean(listing?.identity_ok && listing.culture_ok && listing.consent_ok);
      const approved = listing?.review_status === "approved" || (listing?.review_status === "pending" && checked);
      const flow: Flow = {
        schema: 1,
        accounts: {
          couple: profile?.role === "couple" ? { name: profile.full_name || "Keluarga", email: "", phone: profile.phone, demoOnly: true } : null,
          vendor: listing ? { name: listing.name, email: "", phone: profile?.phone ?? "", demoOnly: true } : null,
        },
        vendorReview: { identity: approved && listing!.identity_ok, culture: approved && listing!.culture_ok, consent: approved && listing!.consent_ok },
        cases: rows.map(r => ({ ...r.data, id: r.id, vendor: listing && r.vendor_id === uid ? listing.name : r.vendor_name })),
        catalog: listed.map(l => l.name),
      };
      commit({ flow, error: keepError ? latest.current.error : "" });
    } catch (e) { commit({ ...latest.current, error: friendly(e) }); }
    finally { loadingRef.current = false; setLoading(false); }
  };

  useEffect(() => {
    if (!live) return;
    loadRemote();
    const poll = () => { if (busy.current === 0 && document.visibilityState === "visible") loadRemote(true); };
    const timer = window.setInterval(poll, 20000);
    window.addEventListener("focus", poll);
    return () => { window.clearInterval(timer); window.removeEventListener("focus", poll); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live]);

  // Akun nyata: setiap langkah dikirim ke fungsi server "cooperation-action", yang menentukan pihak dari akun yang masuk
  // dan memeriksa aturan alur. Hasil dari server menggantikan perhitungan di browser.
  const persist = (event: FlowAction, flow: Flow) => {
    busy.current++;
    queue.current = queue.current.then(async () => {
      let vendorId: string | undefined;
      if (event.type === "lead") {
        const c = flow.cases.find(x => x.id === event.id); if (!c) return;
        vendorId = vendorIds.current.get(c.vendor);
        if (!vendorId) throw new Error("Pelaku ini belum terdaftar dan ditinjau di VAKSARA sehingga belum dapat menerima permintaan.");
      } else if (!event.caseId) return;
      const body = event.type === "lead"
        ? { vendorId, action: { type: event.type, id: event.id, data: event.data } }
        : { caseId: event.caseId, actor: event.actor, action: { type: event.type, id: event.id, data: event.data } };
      let row: Row;
      try { row = (await callFunction<{ row: Row }>("cooperation-action", body)).row; }
      catch (e) { if (e instanceof FunctionMissingError) { await legacyPersist(event, flow); return; } throw e; }
      stamps.current.set(row.id, row.updated_at);
      coupleNames.current.set(row.id, row.couple_name);
      const vendorName = me.current.listing && row.vendor_id === liveUserId() ? me.current.listing.name : row.vendor_name;
      const cur = latest.current;
      commit({ ...cur, flow: { ...cur.flow, cases: cur.flow.cases.map(c => c.id === row.id ? { ...row.data, id: row.id, vendor: vendorName } : c) } });
    }).catch(async e => { await loadRemote(); commit({ ...latest.current, error: friendly(e) }); }).finally(() => { busy.current--; });
  };
  // Jalur sementara selama fungsi server belum dipasang di Supabase. Setelah SQL terbaru dijalankan, jalur ini ditolak
  // database (hak tulis langsung dicabut), sehingga hanya fungsi server yang dapat mengubah kerja sama.
  const legacyPersist = async (event: FlowAction, flow: Flow) => {
    const uid = liveUserId();
    if (event.type === "lead") {
      const c = flow.cases.find(x => x.id === event.id); if (!c) return;
      const vendorId = vendorIds.current.get(c.vendor);
      if (!vendorId) throw new Error("Pelaku ini belum terdaftar dan ditinjau di VAKSARA sehingga belum dapat menerima permintaan.");
      const [row] = await rest<Row[]>("cooperations", { method: "POST", body: { id: c.id, couple_id: uid, vendor_id: vendorId, couple_name: me.current.profile?.full_name ?? "", vendor_name: c.vendor, phase: c.phase, data: c }, prefer: "return=representation" });
      if (row) stamps.current.set(c.id, row.updated_at);
      return;
    }
    if (!event.caseId) return;
    const c = flow.cases.find(x => x.id === event.caseId); if (!c) return;
    const stamp = stamps.current.get(c.id) ?? "";
    const rows = await rest<Row[]>(`cooperations?id=eq.${q(c.id)}&updated_at=eq.${q(stamp)}`, { method: "PATCH", body: { phase: c.phase, data: c }, prefer: "return=representation" });
    if (!rows.length) { await loadRemote(); commit({ ...latest.current, error: "Kerja sama ini baru saja diperbarui pihak lain. Data terbaru sudah dimuat; silakan periksa lalu ulangi langkah Anda." }); return; }
    stamps.current.set(c.id, rows[0].updated_at);
  };

  const dispatch: API["dispatch"] = action => {
    const event: FlowAction = { ...action, id: action.id ?? crypto.randomUUID(), time: new Date().toISOString() };
    if (live && loadingRef.current) { commit({ ...latest.current, error: "Data kerja sama masih dimuat dari server. Tunggu sebentar lalu ulangi." }); return null; }
    if (live && (event.type === "register" || event.type === "review_vendor")) { commit({ ...latest.current, error: "Di akun VAKSARA, pendaftaran dan peninjauan dilakukan melalui profil akun dan peninjau resmi." }); return null; }
    // Akun nyata: Dana Amanah dibayar lewat tagihan Xendit (pay_invoice), bukan catatan setoran.
    if (live && event.type === "payment" && latest.current.flow.cases.some(c => c.id === event.caseId && isAmanah(c))) { commit({ ...latest.current, error: "Perjanjian ini dibayar lewat tagihan Dana Amanah (Xendit). Gunakan tombol Bayar di bagian Pembayaran." }); return null; }
    try {
      const current = latest.current.flow;
      // Akun nyata: pihak lain berada di perangkatnya sendiri. Untuk validasi, isi identitas pihak lain per kerja sama
      // dari data server (pelaku sudah ditinjau bila namanya ada di katalog), lalu kembalikan setelah transisi.
      let base = current;
      if (live && event.caseId) {
        const item = current.cases.find(c => c.id === event.caseId);
        if (item) {
          // Kerja sama yang sudah ada hanya dapat dibuat untuk pelaku yang disetujui (aturan coop_insert), jadi tahap
          // lanjutan tetap berjalan selama pelaku ditinjau ulang. Mengirim permintaan baru tetap mensyaratkan pelaku tampil di katalog.
          const approved = event.type === "submit" ? (current.catalog ?? []).includes(item.vendor) : true;
          base = {
            ...current,
            accounts: { couple: current.accounts.couple ?? { name: coupleNames.current.get(item.id) || "Keluarga", email: "", phone: "", demoOnly: true }, vendor: current.accounts.vendor ?? (approved ? { name: item.vendor, email: "", phone: "", demoOnly: true } : null) },
            vendorReview: current.accounts.vendor ? current.vendorReview : { identity: approved, culture: approved, consent: approved },
          };
        }
      }
      const next = transitionFlow(base, event);
      const flow = base === current ? next : { ...next, accounts: current.accounts, vendorReview: current.vendorReview };
      commit({ flow, error: "" }); if (live) persist(event, flow); return flow;
    }
    catch (e) { commit({ ...latest.current, error: e instanceof Error ? T(e.message) : "Tindakan ditolak." }); return null; }
  };
  const loadExamples = () => {
    if (live) return;
    const current = latest.current.flow, seed = demoCooperations(current.accounts.vendor?.name ?? practitioners[0].name);
    commit({ flow: { ...current, catalog, accounts: { couple: current.accounts.couple ?? seed.accounts.couple, vendor: current.accounts.vendor ?? seed.accounts.vendor }, vendorReview: current.accounts.vendor ? current.vendorReview : seed.vendorReview, cases: [...current.cases, ...seed.cases.filter(c => !current.cases.some(old => old.id === c.id))] }, error: "" });
  };
  return <Context.Provider value={{ ...model, live, loading, storageError, dispatch, loadExamples, reload: () => (live ? loadRemote() : Promise.resolve()), reset: () => { if (!live) commit({ flow: withCatalog(initialFlow()), error: "" }); } }}>{children}</Context.Provider>;
}
export function useCooperation() { const value = useContext(Context); if (!value) throw new Error("CooperationProvider missing"); return value; }
