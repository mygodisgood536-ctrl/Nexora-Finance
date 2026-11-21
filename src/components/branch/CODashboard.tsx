"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  LogOut, FolderPlus, CreditCard, Wallet, Clock, TrendingUp, TrendingDown, Users,
  AlertTriangle, Bell, FileText, ArrowRight, CheckCheck, Activity, ListChecks,
} from "lucide-react";
import { TrendChart } from "@/components/ui/TrendChart";

type Dashboard = {
  performance: {
    expectedToday: number; realisedToday: number; difference: number; achievementPct: number;
    historicalExpected: number; historicalRealised: number;
    trend: Array<{ label: string; expected: number; realised: number }>;
    direction: string; changePct: number;
  };
  outstanding: number;
  overdue: { amount: number; count: number };
  overdueRows: Array<{ loanId: string; customerName: string; amount: number; dueDate: string }>;
  customers: number; groups: number; activeLoans: number; completedLoans: number;
  pendingApplications: number; awaitingAllocation: number;
  notifications: Array<{ id: string; title: string; message: string; type: string; createdAt: string }>;
  inactivity: Array<{ loanId: string; customerName: string; dueDate: string; mode: string }>;
  customerPerformance: Array<{ id: string; fullName: string; phone: string; savings: number; status: string; outstanding: number }>;
  groupPerformance: Array<{ id: string; name: string; number: string; members: number }>;
};
type Props = {
  base: {
    workerId: string; name: string; role: string; branchName: string; branchId: string;
    companyId: string; companyName?: string; customerCount: number; groupCount: number; loanCount: number;
  };
  today?: { expected: number; realised: number };
  dashboard: Dashboard;
};

const naira = (n: number) => `₦${(n || 0).toLocaleString()}`;

export function CODashboard({ base, today, dashboard }: Props) {
  const router = useRouter();
  const [showAllNotices, setShowAllNotices] = useState(false);
  const d = dashboard;
  const p = d.performance;
  const brand = base.companyName || base.branchName;

  async function logout() {
    await fetch("/api/logout", { method: "POST" });
    router.push("/branch/login");
    router.refresh();
  }
  async function markRead() {
    await fetch("/api/branch/notifications", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
    router.refresh();
  }

  const metrics = [
    { label: "Expected today", value: naira(p.expectedToday), icon: Clock },
    { label: "Realised today", value: naira(p.realisedToday), icon: TrendingUp },
    { label: "Difference", value: naira(p.difference), icon: p.difference >= 0 ? TrendingUp : TrendingDown },
    { label: "Achievement", value: `${p.achievementPct}%`, icon: Activity },
    { label: "Outstanding", value: naira(d.outstanding), icon: CreditCard },
    { label: "Overdue", value: `${naira(d.overdue.amount)} (${d.overdue.count})`, icon: AlertTriangle },
    { label: "Customers", value: String(d.customers), icon: Users },
    { label: "Groups", value: String(d.groups), icon: FolderPlus },
  ];
  const isEmpty = d.customers === 0 && d.groups === 0;

  return (
    <div className="page-shell">
      <header className="page-header">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-medium tracking-wide text-slate-400 uppercase">Collection Officer</p>
            <h1 className="text-lg font-bold text-slate-900 truncate">{brand}</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-slate-800">{base.name}</p>
              <p className="text-[11px] text-slate-400">{base.branchName}</p>
            </div>
            <button onClick={logout} className="btn-ghost"><LogOut className="w-4 h-4" /></button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {metrics.map((m, i) => (
            <motion.div key={m.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="card p-4">
              <div className="flex items-center gap-2 text-slate-400 mb-2"><m.icon className="w-4 h-4" /><span className="text-[11px]">{m.label}</span></div>
              <p className="text-lg font-bold text-slate-900 truncate">{m.value}</p>
            </motion.div>
          ))}
        </div>

        {isEmpty ? (
          <div className="card p-14 text-center">
            <FolderPlus className="w-11 h-11 text-slate-300 mx-auto mb-3" />
            <h3 className="font-semibold text-slate-900 mb-1">Your portfolio is empty</h3>
            <p className="text-sm text-slate-500 mb-5">No customers, groups, repayment history or collections yet. Start by creating a group.</p>
            <button onClick={() => router.push("/branch/groups")} className="btn-primary"><FolderPlus className="w-4 h-4" /> Create group</button>
          </div>
        ) : (
          <>
            <div className="grid sm:grid-cols-3 gap-3">
              <button onClick={() => router.push("/branch/groups")} className="card p-5 text-left hover:shadow-md transition-shadow flex items-center gap-3">
                <FolderPlus className="w-5 h-5 text-sky-500" /><div><p className="font-semibold text-slate-900">Groups</p><p className="text-xs text-slate-500">{d.groups} groups · {d.groupPerformance.length} shown</p></div><ArrowRight className="w-4 h-4 text-slate-300 ml-auto" />
              </button>
              <button onClick={() => router.push("/branch/applications")} className="card p-5 text-left hover:shadow-md transition-shadow flex items-center gap-3">
                <FileText className="w-5 h-5 text-sky-500" /><div><p className="font-semibold text-slate-900">Applications</p><p className="text-xs text-slate-500">{d.pendingApplications} pending · {d.activeLoans} active loans</p></div><ArrowRight className="w-4 h-4 text-slate-300 ml-auto" />
              </button>
              <button onClick={() => router.push("/branch/payments")} className="card p-5 text-left hover:shadow-md transition-shadow flex items-center gap-3">
                <Wallet className="w-5 h-5 text-sky-500" /><div><p className="font-semibold text-slate-900">Payments</p><p className="text-xs text-slate-500">{d.awaitingAllocation} awaiting allocation</p></div><ArrowRight className="w-4 h-4 text-slate-300 ml-auto" />
              </button>
            </div>

            <div className="grid lg:grid-cols-3 gap-5">
              <div className="card p-5 lg:col-span-2">
                <div className="flex items-center justify-between mb-4">
                  <div><h3 className="font-semibold text-slate-900">Collection trend</h3><p className="text-xs text-slate-500">Expected vs realised · {p.direction} {p.changePct}% over prior week</p></div>
                </div>
                <TrendChart data={p.trend} height={180} />
              </div>
              <div className="card p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-slate-900 flex items-center gap-2"><Bell className="w-4 h-4 text-slate-400" /> Notifications</h3>
                  {d.notifications.length > 0 && <button onClick={markRead} className="text-xs text-sky-600 flex items-center gap-1"><CheckCheck className="w-3.5 h-3.5" /> Mark read</button>}
                </div>
                {d.notifications.length === 0 ? (
                  <div className="py-8 text-center text-sm text-slate-400">No notifications</div>
                ) : (
                  <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                    {d.notifications.slice(0, showAllNotices ? 50 : 5).map((n) => (
                      <div key={n.id} className="rounded-xl bg-slate-50 border border-slate-100 p-3">
                        <p className="text-xs font-medium text-slate-800">{n.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{n.message}</p>
                        <p className="text-[10px] text-slate-400 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                      </div>
                    ))}
                    {d.notifications.length > 5 && <button onClick={() => setShowAllNotices(!showAllNotices)} className="text-xs text-sky-600 w-full text-center">{showAllNotices ? "Show less" : `Show all ${d.notifications.length}`}</button>}
                  </div>
                )}
              </div>
            </div>

            {(d.inactivity.length > 0 || d.pendingApplications > 0 || d.awaitingAllocation > 0) && (
              <div className="grid sm:grid-cols-3 gap-3">
                {d.inactivity.length > 0 && (
                  <div className="card p-4 border-amber-200 bg-amber-50/50">
                    <p className="text-xs font-semibold text-amber-700 flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5" /> Inactivity alerts ({d.inactivity.length})</p>
                    <p className="text-xs text-slate-600 mt-2">{d.inactivity.slice(0, 3).map((a) => a.customerName).join(", ")}</p>
                    <p className="text-[10px] text-slate-500 mt-1">Per loan: 15 business days (weekly) / 3 (daily).</p>
                  </div>
                )}
                {d.pendingApplications > 0 && <button onClick={() => router.push("/branch/applications")} className="card p-4 text-left"><p className="text-xs font-semibold text-slate-700 flex items-center gap-1.5"><ListChecks className="w-3.5 h-3.5" /> Pending applications</p><p className="text-2xl font-bold text-slate-900 mt-2">{d.pendingApplications}</p><p className="text-[11px] text-slate-400 mt-1">Draft applications to resume</p></button>}
                {d.awaitingAllocation > 0 && <button onClick={() => router.push("/branch/payments")} className="card p-4 text-left"><p className="text-xs font-semibold text-slate-700 flex items-center gap-1.5"><Wallet className="w-3.5 h-3.5" /> Payments awaiting allocation</p><p className="text-2xl font-bold text-slate-900 mt-2">{d.awaitingAllocation}</p><p className="text-[11px] text-slate-400 mt-1">Verified receipts to allocate</p></button>}
              </div>
            )}

            {d.overdueRows.length > 0 && (
              <div className="card p-5">
                <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-amber-500" /> Follow-up · overdue instalments</h3>
                <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-slate-100 text-left text-xs text-slate-400"><th className="px-3 py-2">Customer</th><th className="px-3 py-2">Due date</th><th className="px-3 py-2 text-right">Amount</th></tr></thead><tbody>
                  {d.overdueRows.map((r) => <tr key={r.loanId} className="border-b border-slate-50"><td className="px-3 py-2 font-medium text-slate-800">{r.customerName}</td><td className="px-3 py-2 text-slate-500">{new Date(r.dueDate).toLocaleDateString()}</td><td className="px-3 py-2 text-right text-amber-600">{naira(r.amount)}</td></tr>)}
                </tbody></table></div>
              </div>
            )}

            <div className="grid lg:grid-cols-2 gap-5">
              <div className="card p-5">
                <h3 className="font-semibold text-slate-900 mb-4">Customer performance</h3>
                {d.customerPerformance.length === 0 ? <p className="text-sm text-slate-400">No customers yet.</p> : (
                  <div className="overflow-x-auto"><table className="w-full text-xs"><thead><tr className="border-b border-slate-100 text-left text-slate-400"><th className="px-2 py-2">Customer</th><th className="px-2 py-2 text-right">Outstanding</th><th className="px-2 py-2 text-right">Savings</th><th className="px-2 py-2">Status</th></tr></thead><tbody>
                    {d.customerPerformance.slice(0, 10).map((c) => <tr key={c.id} className="border-b border-slate-50 cursor-pointer hover:bg-slate-50" onClick={() => router.push(`/branch/customers/${c.id}`)}><td className="px-2 py-2 font-medium text-slate-800">{c.fullName}</td><td className="px-2 py-2 text-right text-slate-600">{naira(c.outstanding)}</td><td className="px-2 py-2 text-right text-slate-600">{naira(c.savings)}</td><td className="px-2 py-2 text-slate-500">{c.status}</td></tr>)}
                  </tbody></table></div>
                )}
              </div>
              <div className="card p-5">
                <h3 className="font-semibold text-slate-900 mb-4">Group performance</h3>
                {d.groupPerformance.length === 0 ? <p className="text-sm text-slate-400">No groups yet.</p> : (
                  <div className="overflow-x-auto"><table className="w-full text-xs"><thead><tr className="border-b border-slate-100 text-left text-slate-400"><th className="px-2 py-2">Group</th><th className="px-2 py-2">Number</th><th className="px-2 py-2 text-right">Members</th></tr></thead><tbody>
                    {d.groupPerformance.slice(0, 10).map((g) => <tr key={g.id} className="border-b border-slate-50 cursor-pointer hover:bg-slate-50" onClick={() => router.push(`/branch/groups/${g.id}`)}><td className="px-2 py-2 font-medium text-slate-800">{g.name}</td><td className="px-2 py-2 text-slate-500">#{g.number}</td><td className="px-2 py-2 text-right text-slate-600">{g.members}</td></tr>)}
                  </tbody></table></div>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
