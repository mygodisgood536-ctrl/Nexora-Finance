"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Plus,
  Users,
  MapPin,
  User,
  Phone,
  MoreVertical,
  Loader2,
  UserPlus,
  Ban,
  Pause,
  Play,
  RefreshCw,
} from "lucide-react";

type Worker = {
  id: string;
  role: string;
  accountStatus: string;
  name: string;
  phone: string;
  customerCount: number;
  groupCount: number;
  loanCount: number;
  createdAt: string;
};

type Props = {
  branch: {
    id: string;
    name: string;
    slug: string;
    address: string;
    companyName: string;
    companySlug: string;
    customerCount: number;
    groupCount: number;
    loanCount: number;
  };
  workers: Worker[];
};

export function BranchDetail({ branch, workers }: Props) {
  const router = useRouter();
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    role: "CO",
    name: "",
    phone: "",
    passport: "",
  });
  const [createdPassword, setCreatedPassword] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  async function handleCreateWorker(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch("/api/company/workers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, branchId: branch.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to create worker");
        setCreating(false);
        return;
      }
      setCreatedPassword(data.tempPassword);
      setForm({ role: "CO", name: "", phone: "", passport: "" });
      router.refresh();
    } catch {
      alert("Something went wrong");
    } finally {
      setCreating(false);
    }
  }

  async function handleWorkerAction(workerId: string, action: string) {
    setActionLoading(workerId + action);
    try {
      await fetch(`/api/company/workers/${workerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      router.refresh();
    } catch {
      alert("Action failed");
    } finally {
      setActionLoading(null);
    }
  }

  const statusColor = (s: string) => {
    if (s === "ACTIVE") return "text-emerald-400 bg-emerald-500/10";
    if (s === "SUSPENDED") return "text-amber-400 bg-amber-500/10";
    return "text-red-400 bg-red-500/10";
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-slate-50/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-4">
          <button
            onClick={() => router.push("/company")}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-slate-900">{branch.name}</h1>
            <p className="text-xs text-slate-500">
              {branch.slug}.{branch.companySlug}.nexora.app
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Branch overview */}
        <div className="card p-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">{branch.name}</h2>
              <p className="text-sm text-slate-500 mt-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                {branch.address}
              </p>
            </div>
            <div className="flex gap-6 text-sm">
              <div>
                <p className="text-slate-500 text-xs">Customers</p>
                <p className="text-lg font-semibold text-slate-900">{branch.customerCount}</p>
              </div>
              <div>
                <p className="text-slate-500 text-xs">Groups</p>
                <p className="text-lg font-semibold text-slate-900">{branch.groupCount}</p>
              </div>
              <div>
                <p className="text-slate-500 text-xs">Loans</p>
                <p className="text-lg font-semibold text-slate-900">{branch.loanCount}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Workers */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-slate-900">Workers</h2>
          <button onClick={() => { setShowCreate(true); setCreatedPassword(null); }} className="btn-primary text-sm">
            <UserPlus className="w-4 h-4" />
            Create Worker
          </button>
        </div>

        {workers.length === 0 ? (
          <div className="card p-12 text-center">
            <Users className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <h3 className="font-medium text-slate-600 mb-1">No workers yet</h3>
            <p className="text-sm text-slate-500 mb-5">Create a Branch Manager or Collection Officer.</p>
            <button onClick={() => setShowCreate(true)} className="btn-primary">
              <UserPlus className="w-4 h-4" /> Create Worker
            </button>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {workers.map((w, i) => (
              <motion.div
                key={w.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="card p-5 hover:border-slate-200 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center">
                      <User className="w-5 h-5 text-sky-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">{w.name}</h3>
                      <p className="text-xs text-slate-500">{w.role === "BM" ? "Branch Manager" : "Collection Officer"}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${statusColor(w.accountStatus)}`}>
                    {w.accountStatus}
                  </span>
                </div>
                <p className="text-sm text-slate-500 flex items-center gap-1.5 mb-3">
                  <Phone className="w-3.5 h-3.5" /> {w.phone}
                </p>
                <div className="flex gap-3 text-xs text-slate-500 mb-4">
                  <span>{w.customerCount} customers</span>
                  <span>·</span>
                  <span>{w.groupCount} groups</span>
                  <span>·</span>
                  <span>{w.loanCount} loans</span>
                </div>
                <div className="flex gap-2 pt-3 border-t border-slate-200/80">
                  {w.accountStatus === "ACTIVE" && (
                    <>
                      <button
                        onClick={() => handleWorkerAction(w.id, "suspend")}
                        disabled={!!actionLoading}
                        className="flex-1 text-xs py-1.5 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"
                      >
                        Suspend
                      </button>
                      <button
                        onClick={() => handleWorkerAction(w.id, "deactivate")}
                        disabled={!!actionLoading}
                        className="flex-1 text-xs py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20"
                      >
                        Deactivate
                      </button>
                    </>
                  )}
                  {(w.accountStatus === "SUSPENDED" || w.accountStatus === "DEACTIVATED") && (
                    <button
                      onClick={() => handleWorkerAction(w.id, "reactivate")}
                      disabled={!!actionLoading}
                      className="flex-1 text-xs py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                    >
                      Reactivate
                    </button>
                  )}
                  <button
                    onClick={() => router.push(`/company/workers/${w.id}`)}
                    className="flex-1 text-xs py-1.5 rounded-lg bg-slate-800 text-slate-600 hover:bg-slate-700"
                  >
                    View Full
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      {/* Create Worker Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => !creating && setShowCreate(false)}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="card w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-slate-900 mb-5">
              {createdPassword ? "Worker Created" : "Create Worker"}
            </h3>
            {createdPassword ? (
              <div className="space-y-4">
                <p className="text-sm text-emerald-400">Worker account created successfully.</p>
                <div>
                  <label className="label">Temporary Password</label>
                  <input readOnly value={createdPassword} className="input font-mono text-amber-300" />
                </div>
                <p className="text-xs text-slate-500">Give this password to the worker. They log in via the branch URL.</p>
                <button onClick={() => { setShowCreate(false); setCreatedPassword(null); }} className="btn-primary w-full">Done</button>
              </div>
            ) : (
              <form onSubmit={handleCreateWorker} className="space-y-4">
                <div>
                  <label className="label">Role</label>
                  <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="input">
                    <option value="CO">Collection Officer (CO)</option>
                    <option value="BM">Branch Manager (BM)</option>
                  </select>
                </div>
                <div>
                  <label className="label">Worker Name</label>
                  <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" placeholder="Full name" />
                </div>
                <div>
                  <label className="label">Phone Number</label>
                  <input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input" placeholder="080..." />
                </div>
                <div>
                  <label className="label">Passport</label>
                  <input required value={form.passport} onChange={(e) => setForm({ ...form, passport: e.target.value })} className="input" placeholder="Passport number or reference" />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary flex-1">Cancel</button>
                  <button type="submit" disabled={creating} className="btn-primary flex-1">
                    {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                    Create
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}
