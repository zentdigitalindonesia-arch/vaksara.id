import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { initialFlow, transitionFlow, validFlow, type Flow, type FlowAction } from "@/utils/cooperation";
import { demoCooperations } from "@/utils/demo-cooperations";
import { practitioners } from "@/data";
const KEY = "vaksara-connected-demo-v1";
// Profil contoh yang identitasnya ditandai lolos di direktori demo dapat menerima permintaan.
const catalog = practitioners.filter(p => p.verifiedIdentity === "verified").map(p => p.name);
const withCatalog = (flow: Flow): Flow => ({ ...flow, catalog });
const examples = () => withCatalog(demoCooperations(practitioners[0].name));
const load = () => { try { const data = localStorage.getItem(KEY); if (data === null) return examples(); const parsed: unknown = JSON.parse(data); return validFlow(parsed) ? withCatalog(parsed) : withCatalog(initialFlow()); } catch { return withCatalog(initialFlow()); } };
type Model = { flow: Flow; error: string };
type API = Model & { storageError: boolean; dispatch: (action: Omit<FlowAction, "id" | "time"> & { id?: string }) => Flow | null; reset: () => void; loadExamples: () => void };
const Context = createContext<API | null>(null);
export function CooperationProvider({ children }: { children: ReactNode }) {
  const [model, setModel] = useState<Model>(() => ({ flow: load(), error: "" }));
  const latest = useRef(model);
  const [storageError, setStorageError] = useState(false);
  const commit = (next: Model) => { latest.current = next; setModel(next); };
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(model.flow)); setStorageError(false); } catch { setStorageError(true); } }, [model.flow]);
  const dispatch: API["dispatch"] = action => {
    const event: FlowAction = { ...action, id: action.id ?? crypto.randomUUID(), time: new Date().toISOString() };
    try { const flow = transitionFlow(latest.current.flow, event); commit({ flow, error: "" }); return flow; }
    catch (e) { commit({ ...latest.current, error: e instanceof Error ? e.message : "Tindakan ditolak." }); return null; }
  };
  const loadExamples = () => {
    const current = latest.current.flow, seed = demoCooperations(current.accounts.vendor?.name ?? practitioners[0].name);
    commit({ flow: { ...current, catalog, accounts: { couple: current.accounts.couple ?? seed.accounts.couple, vendor: current.accounts.vendor ?? seed.accounts.vendor }, vendorReview: current.accounts.vendor ? current.vendorReview : seed.vendorReview, cases: [...current.cases, ...seed.cases.filter(c => !current.cases.some(old => old.id === c.id))] }, error: "" });
  };
  return <Context.Provider value={{ ...model, storageError, dispatch, loadExamples, reset: () => commit({ flow: withCatalog(initialFlow()), error: "" }) }}>{children}</Context.Provider>;
}
export function useCooperation() { const value = useContext(Context); if (!value) throw new Error("CooperationProvider missing"); return value; }
