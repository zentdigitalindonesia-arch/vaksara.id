import { budgetItems, payments as seedPayments, wedding } from "@/data";
import { liveBoot } from "@/LiveContext";
import { useApp } from "@/store";
import { cn } from "@/utils/cn";
import { CalendarCheck, CalendarHeart, CreditCard, LayoutDashboard, ListOrdered, Users, Wallet } from "lucide-react";

export const plannerNav = [
  { label: "Rencana Acara", route: "planner/planner", icon: <CalendarHeart className="h-3.5 w-3.5" /> },
  { label: "Anggaran", route: "planner/anggaran", icon: <Wallet className="h-3.5 w-3.5" /> },
  { label: "Jadwal", route: "planner/jadwal", icon: <CalendarCheck className="h-3.5 w-3.5" /> },
  { label: "Pembayaran", route: "planner/pembayaran", icon: <CreditCard className="h-3.5 w-3.5" /> },
  { label: "Tamu", route: "planner/tamu", icon: <Users className="h-3.5 w-3.5" /> },
  { label: "Rundown", route: "planner/rundown", icon: <ListOrdered className="h-3.5 w-3.5" /> },
];

export function PlannerQuickNav({ active }: { active: string }) {
  const { navigate, route } = useApp();
  return (
    <div className="scrollbar-thin mb-4 flex gap-1 overflow-x-auto rounded-xl border border-line bg-white p-1">
      {plannerNav.map((item) => {
        const isActive = active === item.route || route.split("?")[0] === item.route;
        return (
          <button
            key={item.route}
            onClick={() => navigate(item.route)}
            className={cn("flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[14px] font-semibold transition-colors", isActive ? "bg-ink text-cream" : "text-muted hover:bg-cream hover:text-ink")}
          >
            {item.icon}
            {item.label}
          </button>
        );
      })}
      <button onClick={() => navigate("planner")} className={cn("ml-auto flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[14px] font-semibold", active === "planner" ? "bg-sand-light text-[#7A5A2E]" : "text-muted hover:bg-cream")}>
        <LayoutDashboard className="h-3.5 w-3.5" /> Ringkasan
      </button>
    </div>
  );
}

export function daysToWedding() {
  const target = new Date(wedding.date + "T00:00:00");
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.max(0, Math.ceil((target.getTime() - now.getTime()) / 86400000));
}

export function computeBudget(extra: { category: string; amount: number }[], planBudget?: string) {
  // Akun nyata: tanpa angka contoh; total anggaran dari rencana acara, dibayar dari pengeluaran yang dicatat.
  const live = liveBoot();
  const base = live ? budgetItems.map((b) => ({ ...b, planned: 0, committed: 0, paid: 0 })) : budgetItems;
  const rows = base.map((b) => {
    const added = extra.filter((e) => e.category === b.category).reduce((sum, e) => sum + e.amount, 0);
    return { ...b, paid: b.paid + added, extra: added };
  });
  const known = new Set(base.map((b) => b.category));
  const other = extra.filter((e) => !known.has(e.category)).reduce((sum, e) => sum + e.amount, 0);
  if (live && other > 0) rows.push({ category: "Lainnya", planned: 0, committed: 0, paid: other, extra: other, icon: "wallet" });
  const target = live ? Number(String(planBudget ?? "").replace(/\D/g, "")) || 0 : 0;
  const planned = live ? target : rows.reduce((s, b) => s + b.planned, 0);
  const committed = rows.reduce((s, b) => s + b.committed, 0);
  const paid = rows.reduce((s, b) => s + b.paid, 0);
  const visible = live ? rows.filter((b) => b.paid > 0) : rows;
  return { rows: visible, planned, committed, paid, remaining: planned - paid, percent: planned > 0 ? Math.round((paid / planned) * 100) : 0 };
}

export function usePaymentTotals() {
  const { payments } = useApp();
  const list = payments.length || liveBoot() ? payments : seedPayments;
  const paid = list.filter((p) => p.status === "Terverifikasi" || p.status === "Tercatat manual").reduce((s, p) => s + p.amount, 0);
  const gateway = list.filter((p) => p.kind === "gateway" && p.status === "Terverifikasi").reduce((s, p) => s + p.amount, 0);
  const manual = list.filter((p) => p.kind === "manual" && p.status === "Tercatat manual").reduce((s, p) => s + p.amount, 0);
  const due = list.filter((p) => p.status === "Jatuh tempo" || p.status === "Menunggu BAST").reduce((s, p) => s + p.amount, 0);
  return { list, paid, gateway, manual, due };
}

export const budgetCategoryOptions = budgetItems.map((b) => b.category);
