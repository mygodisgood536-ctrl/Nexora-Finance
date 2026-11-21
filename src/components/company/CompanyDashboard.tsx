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
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Copy,
  Check,
} from "lucide-react";
import { TrendChart, ChartPoint } from "@/components/ui/TrendChart";

type Branch = {
  id: string;
  name: string;
  slug: string;
  address: string;
  workerCount: number;
  customerCount: number;
  createdAt: string;
};

type Metrics = {
  expectedToday: number;
  realisedToday: number;
  historicalExpected: number;
  historicalRealised: number;
  series: ChartPoint[];
  trendUp: boolean | null;
  warnings: Array<{ id: string; type: string; message: string; severity: string; branchName?: string; createdAt: string }>;
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
  metrics: Metrics;
};

function formatNaira(n: number) {
  return `₦${n.toLocaleString()}`;
}

/**
 * Company workplace overview — vision §3.1
 * Combined performance, charts, health warnings, Branches View.
 */
export function CompanyDashboard({ company, branches, stats, metrics }: Props) {
  const router = useRouter();
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", address: "" });
  const [error, setError] = useState("");
  const [createdBranch, setCreatedBranch] = useState<{
    id: string;
    name: string;
    url: string;
    host: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

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
      setCreatedBranch({
        id: data.branch.id,
        name: data.branch.name,
        url: data.branch.url,
        host: data.branch.host || `${data.branch.slug}.${company.slug}.nexora.app`,
      });
      setForm({ name: "", address: "" });
      setCreating(false);
      router.refresh();
    } catch {
      setError("Something went wrong");
      setCreating(false);
    }
  }

  function copyUrl(url: string) {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const achievement =
    metrics.expectedToday > 0
      ? Math.round((metrics.realisedToday / metrics.expectedToday) * 1000) / 10
      : 0;

  return (
    <div className="page-shell">
      <header className="page-header">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-slate-900 truncate">{company.name}</h1>
            <p className="text-[11px] text-slate-400">Company overview</p>
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

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Today metrics — vision §3.1 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Expected today", value: formatNaira(metrics.expectedToday) },
            { label: "Realised today", value: formatNaira(metrics.realisedToday) },
            { label: "Historical expected", value: formatNaira(metrics.historicalExpected || 0) },
            { label: "Historical realised", value: formatNaira(metrics.historicalRealised || 0) },
            {
              label: "Achievement",
              value: `${achievement}%`,
            },
            {
              label: "Trend",
              value:
                metrics.trendUp == null ? "—" : metrics.trendUp ? "Up" : "Down",
              icon: metrics.trendUp == null ? null : metrics.trendUp ? TrendingUp : TrendingDown,
            },
          ].map((s) => (
            <div key={s.label} className="card p-4">
              <p className="text-xs text-slate-400">{s.label}</p>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-xl font-bold text-slate-900">{s.value}</p>
                {s.icon && <s.icon className={`w-4 h-4 ${metrics.trendUp ? "text-emerald-500" : "text-amber-500"}`} />}
              </div>
            </div>
          ))}
        </div>

        {/* Chart */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">
            Expected vs realised (14 days)
          </h3>
          <TrendChart data={metrics.series} height={200} />
        </div>

        {/* Health warnings — vision §3.1 */}
        <div className={`card p-5 ${metrics.warnings.length > 0 ? "border-amber-200 bg-amber-50/50" : ""}`}>
          <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <AlertTriangle className={`w-4 h-4 ${metrics.warnings.length > 0 ? "text-amber-600" : "text-emerald-500"}`} /> Company health
          </h3>
          {metrics.warnings.length === 0 ? (
            <div className="py-4 text-center">
              <p className="text-sm text-slate-600">All systems healthy</p>
              <p className="text-xs text-slate-400 mt-1">No provider, webhook or provisioning warnings.</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {metrics.warnings.map((w) => (
                <li key={w.id} className="text-sm text-slate-700 rounded-xl bg-white/70 border border-amber-100 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-semibold uppercase text-amber-600">{w.type.replace(/_/g, " ")}</span>
                    {w.branchName && <span className="text-[10px] text-slate-500 bg-white px-1.5 py-0.5 rounded">{w.branchName}</span>}
                  </div>
                  <p className="mt-1">{w.message}</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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

        {/* Branches View — vision §3.2 */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900">Branches</h2>
            <button
              onClick={() => {
                setShowCreate(true);
                setCreatedBranch(null);
                setError("");
              }}
              className="btn-primary text-sm py-2.5 px-4"
            >
              <Plus className="w-4 h-4" /> New branch
            </button>
          </div>

          {branches.length === 0 ? (
            <div className="card p-14 text-center">
              <Building2 className="w-11 h-11 text-slate-300 mx-auto mb-3" />
              <h3 className="font-semibold text-slate-900 mb-1">No branches yet</h3>
              <p className="text-sm text-slate-500 mb-5">
                Create a branch to open its workplace and add staff.
              </p>
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
              {createdBranch ? (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-slate-900">Branch ready</h3>
                  <p className="text-sm text-slate-500">
                    Branch URL for staff login. No password is generated for the branch itself.
                  </p>
                  <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 text-sm space-y-3">
                    <div>
                      <p className="text-slate-400 text-xs mb-1">Branch URL — staff sign-in</p>
                      <p className="font-medium text-slate-900 break-all">{createdBranch.url}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-xs mb-1">Branch host (vision format)</p>
                      <p className="font-medium text-slate-600 break-all">{createdBranch.host}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => copyUrl(createdBranch.url)}
                      className="btn-secondary flex-1"
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      {copied ? "Copied" : "Copy URL"}
                    </button>
                    <button
                      onClick={() => {
                        setShowCreate(false);
                        router.push(`/company/branches/${createdBranch.id}`);
                      }}
                      className="btn-primary flex-1"
                    >
                      Open branch
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <h3 className="text-lg font-bold text-slate-900 mb-5">Create branch</h3>
                  <form onSubmit={handleCreate} className="space-y-3">
                    <div>
                      <label className="label">Branch name</label>
                      <input
                        required
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="label">Address</label>
                      <input
                        required
                        value={form.address}
                        onChange={(e) => setForm({ ...form, address: e.target.value })}
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
