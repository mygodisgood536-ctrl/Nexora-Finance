"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  LogOut,
  LayoutDashboard,
  Users,
  Briefcase,
  Activity,
  ArrowRightLeft,
} from "lucide-react";

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
    customerCount: number;
    groupCount: number;
    loanCount: number;
  };
  coMetrics: CoMetric[];
};

export function BMDashboard({ base, coMetrics }: Props) {
  const router = useRouter();
  const [mode, setMode] = useState<"dashboard" | "co">("dashboard");

  async function handleLogout() {
    await fetch("/api/logout", { method: "POST" });
    router.push("/branch/login");
    router.refresh();
  }

  if (mode === "co") {
    // Switch to CO mode for BM's own portfolio
    return (
      <div className="min-h-screen bg-slate-950">
        <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-white">{base.name}</span>
              <span className="text-xs text-slate-500">Working as CO</span>
            </div>
            <button onClick={() => setMode("dashboard")} className="btn-secondary text-xs py-1.5 px-3">
              <ArrowRightLeft className="w-3.5 h-3.5" /> Back to BM Dashboard
            </button>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 py-8">
          <div className="card p-8 text-center">
            <Briefcase className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <h2 className="text-lg font-semibold text-white mb-2">CO Mode — Your Portfolio</h2>
            <p className="text-sm text-slate-400 mb-6">
              Full Collection Officer workspace limited to your own portfolio.
              Groups, customers, loan applications, payment allocation will appear here.
            </p>
            <div className="grid grid-cols-3 gap-4 max-w-md mx-auto text-center">
              <div>
                <p className="text-xl font-bold text-white">{base.customerCount}</p>
                <p className="text-xs text-slate-500">Customers</p>
              </div>
              <div>
                <p className="text-xl font-bold text-white">{base.groupCount}</p>
                <p className="text-xs text-slate-500">Groups</p>
              </div>
              <div>
                <p className="text-xl font-bold text-white">{base.loanCount}</p>
                <p className="text-xs text-slate-500">Loans</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-white">{base.branchName}</h1>
            <p className="text-xs text-slate-500">Branch Manager · {base.name}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setMode("co")} className="btn-secondary text-xs py-2 px-3">
              <Briefcase className="w-3.5 h-3.5" /> Work as CO
            </button>
            <button onClick={handleLogout} className="btn-secondary text-xs py-2 px-3">
              <LogOut className="w-3.5 h-3.5" /> Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-2 mb-6">
          <LayoutDashboard className="w-5 h-5 text-sky-400" />
          <h2 className="text-xl font-bold text-white">Branch Dashboard</h2>
        </div>

        {/* 9 metrics table */}
        <div className="card overflow-hidden mb-8">
          <div className="px-5 py-4 border-b border-slate-800">
            <h3 className="font-medium text-white">Collection Officers — Performance</h3>
            <p className="text-xs text-slate-500 mt-0.5">The nine required metrics</p>
          </div>
          {coMetrics.length === 0 ? (
            <div className="p-10 text-center text-slate-500 text-sm">No Collection Officers in this branch yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-slate-500 border-b border-slate-800">
                    <th className="px-4 py-3 font-medium">CO Name</th>
                    <th className="px-4 py-3 font-medium">Customers</th>
                    <th className="px-4 py-3 font-medium">Active Loans</th>
                    <th className="px-4 py-3 font-medium">Expected</th>
                    <th className="px-4 py-3 font-medium">Realised</th>
                    <th className="px-4 py-3 font-medium">Overdue ₦</th>
                    <th className="px-4 py-3 font-medium">Overdue #</th>
                    <th className="px-4 py-3 font-medium">Repayment %</th>
                    <th className="px-4 py-3 font-medium">Savings</th>
                    <th className="px-4 py-3 font-medium">Pending Alloc</th>
                  </tr>
                </thead>
                <tbody>
                  {coMetrics.map((m) => (
                    <tr key={m.workerId} className="border-b border-slate-800/60 hover:bg-slate-900/50">
                      <td className="px-4 py-3 font-medium text-white">{m.name}</td>
                      <td className="px-4 py-3 text-slate-300">{m.totalCustomers}</td>
                      <td className="px-4 py-3 text-slate-300">{m.activeLoans}</td>
                      <td className="px-4 py-3 text-slate-300">₦{m.expectedCollection.toLocaleString()}</td>
                      <td className="px-4 py-3 text-slate-300">₦{m.realisedCollection.toLocaleString()}</td>
                      <td className="px-4 py-3 text-slate-300">₦{m.overdueAmount.toLocaleString()}</td>
                      <td className="px-4 py-3 text-slate-300">{m.overdueCount}</td>
                      <td className="px-4 py-3 text-slate-300">{m.repaymentRate}%</td>
                      <td className="px-4 py-3 text-slate-300">₦{m.savingsCollected.toLocaleString()}</td>
                      <td className="px-4 py-3 text-slate-300">{m.pendingAllocations}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card p-5 border-l-4 border-l-sky-500/50">
          <div className="flex items-center gap-3">
            <Activity className="w-5 h-5 text-sky-400" />
            <div>
              <h3 className="font-medium text-white">Branch Operational Status</h3>
              <p className="text-sm text-slate-400">No critical alerts at this time</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
