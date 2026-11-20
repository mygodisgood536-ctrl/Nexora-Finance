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
  X,
  ExternalLink,
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

function accessUrl(slug: string) {
  const base =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL || "https://nexorafinancecom.vercel.app";
  return `${base}/c/${slug}`;
}

/**
 * Infrastructure Owner workplace — vision §2
 * Platform health, companies list, create, suspend, deactivate, reactivate.
 * Click company to inspect URL, status actions, recopy credentials path.
 */
export function OwnerDashboard({ companies: initial }: Props) {
  const router = useRouter();
  const [companies, setCompanies] = useState(initial);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", gmail: "", address: "" });
  const [created, setCreated] = useState<{
    slug: string;
    tempPassword: string;
    accessUrl: string;
    customHost?: string;
  } | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Company | null>(null);

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
      setCreated({
        slug: data.slug,
        tempPassword: data.tempPassword,
        accessUrl: data.accessUrl || accessUrl(data.slug),
        customHost: data.customHost,
      });
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
        if (selected?.id === id) setSelected({ ...selected, status });
      }
    } finally {
      setActionId(null);
    }
  }

  function copyText(text: string) {
    navigator.clipboard.writeText(text);
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
            <button
              onClick={() => {
                setShowCreate(true);
                setCreated(null);
                setError("");
              }}
              className="btn-primary text-sm py-2.5 px-4"
            >
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
            Create a company to provision its workspace. Click a company to manage it.
          </p>
        </div>

        {companies.length === 0 ? (
          <div className="card p-16 text-center">
            <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No companies yet</h3>
            <p className="text-sm text-slate-500 mb-6 max-w-sm mx-auto">
              Create the first company to provision an isolated workspace.
            </p>
            <button onClick={() => setShowCreate(true)} className="btn-primary">
              <Plus className="w-4 h-4" /> Create company
            </button>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {companies.map((c, i) => (
              <motion.button
                key={c.id}
                type="button"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => setSelected(c)}
                className="card p-5 text-left hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-slate-900 truncate">{c.name}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">{c.slug}</p>
                  </div>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusStyle(c.status)}`}
                  >
                    {c.status}
                  </span>
                </div>
                <div className="space-y-1.5 text-xs text-slate-500">
                  <p className="flex items-center gap-1.5 truncate">
                    <Mail className="w-3 h-3 shrink-0" /> {c.gmail}
                  </p>
                  <p className="flex items-center gap-1.5 truncate">
                    <MapPin className="w-3 h-3 shrink-0" /> {c.address}
                  </p>
                  <p>
                    {c.branchCount} branches · {c.workerCount} workers
                  </p>
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </main>

      {/* Company detail panel — click company */}
      <AnimatePresence>
        {selected && (
          <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm"
            onClick={() => setSelected(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              className="card-elevated w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6 max-h-[90dvh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{selected.name}</h3>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusStyle(selected.status)}`}
                  >
                    {selected.status}
                  </span>
                </div>
                <button onClick={() => setSelected(null)} className="btn-ghost p-2">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-sm mb-5">
                <div className="rounded-2xl bg-slate-50 border border-slate-200 p-3">
                  <p className="text-xs text-slate-400 mb-1">Access URL</p>
                  <p className="font-medium text-slate-900 break-all">
                    {accessUrl(selected.slug)}
                  </p>
                  <button
                    onClick={() => copyText(accessUrl(selected.slug))}
                    className="btn-secondary text-xs mt-2 py-2 w-full"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? "Copied" : "Copy URL"}
                  </button>
                </div>
                <p className="text-slate-500 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" /> {selected.gmail}
                </p>
                <p className="text-slate-500 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" /> {selected.address}
                </p>
                <p className="text-slate-500">
                  {selected.branchCount} branches · {selected.workerCount} workers
                </p>
                <p className="text-xs text-slate-400">
                  Custom host when DNS is ready: {selected.slug}.nexora.app
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {selected.status === "ACTIVE" && (
                  <button
                    onClick={() => setStatus(selected.id, "SUSPENDED")}
                    disabled={actionId === selected.id}
                    className="btn-secondary text-sm flex-1"
                  >
                    {actionId === selected.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Pause className="w-4 h-4" />
                    )}
                    Suspend
                  </button>
                )}
                {selected.status === "SUSPENDED" && (
                  <button
                    onClick={() => setStatus(selected.id, "ACTIVE")}
                    disabled={actionId === selected.id}
                    className="btn-secondary text-sm flex-1"
                  >
                    {actionId === selected.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                    Reactivate
                  </button>
                )}
                {selected.status !== "DEACTIVATED" && (
                  <button
                    onClick={() => setStatus(selected.id, "DEACTIVATED")}
                    disabled={actionId === selected.id}
                    className="btn-ghost text-sm text-red-600 hover:bg-red-50"
                  >
                    <Ban className="w-4 h-4" /> Deactivate
                  </button>
                )}
                {selected.status === "DEACTIVATED" && (
                  <button
                    onClick={() => setStatus(selected.id, "ACTIVE")}
                    disabled={actionId === selected.id}
                    className="btn-primary text-sm flex-1"
                  >
                    <Play className="w-4 h-4" /> Reactivate
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
                    Give these credentials to the company. The workplace is already provisioned.
                  </p>
                  <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 text-sm space-y-3">
                    <p>
                      <span className="text-slate-400">Access URL</span>
                      <br />
                      <span className="font-medium text-slate-900 break-all">
                        {created.accessUrl}
                      </span>
                    </p>
                    {created.customHost && (
                      <p>
                        <span className="text-slate-400">Custom host (when DNS is set)</span>
                        <br />
                        <span className="font-medium text-slate-900">{created.customHost}</span>
                      </p>
                    )}
                    <p>
                      <span className="text-slate-400">Temporary password</span>
                      <br />
                      <span className="font-mono font-medium text-slate-900">
                        {created.tempPassword}
                      </span>
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        copyText(
                          `Access URL: ${created.accessUrl}\nTemporary password: ${created.tempPassword}`
                        )
                      }
                      className="btn-secondary flex-1"
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      {copied ? "Copied" : "Copy"}
                    </button>
                    <button
                      onClick={() => {
                        setShowCreate(false);
                        setCreated(null);
                      }}
                      className="btn-primary flex-1"
                    >
                      Done
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <h3 className="text-lg font-bold text-slate-900 mb-1">Create company</h3>
                  <p className="text-sm text-slate-500 mb-5">
                    Only name, Gmail and address are required.
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
                      <button
                        type="button"
                        onClick={() => setShowCreate(false)}
                        className="btn-secondary flex-1"
                      >
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
