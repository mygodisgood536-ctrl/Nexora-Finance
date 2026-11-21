"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  LogOut, Briefcase, ArrowRightLeft, Users, FolderOpen, CreditCard,
  AlertTriangle, Search, Eye,
} from "lucide-react";
import { CODashboard } from "./CODashboard";

type CoMetric = {
  workerId: string; name: string; totalCustomers: number; activeLoans: number;
  expectedCollection: number; realisedCollection: number; overdueAmount: number;
  overdueCount: number; repaymentRate: number; savingsCollected: number; pendingAllocations: number;
};
type BranchData = {
  branch: { id: string; name: string; slug: string; address: string } | null;
  performance: { expectedToday: number; realisedToday: number; difference: number; achievementPct: number; historicalExpected: number; historicalRealised: number; trend: any[]; direction: string; changePct: number };
  outstanding: number;
  overdue: { amount: number; count: number };
  groups: Array<{ id: string; name: string; number: string; ownerName: string; dateCreated: string }>;
  customers: Array<{ id: string; fullName: string; phone: string; ownerName: string; savingsBalance: number; customerStatus: string }>;
  loans: Array<{ id: string; status: string; outstanding: number; total: number; customerName: string; ownerName: string }>;
};
type Props = {
  base: { workerId: string; name: string; role: string; branchName: string; branchId: string; companyId: string; companyName?: string; customerCount: number; groupCount: number; loanCount: number };
  coMetrics: CoMetric[];
  branchData: BranchData;
  coDashboard: any;
};
const naira = (n: number) => `₦${(n || 0).toLocaleString()}`;

export function BMDashboard({ base, coMetrics, branchData, coDashboard }: Props) {
  const router = useRouter();
  const [mode, setMode] = useState<"dashboard" | "co">("dashboard");
  const [tab, setTab] = useState<"performance" | "groups" | "customers" | "loans">("performance");
  const [query, setQuery] = useState("");
  const brand = base.companyName || base.branchName;

  async function logout() {
    await fetch("/api/logout", { method: "POST" });
    router.push("/branch/login");
    router.refresh();
  }

  if (mode === "co") {
    return (
      <div>
        <div className="bg-black text-white text-center text-xs py-2 flex items-center justify-center gap-2">
          <span>Working as Collection Officer — your own portfolio only</span>
          <button onClick={() => setMode("dashboard")} className="underline underline-offset-2 font-medium">Back to BM Dashboard</button>
        </div>
        <CODashboard base={base} dashboard={coDashboard} />
      </div>
    );
  }

  const filteredCustomers = branchData.customers.filter((c) => [c.fullName, c.phone, c.ownerName].some((v) => v.toLowerCase().includes(query.toLowerCase())));
  const filteredGroups = branchData.groups.filter((g) => [g.name, g.number, g.ownerName].some((v) => v.toLowerCase().includes(query.toLowerCase())));

  return (
    <div className="page-shell">
      <header className="page-header">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[11px] font-medium tracking-wide text-slate-400 uppercase">Branch Manager</p>
            <h1 className="text-lg font-bold text-slate-900 truncate">{brand}</h1>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setMode("co")} className="btn-secondary text-xs py-2 px-3 flex items-center gap-1"><ArrowRightLeft className="w-3.5 h-3.5" /> Work as CO</button>
            <button onClick={logout} className="btn-ghost"><LogOut className="w-4 h-4" /></button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900">{base.branchName}</h2>
          <p className="text-sm text-slate-500">Branch-wide monitoring · {base.name}. Inspection does not transfer ownership.</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { l: "Expected today", v: naira(branchData.performance.expectedToday), i: CreditCard },
            { l: "Realised today", v: naira(branchData.performance.realisedToday), i: CreditCard },
            { l: "Outstanding", v: naira(branchData.outstanding), i: CreditCard },
            { l: "Overdue", v: `${branchData.overdue.count} · ${naira(branchData.overdue.amount)}`, i: AlertTriangle },
            { l: "Groups", v: branchData.groups.length, i: FolderOpen },
            { l: "Customers", v: branchData.customers.length, i: Users },
          ].map((c, i) => (
            <motion.div key={c.l} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }} className="card p-4">
              <c.i className="w-4 h-4 text-slate-400 mb-2" /><p className="text-sm font-bold text-slate-900 truncate">{c.v}</p><p className="text-[10px] text-slate-500">{c.l}</p>
            </motion.div>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-1 overflow-x-auto">
            {(["performance", "groups", "customers", "loans"] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap capitalize ${tab === t ? "bg-sky-50 text-sky-700 border border-sky-200" : "text-slate-500 hover:bg-slate-100"}`}>{t}</button>
            ))}
          </div>
          <div className="relative"><Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search records" className="input pl-9 w-full sm:w-56" /></div>
        </div>

        {tab === "performance" && (
          coMetrics.length === 0 ? (
            <div className="card p-14 text-center"><Briefcase className="w-11 h-11 text-slate-300 mx-auto mb-3" /><h3 className="font-semibold text-slate-900 mb-1">No collection officers yet</h3><p className="text-sm text-slate-500">Officers created from the company workspace appear here with live metrics.</p></div>
          ) : (
            <div className="card overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-slate-100 text-left text-xs text-slate-400 uppercase tracking-wide">
                  <th className="px-4 py-3 font-medium">Officer</th><th className="px-4 py-3 text-center">Customers</th><th className="px-4 py-3 text-center">Active loans</th>
                  <th className="px-4 py-3 text-right">Expected</th><th className="px-4 py-3 text-right">Realised</th><th className="px-4 py-3 text-right">Overdue (count)</th>
                  <th className="px-4 py-3 text-right">Rate</th><th className="px-4 py-3 text-right">Savings</th><th className="px-4 py-3 text-center">Pending</th>
                </tr></thead>
                <tbody>
                  {coMetrics.map((m, i) => (
                    <motion.tr key={m.workerId} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }} className="border-b border-slate-50 hover:bg-slate-50/70">
                      <td className="px-4 py-3 font-medium text-slate-900">{m.name}</td>
                      <td className="px-4 py-3 text-center text-slate-600">{m.totalCustomers}</td>
                      <td className="px-4 py-3 text-center text-slate-600">{m.activeLoans}</td>
                      <td className="px-4 py-3 text-right text-slate-600">{naira(m.expectedCollection)}</td>
                      <td className="px-4 py-3 text-right text-emerald-600 font-medium">{naira(m.realisedCollection)}</td>
                      <td className="px-4 py-3 text-right text-amber-600">{naira(m.overdueAmount)} ({m.overdueCount})</td>
                      <td className="px-4 py-3 text-right text-slate-600">{m.repaymentRate}%</td>
                      <td className="px-4 py-3 text-right text-slate-600">{naira(m.savingsCollected)}</td>
                      <td className="px-4 py-3 text-center text-slate-600">{m.pendingAllocations}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
              <p className="px-4 py-3 text-[11px] text-slate-400">Realised = posted loan allocations · Savings = posted savings allocations · Pending = verified receipts not yet posted · Overdue = unsatisfied instalments past due date.</p>
            </div>
          )
        )}

        {tab === "groups" && (
          <div className="card overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-slate-100 text-left text-xs text-slate-400"><th className="px-4 py-3">Group</th><th className="px-4 py-3">Number</th><th className="px-4 py-3">Current owner</th><th className="px-4 py-3">Created</th><th className="px-4 py-3"></th></tr></thead><tbody>
            {filteredGroups.map((g) => <tr key={g.id} className="border-b border-slate-50"><td className="px-4 py-3 font-medium text-slate-900">{g.name}</td><td className="px-4 py-3 text-slate-500">#{g.number}</td><td className="px-4 py-3 text-slate-600">{g.ownerName}</td><td className="px-4 py-3 text-slate-500">{new Date(g.dateCreated).toLocaleDateString()}</td><td className="px-4 py-3"><button onClick={() => router.push(`/branch/groups/${g.id}`)} className="text-xs text-sky-600 flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> Inspect</button></td></tr>)}
            {filteredGroups.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">No groups found</td></tr>}
          </tbody></table></div>
        )}

        {tab === "customers" && (
          <div className="card overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-slate-100 text-left text-xs text-slate-400"><th className="px-4 py-3">Customer</th><th className="px-4 py-3">Phone</th><th className="px-4 py-3">Current owner</th><th className="px-4 py-3 text-right">Savings</th><th className="px-4 py-3">Status</th><th className="px-4 py-3"></th></tr></thead><tbody>
            {filteredCustomers.map((c) => <tr key={c.id} className="border-b border-slate-50"><td className="px-4 py-3 font-medium text-slate-900">{c.fullName}</td><td className="px-4 py-3 text-slate-500">{c.phone}</td><td className="px-4 py-3 text-slate-600">{c.ownerName}</td><td className="px-4 py-3 text-right text-slate-600">{naira(c.savingsBalance)}</td><td className="px-4 py-3 text-slate-500">{c.customerStatus}</td><td className="px-4 py-3"><button onClick={() => router.push(`/branch/customers/${c.id}`)} className="text-xs text-sky-600 flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> Inspect</button></td></tr>)}
            {filteredCustomers.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">No customers found</td></tr>}
          </tbody></table></div>
        )}

        {tab === "loans" && (
          <div className="card overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-slate-100 text-left text-xs text-slate-400"><th className="px-4 py-3">Customer</th><th className="px-4 py-3">Owner</th><th className="px-4 py-3 text-right">Outstanding / Total</th><th className="px-4 py-3">Status</th></tr></thead><tbody>
            {branchData.loans.map((l) => <tr key={l.id} className="border-b border-slate-50"><td className="px-4 py-3 font-medium text-slate-900">{l.customerName}</td><td className="px-4 py-3 text-slate-600">{l.ownerName}</td><td className="px-4 py-3 text-right text-slate-600">{naira(l.outstanding)} / {naira(l.total)}</td><td className="px-4 py-3 text-slate-500">{l.status}</td></tr>)}
            {branchData.loans.length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400">No loans found</td></tr>}
          </tbody></table></div>
        )}
      </main>
    </div>
  );
}
