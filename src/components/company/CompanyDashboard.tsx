"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Building2,
  Plus,
  LogOut,
  MapPin,
  Users,
  Activity,
  TrendingUp,
  AlertTriangle,
  ChevronRight,
  Loader2,
} from "lucide-react";

type Branch = {
  id: string;
  name: string;
  slug: string;
  address: string;
  workerCount: number;
  customerCount: number;
  createdAt: string;
};

type Props = {
  company: { id: string; name: string; slug: string; status: string };
  branches: Branch[];
  stats: {
    branchCount: number;
    workerCount: number;
    customerCount: number;
    loanCount: number;
  };
};

export function CompanyDashboard({ company, branches, stats }: Props) {
  const router = useRouter();
  const [showCreateBranch, setShowCreateBranch] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", address: "" });

  async function handleLogout() {
    await fetch("/api/logout", { method: "POST" });
    router.push("/company/login");
    router.refresh();
  }

  async function handleCreateBranch(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch("/api/company/branches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to create branch");
        setCreating(false);
        return;
      }
      setShowCreateBranch(false);
      setForm({ name: "", address: "" });
      router.refresh();
    } catch {
      alert("Something went wrong");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#05050a]">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-[#05050a]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-400 to-sky-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Building2 className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-white tracking-tight">
                {company.name}
              </h1>
              <p className="text-xs text-slate-500 -mt-0.5">
                {company.slug}.nexora.app
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={handleLogout} className="btn-secondary text-xs py-2 px-3">
              <LogOut className="w-3.5 h-3.5" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Branches", value: stats.branchCount, icon: MapPin },
            { label: "Workers", value: stats.workerCount, icon: Users },
            { label: "Customers", value: stats.customerCount, icon: Users },
            { label: "Active Loans", value: stats.loanCount, icon: TrendingUp },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="card p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                  {stat.label}
                </span>
                <stat.icon className="w-4 h-4 text-slate-500" />
              </div>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Company Health placeholder */}
        <div className="card p-5 mb-8 border-l-4 border-l-emerald-500/50">
          <div className="flex items-center gap-3">
            <Activity className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="font-medium text-white">Company Health</h3>
              <p className="text-sm text-slate-400">
                No operational warnings at this time
              </p>
            </div>
          </div>
        </div>

        {/* Branches View */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-white tracking-tight">
            Branches View
          </h2>
          <button
            onClick={() => setShowCreateBranch(true)}
            className="btn-primary text-sm"
          >
            <Plus className="w-4 h-4" />
            Create Branch
          </button>
        </div>

        {branches.length === 0 ? (
          <div className="card p-12 text-center">
            <MapPin className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <h3 className="font-medium text-slate-300 mb-1">No branches yet</h3>
            <p className="text-sm text-slate-500 mb-5">
              Create the first branch for this company.
            </p>
            <button
              onClick={() => setShowCreateBranch(true)}
              className="btn-primary"
            >
              <Plus className="w-4 h-4" />
              Create Branch
            </button>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {branches.map((branch, i) => (
              <motion.div
                key={branch.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="card p-5 hover:border-slate-700 transition-colors cursor-pointer group"
                onClick={() => router.push(`/company/branches/${branch.id}`)}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-white group-hover:text-sky-300 transition-colors">
                      {branch.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {branch.slug}.{company.slug}.nexora.app
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
                </div>
                <p className="text-sm text-slate-400 mt-3 truncate">
                  {branch.address}
                </p>
                <div className="flex gap-3 mt-4 text-xs text-slate-500">
                  <span>{branch.workerCount} workers</span>
                  <span>·</span>
                  <span>{branch.customerCount} customers</span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      {/* Create Branch Modal */}
      {showCreateBranch && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => !creating && setShowCreateBranch(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-white mb-5">
              Create Branch
            </h3>
            <form onSubmit={handleCreateBranch} className="space-y-4">
              <div>
                <label className="label">Branch Name</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="input"
                  placeholder="e.g. Mainland Branch"
                />
              </div>
              <div>
                <label className="label">Branch Address</label>
                <textarea
                  required
                  value={form.address}
                  onChange={(e) =>
                    setForm({ ...form, address: e.target.value })
                  }
                  className="input min-h-[80px] resize-none"
                  placeholder="Full branch address"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateBranch(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="btn-primary flex-1"
                >
                  {creating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  Create
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
