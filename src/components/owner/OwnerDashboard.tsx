"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Building2,
  LogOut,
  Pause,
  Play,
  Ban,
  Loader2,
  Copy,
  Check,
  MapPin,
  Mail,
} from "lucide-react";

type Company = {
  id: string;
  name: string;
  slug: string;
  gmail: string;
  address: string;
  status: string;
  createdAt: string;
  branchCount: number;
  workerCount: number;
};

type Props = { companies: Company[] };

export function OwnerDashboard({ companies: initial }: Props) {
  const router = useRouter();
  const [companies, setCompanies] = useState(initial);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", gmail: "", address: "" });
  const [created, setCreated] = useState<{ slug: string; tempPassword: string; accessUrl: string; customHost?: string } | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);

  async function logout() {
    await fetch("/api/logout", { method: "POST" });
    router.push("/owner/login");
    router.refresh();
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError("");
    try {
      const res = await fetch("/api/owner/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create");
        setCreating(false);
        return;
      }
      setCreated({ slug: data.slug, tempPassword: data.tempPassword, accessUrl: data.accessUrl, customHost: data.customHost });
      setCompanies((prev) => [
        {
          id: data.id,
          name: form.name,
          slug: data.slug,
          gmail: form.gmail,
          address: form.address,
          status: "ACTIVE",
          createdAt: new Date().toISOString(),
          branchCount: 0,
          workerCount: 0,
        },
        ...prev,
      ]);
      setForm({ name: "", gmail: "", address: "" });
    } catch {
      setError("Something went wrong");
    } finally {
      setCreating(false);
    }
  }

  async function setStatus(id: string, status: string) {
    setActionId(id);
    try {
      const res = await fetch(`/api/owner/companies/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setCompanies((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)));
      }
    } finally {
      setActionId(null);
    }
  }

  function copyCreds() {
    if (!created) return;
    navigator.clipboard.writeText(
      `Access URL: ${created.accessUrl}\nTemporary password: ${created.tempPassword}`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const statusStyle = (s: string) => {
    if (s === "ACTIVE") return "bg-emerald-50 text-emerald-700 border-emerald-100";
    if (s === "SUSPENDED") return "bg-amber-50 text-amber-700 border-amber-100";
    return "bg-slate-100 text-slate-500 border-slate-200";
  };

  return (
    <div className="page-shell">
      <header className="page-header">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium tracking-[0.14em] uppercase text-slate-400">
              Infrastructure Owner
            </p>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">NEXORA</h1>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => { setShowCreate(true); setCreated(null); setError(""); }} className="btn-primary text-sm py-2.5 px-4">
              <Plus className="w-4 h-4" /> New company
            </button>
            <button onClick={logout} className="btn-ghost" title="Sign out">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900">Companies</h2>
          <p className="text-sm text-slate-500 mt-1">
            Create a company to provision its workspace, access URL and temporary credentials.
          </p>
        </div>

        {companies.length === 0 ? (
          <div className="card p-16 text-center">
            <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No companies yet</h3>
            <p className="text-sm text-slate-500 mb-6 max-w-sm mx-auto">
              Create the first company to provision a fully isolated workspace.
            </p>
            <button onClick={() => setShowCreate(true)} className="btn-primary">
              <Plus className="w-4 h-4" /> Create company
            </button>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {companies.map((c, i) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="card p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-slate-900 truncate">{c.name}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">{c.slug}</p>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusStyle(c.status)}`}>
                    {c.status}
                  </span>
                </div>
                <div className="space-y-1.5 text-xs text-slate-500 mb-4">
                  <p className="flex items-center gap-1.5 truncate"><Mail className="w-3 h-3 shrink-0" /> {c.gmail}</p>
                  <p className="flex items-center gap-1.5 truncate"><MapPin className="w-3 h-3 shrink-0" /> {c.address}</p>
                  <p>{c.branchCount} branches · {c.workerCount} workers</p>
                </div>
                <div className="flex gap-2">
                  {c.status === "ACTIVE" && (
                    <button
                      onClick={() => setStatus(c.id, "SUSPENDED")}
                      disabled={actionId === c.id}
                      className="btn-secondary text-xs flex-1 py-2"
                    >
                      {actionId === c.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Pause className="w-3 h-3" />}
                      Suspend
                    </button>
                  )}
                  {c.status === "SUSPENDED" && (
                    <button
                      onClick={() => setStatus(c.id, "ACTIVE")}
                      disabled={actionId === c.id}
                      className="btn-secondary text-xs flex-1 py-2"
                    >
                      {actionId === c.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                      Reactivate
                    </button>
                  )}
                  {c.status !== "DEACTIVATED" && (
                    <button
                      onClick={() => setStatus(c.id, "DEACTIVATED")}
                      disabled={actionId === c.id}
                      className="btn-ghost text-xs text-red-600 hover:bg-red-50 py-2"
                    >
                      <Ban className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      {/* Create modal */}
      <AnimatePresence>
        {showCreate && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={() => !creating && setShowCreate(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="card-elevated w-full max-w-md p-6"
              onClick={(e) => e.stopPropagation()}
            >
              {created ? (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-slate-900">Company ready</h3>
                  <p className="text-sm text-slate-500">
                    Hand these credentials to the company. The workspace is already fully provisioned.
                  </p>
                  <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 text-sm space-y-3">
                    <p><span className="text-slate-400">Access URL</span><br /><span className="font-medium text-slate-900 break-all">{created.accessUrl}</span></p>
                    {created.customHost && (
                      <p><span className="text-slate-400">Custom host (when DNS is set)</span><br /><span className="font-medium text-slate-900">{created.customHost}</span></p>
                    )}
                    <p><span className="text-slate-400">Temporary password</span><br /><span className="font-mono font-medium text-slate-900">{created.tempPassword}</span></p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={copyCreds} className="btn-secondary flex-1">
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      {copied ? "Copied" : "Copy"}
                    </button>
                    <button onClick={() => { setShowCreate(false); setCreated(null); }} className="btn-primary flex-1">
                      Done
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <h3 className="text-lg font-bold text-slate-900 mb-1">Create company</h3>
                  <p className="text-sm text-slate-500 mb-5">
                    Provisions an isolated workspace instantly. No rebuild required.
                  </p>
                  <form onSubmit={handleCreate} className="space-y-3">
                    <div>
                      <label className="label">Company name</label>
                      <input
                        required
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        className="input"
                        placeholder="e.g. Nobby Microfinance"
                      />
                    </div>
                    <div>
                      <label className="label">Gmail</label>
                      <input
                        required
                        type="email"
                        value={form.gmail}
                        onChange={(e) => setForm({ ...form, gmail: e.target.value })}
                        className="input"
                        placeholder="ops@company.com"
                      />
                    </div>
                    <div>
                      <label className="label">Address</label>
                      <input
                        required
                        value={form.address}
                        onChange={(e) => setForm({ ...form, address: e.target.value })}
                        className="input"
                        placeholder="City, Country"
                      />
                    </div>
                    {error && (
                      <p className="text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2">{error}</p>
                    )}
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
