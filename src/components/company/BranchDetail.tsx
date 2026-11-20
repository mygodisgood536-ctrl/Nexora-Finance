"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Plus,
  Users,
  MapPin,
  Loader2,
  UserPlus,
  Ban,
  Pause,
  Play,
  Copy,
  Check,
  CreditCard,
} from "lucide-react";
import { TrendChart, ChartPoint } from "@/components/ui/TrendChart";
import { ProviderSetup } from "@/components/company/ProviderSetup";

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
    branchUrl: string;
    branchLoginPath: string;
  };
  workers: Worker[];
  metrics: {
    expectedToday: number;
    realisedToday: number;
    series: ChartPoint[];
  };
  provider: {
    providerCode: string;
    connectionStatus: string;
    webhookUrl: string | null;
  } | null;
};

/**
 * Company-side branch workplace — vision §3.4 + §4 + §5
 * Charts, branch URL, provider management, workers.
 * Company inspects without branch-worker login.
 */
export function BranchDetail({ branch, workers, metrics, provider }: Props) {
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
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);
  const [showProvider, setShowProvider] = useState(false);

  function copyText(key: string, text: string) {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  async function handleCreateWorker(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError("");
    try {
      const res = await fetch("/api/company/workers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, branchId: branch.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create worker");
        setCreating(false);
        return;
      }
      setCreatedPassword(data.tempPassword || data.password || "");
      setForm({ role: "CO", name: "", phone: "", passport: "" });
      setCreating(false);
      // Stay on this branch — refresh data
      router.refresh();
    } catch {
      setError("Something went wrong");
      setCreating(false);
    }
  }

  async function setWorkerStatus(id: string, accountStatus: string) {
    setActionId(id);
    try {
      await fetch(`/api/company/workers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountStatus }),
      });
      router.refresh();
    } finally {
      setActionId(null);
    }
  }

  return (
    <div className="page-shell">
      <header className="page-header">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center gap-3">
          <button
            onClick={() => router.push("/company")}
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-500"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-bold text-slate-900 truncate">{branch.name}</h1>
            <p className="text-[11px] text-slate-400 truncate">{branch.companyName}</p>
          </div>
          <button
            onClick={() => setShowProvider((v) => !v)}
            className="btn-secondary text-xs py-2"
          >
            <CreditCard className="w-3.5 h-3.5" /> Provider
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        {/* Branch URL — vision: generated on create, available to copy */}
        <div className="card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs text-slate-400 mb-0.5">Branch URL</p>
            <p className="text-sm font-medium text-slate-900 break-all">{branch.branchUrl}</p>
            <p className="text-[11px] text-slate-400 mt-1">
              Staff sign in at {branch.branchLoginPath} using this branch identity
            </p>
          </div>
          <button
            onClick={() => copyText("url", branch.branchUrl)}
            className="btn-secondary text-sm shrink-0"
          >
            {copied === "url" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied === "url" ? "Copied" : "Copy URL"}
          </button>
        </div>

        {/* Today metrics + chart — vision §3.4 */}
        <div className="grid grid-cols-2 gap-3">
          <div className="card p-4">
            <p className="text-xs text-slate-400">Expected today</p>
            <p className="text-xl font-bold text-slate-900 mt-1">
              ₦{metrics.expectedToday.toLocaleString()}
            </p>
          </div>
          <div className="card p-4">
            <p className="text-xs text-slate-400">Realised today</p>
            <p className="text-xl font-bold text-slate-900 mt-1">
              ₦{metrics.realisedToday.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="card p-5">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">
            Branch performance (14 days)
          </h3>
          <TrendChart data={metrics.series} height={180} />
        </div>

        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="card p-3">
            <p className="text-xs text-slate-400">Customers</p>
            <p className="text-lg font-bold text-slate-900">{branch.customerCount}</p>
          </div>
          <div className="card p-3">
            <p className="text-xs text-slate-400">Groups</p>
            <p className="text-lg font-bold text-slate-900">{branch.groupCount}</p>
          </div>
          <div className="card p-3">
            <p className="text-xs text-slate-400">Loans</p>
            <p className="text-lg font-bold text-slate-900">{branch.loanCount}</p>
          </div>
        </div>

        {/* Provider setup — vision §4 */}
        {showProvider && (
          <ProviderSetup
            branchId={branch.id}
            branchName={branch.name}
            existing={provider}
          />
        )}

        {/* Workers — vision §5 */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900">Workers</h2>
            <button
              onClick={() => {
                setShowCreate(true);
                setCreatedPassword(null);
                setError("");
              }}
              className="btn-primary text-sm py-2.5 px-4"
            >
              <UserPlus className="w-4 h-4" /> Create worker
            </button>
          </div>

          {workers.length === 0 ? (
            <div className="card p-12 text-center">
              <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h3 className="font-semibold text-slate-900 mb-1">No workers yet</h3>
              <p className="text-sm text-slate-500 mb-4">
                Create a Branch Manager or Collection Officer for this branch.
              </p>
              <button onClick={() => setShowCreate(true)} className="btn-primary">
                <UserPlus className="w-4 h-4" /> Create worker
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {workers.map((w) => (
                <div
                  key={w.id}
                  className="card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <button
                    onClick={() => router.push(`/company/workers/${w.id}`)}
                    className="text-left min-w-0 flex-1"
                  >
                    <p className="font-semibold text-slate-900">{w.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {w.role} · {w.phone} · {w.accountStatus}
                    </p>
                    <p className="text-xs text-slate-400">
                      {w.customerCount} customers · {w.groupCount} groups · {w.loanCount} loans
                    </p>
                  </button>
                  <div className="flex gap-1 shrink-0">
                    {w.accountStatus === "ACTIVE" && (
                      <button
                        onClick={() => setWorkerStatus(w.id, "SUSPENDED")}
                        disabled={actionId === w.id}
                        className="btn-ghost text-xs"
                        title="Suspend"
                      >
                        <Pause className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {w.accountStatus === "SUSPENDED" && (
                      <button
                        onClick={() => setWorkerStatus(w.id, "ACTIVE")}
                        disabled={actionId === w.id}
                        className="btn-ghost text-xs"
                        title="Reactivate"
                      >
                        <Play className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {w.accountStatus !== "DEACTIVATED" && (
                      <button
                        onClick={() => setWorkerStatus(w.id, "DEACTIVATED")}
                        disabled={actionId === w.id}
                        className="btn-ghost text-xs text-red-600"
                        title="Deactivate"
                      >
                        <Ban className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
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
              {createdPassword ? (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-slate-900">Worker created</h3>
                  <p className="text-sm text-slate-500">
                    Share the temporary password. Worker signs in through the branch URL.
                  </p>
                  <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 text-sm space-y-2">
                    <p>
                      <span className="text-slate-400">Branch URL</span>
                      <br />
                      <span className="font-medium break-all">{branch.branchUrl}</span>
                    </p>
                    <p>
                      <span className="text-slate-400">Temporary password</span>
                      <br />
                      <span className="font-mono font-medium">{createdPassword}</span>
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        copyText(
                          "pw",
                          `Branch: ${branch.branchUrl}\nPassword: ${createdPassword}`
                        )
                      }
                      className="btn-secondary flex-1"
                    >
                      {copied === "pw" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      Copy
                    </button>
                    <button
                      onClick={() => {
                        setShowCreate(false);
                        setCreatedPassword(null);
                      }}
                      className="btn-primary flex-1"
                    >
                      Done
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <h3 className="text-lg font-bold text-slate-900 mb-5">Create worker</h3>
                  <form onSubmit={handleCreateWorker} className="space-y-3">
                    <div>
                      <label className="label">Role</label>
                      <select
                        value={form.role}
                        onChange={(e) => setForm({ ...form, role: e.target.value })}
                        className="input"
                      >
                        <option value="BM">Branch Manager</option>
                        <option value="CO">Collection Officer</option>
                      </select>
                    </div>
                    <div>
                      <label className="label">Name</label>
                      <input
                        required
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="label">Phone</label>
                      <input
                        required
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="label">Passport</label>
                      <input
                        required
                        value={form.passport}
                        onChange={(e) => setForm({ ...form, passport: e.target.value })}
                        className="input"
                      />
                    </div>
                    {error && <p className="text-sm text-red-600">{error}</p>}
                    <div className="flex gap-2 pt-2">
                      <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary flex-1">
                        Cancel
                      </button>
                      <button type="submit" disabled={creating} className="btn-primary flex-1">
                        {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                        Create
                      </button>
                    </div>
                  </form>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
