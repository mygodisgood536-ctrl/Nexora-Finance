"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  Plus,
  LogOut,
  Activity,
  Users,
  MapPin,
  MoreVertical,
  Pause,
  Play,
  Ban,
  CheckCircle2,
  X,
  Copy,
  Check,
  Loader2,
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
  customerCount: number;
};

export function OwnerDashboard({ companies }: { companies: Company[] }) {
  const router = useRouter();
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", gmail: "", address: "" });
  const [createdResult, setCreatedResult] = useState<{
    url: string;
    tempPassword: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  async function handleLogout() {
    await fetch("/api/logout", { method: "POST" });
    router.push("/owner/login");
    router.refresh();
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch("/api/owner/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to create company");
        setCreating(false);
        return;
      }
      setCreatedResult({
        url: data.url,
        tempPassword: data.tempPassword,
      });
      setForm({ name: "", gmail: "", address: "" });
      router.refresh();
    } catch {
      alert("Something went wrong");
    } finally {
      setCreating(false);
    }
  }

  async function handleStatusChange(companyId: string, action: string) {
    setActionLoading(companyId + action);
    try {
      await fetch(`/api/owner/companies/${companyId}`, {
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

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const statusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
      case "SUSPENDED":
        return "bg-amber-500/15 text-amber-400 border-amber-500/30";
      case "DEACTIVATED":
        return "bg-red-500/15 text-red-400 border-red-500/30";
      default:
        return "bg-slate-500/15 text-slate-400 border-slate-500/30";
    }
  };

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
              <span className="text-white font-bold text-sm">N</span>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-white tracking-tight">
                Nexora
              </h1>
              <p className="text-xs text-slate-500 -mt-0.5">
                Infrastructure Owner
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              Platform healthy
            </div>
            <button onClick={handleLogout} className="btn-secondary text-xs py-2 px-3">
              <LogOut className="w-3.5 h-3.5" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats + Create */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Companies
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              {companies.length} compan{companies.length === 1 ? "y" : "ies"} on
              the platform
            </p>
          </div>
          <button
            onClick={() => {
              setShowCreate(true);
              setCreatedResult(null);
            }}
            className="btn-primary"
          >
            <Plus className="w-4 h-4" />
            Create Company
          </button>
        </div>

        {/* Companies Grid */}
        {companies.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="card p-16 text-center"
          >
            <Building2 className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-300 mb-2">
              No companies yet
            </h3>
            <p className="text-slate-500 text-sm mb-6">
              Create the first company to start renting the infrastructure.
            </p>
            <button
              onClick={() => setShowCreate(true)}
              className="btn-primary"
            >
              <Plus className="w-4 h-4" />
              Create Company
            </button>
          </motion.div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {companies.map((company, i) => (
              <motion.div
                key={company.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="card p-5 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-sky-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white leading-tight">
                        {company.name}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {company.slug}.nexora.app
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${statusColor(
                      company.status
                    )}`}
                  >
                    {company.status}
                  </span>
                </div>

                <div className="space-y-2 text-sm text-slate-400 mb-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{company.address}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      {company.branchCount} branches · {company.workerCount}{" "}
                      workers · {company.customerCount} customers
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 pt-3 border-t border-slate-800/80">
                  {company.status === "ACTIVE" && (
                    <>
                      <button
                        onClick={() =>
                          handleStatusChange(company.id, "suspend")
                        }
                        disabled={!!actionLoading}
                        className="flex-1 text-xs py-1.5 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-colors flex items-center justify-center gap-1.5"
                      >
                        {actionLoading === company.id + "suspend" ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Pause className="w-3 h-3" />
                        )}
                        Suspend
                      </button>
                      <button
                        onClick={() =>
                          handleStatusChange(company.id, "deactivate")
                        }
                        disabled={!!actionLoading}
                        className="flex-1 text-xs py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors flex items-center justify-center gap-1.5"
                      >
                        {actionLoading === company.id + "deactivate" ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Ban className="w-3 h-3" />
                        )}
                        Deactivate
                      </button>
                    </>
                  )}
                  {(company.status === "SUSPENDED" ||
                    company.status === "DEACTIVATED") && (
                    <button
                      onClick={() =>
                        handleStatusChange(company.id, "reactivate")
                      }
                      disabled={!!actionLoading}
                      className="flex-1 text-xs py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors flex items-center justify-center gap-1.5"
                    >
                      {actionLoading === company.id + "reactivate" ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Play className="w-3 h-3" />
                      )}
                      Reactivate
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      {/* Create Company Modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={() => !creating && setShowCreate(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="card w-full max-w-md p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white">
                  {createdResult ? "Company Created" : "Create Company"}
                </h3>
                <button
                  onClick={() => setShowCreate(false)}
                  className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {createdResult ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-emerald-400 text-sm mb-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Company created successfully
                  </div>
                  <div>
                    <label className="label">Company URL</label>
                    <div className="flex gap-2">
                      <input
                        readOnly
                        value={createdResult.url}
                        className="input text-sky-300"
                      />
                      <button
                        onClick={() => copyToClipboard(createdResult.url)}
                        className="btn-secondary px-3"
                      >
                        {copied ? (
                          <Check className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="label">Temporary Password</label>
                    <div className="flex gap-2">
                      <input
                        readOnly
                        value={createdResult.tempPassword}
                        className="input font-mono text-amber-300"
                      />
                      <button
                        onClick={() =>
                          copyToClipboard(createdResult.tempPassword)
                        }
                        className="btn-secondary px-3"
                      >
                        {copied ? (
                          <Check className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 pt-2">
                    Give the URL and temporary password to the company MD. They
                    will change the password on first login.
                  </p>
                  <button
                    onClick={() => {
                      setShowCreate(false);
                      setCreatedResult(null);
                    }}
                    className="btn-primary w-full mt-2"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <form onSubmit={handleCreate} className="space-y-4">
                  <div>
                    <label className="label">Company Name</label>
                    <input
                      required
                      value={form.name}
                      onChange={(e) =>
                        setForm({ ...form, name: e.target.value })
                      }
                      className="input"
                      placeholder="e.g. Hope Microfinance"
                    />
                  </div>
                  <div>
                    <label className="label">Gmail</label>
                    <input
                      required
                      type="email"
                      value={form.gmail}
                      onChange={(e) =>
                        setForm({ ...form, gmail: e.target.value })
                      }
                      className="input"
                      placeholder="company@gmail.com"
                    />
                  </div>
                  <div>
                    <label className="label">Address</label>
                    <textarea
                      required
                      value={form.address}
                      onChange={(e) =>
                        setForm({ ...form, address: e.target.value })
                      }
                      className="input min-h-[80px] resize-none"
                      placeholder="Full company address"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={creating}
                    className="btn-primary w-full py-3"
                  >
                    {creating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        Create Company
                      </>
                    )}
                  </button>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
