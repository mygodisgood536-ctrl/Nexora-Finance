"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  LogOut,
  FolderPlus,
  CreditCard,
  Wallet,
  Clock,
  TrendingUp,
  Users,
} from "lucide-react";

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
  today?: { expected: number; realised: number };
};

/**
 * Collection Officer workspace.
 * Branding: company name + CO identity. No Nexora or BM labels.
 */
export function CODashboard({ base, today }: Props) {
  const router = useRouter();
  const brand = base.companyName || base.branchName;

  async function logout() {
    await fetch("/api/logout", { method: "POST" });
    router.push("/branch/login");
    router.refresh();
  }

  const stats = [
    { label: "Expected today", value: `₦${(today?.expected ?? 0).toLocaleString()}`, icon: Clock },
    { label: "Realised today", value: `₦${(today?.realised ?? 0).toLocaleString()}`, icon: TrendingUp },
    { label: "Customers", value: String(base.customerCount), icon: Users },
    { label: "Groups", value: String(base.groupCount), icon: FolderPlus },
  ];

  return (
    <div className="page-shell">
      <header className="page-header">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-medium tracking-wide text-slate-400 uppercase">
              Collection Officer
            </p>
            <h1 className="text-lg font-bold text-slate-900 truncate">{brand}</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-slate-800">{base.name}</p>
              <p className="text-[11px] text-slate-400">{base.branchName}</p>
            </div>
            <button onClick={logout} className="btn-ghost">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="card p-4"
            >
              <div className="flex items-center gap-2 text-slate-400 mb-2">
                <s.icon className="w-4 h-4" />
                <span className="text-[11px]">{s.label}</span>
              </div>
              <p className="text-lg font-bold text-slate-900">{s.value}</p>
            </motion.div>
          ))}
        </div>

        {base.customerCount === 0 && base.groupCount === 0 ? (
          <div className="card p-14 text-center">
            <FolderPlus className="w-11 h-11 text-slate-300 mx-auto mb-3" />
            <h3 className="font-semibold text-slate-900 mb-1">Your portfolio is empty</h3>
            <p className="text-sm text-slate-500 mb-5">Create a group and start adding members.</p>
            <button onClick={() => router.push("/branch/groups")} className="btn-primary">
              <FolderPlus className="w-4 h-4" /> Create group
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap gap-3">
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
        )}
      </main>
    </div>
  );
}
