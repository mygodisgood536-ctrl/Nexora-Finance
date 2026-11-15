"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  LogOut,
  Users,
  FolderPlus,
  CreditCard,
  Clock,
  AlertCircle,
  TrendingUp,
  Wallet,
} from "lucide-react";

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
  today?: { expected: number; realised: number };
};

export function CODashboard({ base, today }: Props) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/logout", { method: "POST" });
    router.push("/branch/login");
    router.refresh();
  }

  const isEmpty = base.customerCount === 0 && base.groupCount === 0;

  return (
    <div className="min-h-screen bg-[#05050a]">
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-[#05050a]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-white">{base.name}</h1>
            <p className="text-xs text-slate-500">Collection Officer · {base.branchName}</p>
          </div>
          <button onClick={handleLogout} className="btn-secondary text-xs py-2 px-3">
            <LogOut className="w-3.5 h-3.5" /> Logout
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Expected Today", value: `₦${(today?.expected ?? 0).toLocaleString()}`, icon: Clock, color: "text-sky-400" },
            { label: "Realised Today", value: `₦${(today?.realised ?? 0).toLocaleString()}`, icon: TrendingUp, color: "text-emerald-400" },
            { label: "Outstanding", value: "—", icon: Wallet, color: "text-amber-400" },
            { label: "Overdue", value: "—", icon: AlertCircle, color: "text-red-400" },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="card p-5"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-500 uppercase tracking-wider">{s.label}</span>
                <s.icon className={`w-4 h-4 ${s.color}`} />
              </div>
              <p className="text-xl font-bold text-white">{s.value}</p>
            </motion.div>
          ))}
        </div>

        {isEmpty ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card p-16 text-center">
            <Users className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-white mb-2">Empty Portfolio</h2>
            <p className="text-sm text-slate-400 max-w-md mx-auto mb-8">
              You are a new Collection Officer. Your portfolio starts empty. Create a group and start registering customers.
            </p>
            <button className="btn-primary">
              <FolderPlus className="w-4 h-4" /> Create First Group</button>
            <button onClick={() => router.push("/branch/groups")} className="btn-primary">
              <FolderPlus className="w-4 h-4" /> Create First Group
            </button>
          </motion.div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="card p-6">
              <h3 className="font-medium text-white mb-4 flex items-center gap-2">
                <Users className="w-4 h-4 text-sky-400" /> Portfolio Summary
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Customers</span>
                  <span className="text-white font-medium">{base.customerCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Groups</span>
                  <span className="text-white font-medium">{base.groupCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Active Loans</span>
                  <span className="text-white font-medium">{base.loanCount}</span>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <h3 className="font-medium text-white mb-4 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-400" /> Payments Awaiting Allocation
              </h3>
              <p className="text-sm text-slate-500">No payments waiting for allocation</p>
            </div>
          </div>
        )}

        {/* Quick actions */}
        <div className="mt-8 flex flex-wrap gap-3">
          <button onClick={() => router.push("/branch/groups")} className="btn-primary">
            <FolderPlus className="w-4 h-4" /> Groups
          </button>
          <button onClick={() => router.push("/branch/applications")} className="btn-secondary">
            <CreditCard className="w-4 h-4" /> Applications
          </button>
          <button onClick={() => router.push("/branch/payments")} className="btn-secondary">
            <Wallet className="w-4 h-4" /> Payments
          </button>
        </div>
      </main>
    </div>
  );
}
