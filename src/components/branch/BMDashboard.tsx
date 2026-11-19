"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  LogOut,
  LayoutDashboard,
  Briefcase,
  ArrowRightLeft,
} from "lucide-react";
import { CODashboard } from "./CODashboard";

type CoMetric = {
  workerId: string;
  name: string;
  totalCustomers: number;
  activeLoans: number;
  expectedCollection: number;
  realisedCollection: number;
  overdueAmount: number;
  overdueCount: number;
  repaymentRate: number;
  savingsCollected: number;
  pendingAllocations: number;
};

type Props = {
  base: {
    workerId: string;
    name: string;
    role: string;
    branchName: string;
    branchId: string;
    companyId: string;
    companyName?: string;
    customerCount: number;
    groupCount: number;
    loanCount: number;
  };
  coMetrics: CoMetric[];
};

/**
 * Branch Manager workspace.
 * Branding: company name + BM identity.
 * Can switch into CO mode for personal portfolio work.
 */
export function BMDashboard({ base, coMetrics }: Props) {
  const router = useRouter();
  const [mode, setMode] = useState<"dashboard" | "co">("dashboard");
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
          <span>Working as Collection Officer</span>
          <button
            onClick={() => setMode("dashboard")}
            className="underline underline-offset-2 font-medium"
          >
            Back to branch view
          </button>
        </div>
        <CODashboard base={base} />
      </div>
    );
  }

  return (
    <div className="page-shell">
      <header className="page-header">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-medium tracking-wide text-slate-400 uppercase">
              Branch Manager
            </p>
            <h1 className="text-lg font-bold text-slate-900 truncate">{brand}</h1>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setMode("co")} className="btn-secondary text-xs py-2">
              <ArrowRightLeft className="w-3.5 h-3.5" /> Work as CO
            </button>
            <button onClick={logout} className="btn-ghost">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h2 className="text-lg font-bold text-slate-900">{base.branchName}</h2>
          <p className="text-sm text-slate-500">Branch performance · {base.name}</p>
        </div>

        {coMetrics.length === 0 ? (
          <div className="card p-14 text-center">
            <Briefcase className="w-11 h-11 text-slate-300 mx-auto mb-3" />
            <h3 className="font-semibold text-slate-900 mb-1">No collection officers yet</h3>
            <p className="text-sm text-slate-500">
              Officers created from the company workspace will appear here with live metrics.
            </p>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-xs text-slate-400">
                    <th className="px-4 py-3 font-medium">Officer</th>
                    <th className="px-4 py-3 font-medium">Customers</th>
                    <th className="px-4 py-3 font-medium">Loans</th>
                    <th className="px-4 py-3 font-medium">Expected</th>
                    <th className="px-4 py-3 font-medium">Realised</th>
                    <th className="px-4 py-3 font-medium">Overdue</th>
                    <th className="px-4 py-3 font-medium">Rate</th>
                    <th className="px-4 py-3 font-medium">Savings</th>
                    <th className="px-4 py-3 font-medium">Pending</th>
                  </tr>
                </thead>
                <tbody>
                  {coMetrics.map((m, i) => (
                    <motion.tr
                      key={m.workerId}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.04 }}
                      className="border-b border-slate-50 hover:bg-slate-50/80"
                    >
                      <td className="px-4 py-3 font-medium text-slate-900">{m.name}</td>
                      <td className="px-4 py-3 text-slate-600">{m.totalCustomers}</td>
                      <td className="px-4 py-3 text-slate-600">{m.activeLoans}</td>
                      <td className="px-4 py-3 text-slate-600">₦{m.expectedCollection.toLocaleString()}</td>
                      <td className="px-4 py-3 text-slate-600">₦{m.realisedCollection.toLocaleString()}</td>
                      <td className="px-4 py-3 text-slate-600">₦{m.overdueAmount.toLocaleString()}</td>
                      <td className="px-4 py-3 text-slate-600">{m.repaymentRate}%</td>
                      <td className="px-4 py-3 text-slate-600">₦{m.savingsCollected.toLocaleString()}</td>
                      <td className="px-4 py-3 text-slate-600">{m.pendingAllocations}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
