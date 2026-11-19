"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  LogOut,
  MapPin,
  Users,
  Building2,
  Loader2,
  ChevronRight,
  Settings,
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

/**
 * Company workspace dashboard.
 * Branding: company.name only. No Nexora, BM, or CO labels in the chrome.
 */
export function CompanyDashboard({ company, branches, stats }: Props) {
  const router = useRouter();
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", address: "" });
  const [error, setError] = useState("");

  async function logout() {
    await fetch("/api/logout", { method: "POST" });
    router.push("/company/login");
    router.refresh();
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError("");
    try {
      const res = await fetch("/api/company/branches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create branch");
        setCreating(false);
        return;
      }
      setShowCreate(false);
      setForm({ name: "", address: "" });
      router.refresh();
    } catch {
      setError("Something went wrong");
      setCreating(false);
    }
  }

  return (
    <div className="page-shell">
      <header className="page-header">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-slate-900 truncate">{company.name}</h1>
            <p className="text-[11px] text-slate-400 truncate">{company.slug}</p>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => router.push("/company/settings")} className="btn-ghost" title="Settings">
              <Settings className="w-4 h-4" />
            </button>
            <button onClick={logout} className="btn-ghost" title="Sign out">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {[
            { label: "Branches", value: stats.branchCount },
            { label: "Staff", value: stats.workerCount },
            { label: "Customers", value: stats.customerCount },
            { label: "Active loans", value: stats.loanCount },
          ].map((s) => (
            <div key={s.label} className="card p-4">
              <p className="text-xs text-slate-400">{s.label}</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900">Branches</h2>
          <button onClick={() => setShowCreate(true)} className="btn-primary text-sm py-2.5 px-4">
            <Plus className="w-4 h-4" /> New branch
          </button>
        </div>

        {branches.length === 0 ? (
          <div className="card p-14 text-center">
            <Building2 className="w-11 h-11 text-slate-300 mx-auto mb-3" />
            <h3 className="font-semibold text-slate-900 mb-1">No branches yet</h3>
            <p className="text-sm text-slate-500 mb-5">Create a branch to start adding staff.</p>
            <button onClick={() => setShowCreate(true)} className="btn-primary">
              <Plus className="w-4 h-4" /> Create branch
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {branches.map((b, i) => (
              <motion.button
                key={b.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => router.push(`/company/branches/${b.id}`)}
                className="card w-full p-4 flex items-center justify-between text-left hover:shadow-md transition-shadow"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900">{b.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1 truncate">
                    <MapPin className="w-3 h-3 shrink-0" /> {b.address}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" /> {b.workerCount}
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </main>

      <AnimatePresence>
        {showCreate && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={() => !creating && setShowCreate(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="card-elevated w-full max-w-md p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold text-slate-900 mb-5">Create branch</h3>
              <form onSubmit={handleCreate} className="space-y-3">
                <div>
                  <label className="label">Branch name</label>
                  <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" />
                </div>
                <div>
                  <label className="label">Address</label>
                  <input required value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="input" />
                </div>
                {error && <p className="text-sm text-red-600">{error}</p>}
                <div className="flex gap-2 pt-2">
                  <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary flex-1">Cancel</button>
                  <button type="submit" disabled={creating} className="btn-primary flex-1">
                    {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    Create
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
