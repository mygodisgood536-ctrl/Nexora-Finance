"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  User,
  Phone,
  Users,
  FolderOpen,
  CreditCard,
  RefreshCw,
  Loader2,
  History,
} from "lucide-react";

type Props = {
  worker: {
    id: string;
    role: string;
    accountStatus: string;
    branchName: string;
    branchId: string;
    currentName: string;
    currentPhone: string;
    customerCount: number;
    groupCount: number;
    loanCount: number;
    createdAt: string;
  };
  identities: Array<{
    id: string;
    name: string;
    phone: string;
    status: string;
    validFrom: string;
    validUntil: string | null;
  }>;
  customers: Array<{
    id: string;
    fullName: string;
    phone: string;
    status: string;
    savingsBalance: number;
    createdAt: string;
  }>;
  groups: Array<{
    id: string;
    name: string;
    number: string;
    status: string;
    dateCreated: string;
  }>;
  loans: Array<{
    id: string;
    customerName: string;
    status: string;
    outstanding: number;
    total: number;
    activatedAt: string;
  }>;
};

export function WorkerDetail({ worker, identities, customers, groups, loans }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<"overview" | "customers" | "groups" | "loans" | "history">("overview");
  const [showReplace, setShowReplace] = useState(false);
  const [replacing, setReplacing] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", passport: "" });
  const [newPassword, setNewPassword] = useState<string | null>(null);

  async function handleReplace(e: React.FormEvent) {
    e.preventDefault();
    setReplacing(true);
    try {
      const res = await fetch(`/api/company/workers/${worker.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "replace", ...form }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Replace failed");
        setReplacing(false);
        return;
      }
      setNewPassword(data.tempPassword);
      router.refresh();
    } catch {
      alert("Something went wrong");
    } finally {
      setReplacing(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-slate-50/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-4">
          <button onClick={() => router.push(`/company/branches/${worker.branchId}`)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-slate-900">{worker.currentName}</h1>
            <p className="text-xs text-slate-500">
              {worker.role === "BM" ? "Branch Manager" : "Collection Officer"} · {worker.branchName}
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header card */}
        <div className="card p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center">
                <User className="w-7 h-7 text-sky-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">{worker.currentName}</h2>
                <p className="text-sm text-slate-500 flex items-center gap-1.5 mt-0.5">
                  <Phone className="w-3.5 h-3.5" /> {worker.currentPhone}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Account status: <span className="text-slate-600">{worker.accountStatus}</span>
                </p>
              </div>
            </div>
            <button onClick={() => { setShowReplace(true); setNewPassword(null); }} className="btn-secondary text-sm">
              <RefreshCw className="w-4 h-4" /> Replace Worker
            </button>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-200">
            <div className="text-center">
              <p className="text-2xl font-bold text-slate-900">{worker.customerCount}</p>
              <p className="text-xs text-slate-500">Customers</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-slate-900">{worker.groupCount}</p>
              <p className="text-xs text-slate-500">Groups</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-slate-900">{worker.loanCount}</p>
              <p className="text-xs text-slate-500">Loans</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
          {[
            { id: "overview", label: "Overview" },
            { id: "customers", label: `Customers (${customers.length})` },
            { id: "groups", label: `Groups (${groups.length})` },
            { id: "loans", label: `Loans (${loans.length})` },
            { id: "history", label: "Identity History" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                tab === t.id
                  ? "bg-sky-500/15 text-sky-300 border border-sky-500/30"
                  : "text-slate-500 hover:text-slate-200 hover:bg-slate-100/50"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === "overview" && (
          <div className="card p-6">
            <p className="text-slate-500 text-sm">
              Full portfolio owned by this worker account. All customers, groups and loans currently under{" "}
              <span className="text-slate-900">{worker.currentName}</span>. Historical actions remain attributed to the
              identity that performed them.
            </p>
          </div>
        )}

        {tab === "customers" && (
          <div className="space-y-2">
            {customers.length === 0 ? (
              <div className="card p-10 text-center text-slate-500">No customers in this portfolio</div>
            ) : (
              customers.map((c) => (
                <div key={c.id} className="card p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900">{c.fullName}</p>
                    <p className="text-xs text-slate-500">{c.phone} · Savings: ₦{c.savingsBalance.toLocaleString()}</p>
                  </div>
                  <span className="text-xs text-slate-500">{c.status}</span>
                </div>
              ))
            )}
          </div>
        )}

        {tab === "groups" && (
          <div className="space-y-2">
            {groups.length === 0 ? (
              <div className="card p-10 text-center text-slate-500">No groups in this portfolio</div>
            ) : (
              groups.map((g) => (
                <div key={g.id} className="card p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900">{g.name}</p>
                    <p className="text-xs text-slate-500">#{g.number}</p>
                  </div>
                  <span className="text-xs text-slate-500">{g.status}</span>
                </div>
              ))
            )}
          </div>
        )}

        {tab === "loans" && (
          <div className="space-y-2">
            {loans.length === 0 ? (
              <div className="card p-10 text-center text-slate-500">No loans in this portfolio</div>
            ) : (
              loans.map((l) => (
                <div key={l.id} className="card p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900">{l.customerName}</p>
                    <p className="text-xs text-slate-500">
                      Outstanding: ₦{l.outstanding.toLocaleString()} / ₦{l.total.toLocaleString()}
                    </p>
                  </div>
                  <span className="text-xs text-slate-500">{l.status}</span>
                </div>
              ))
            )}
          </div>
        )}

        {tab === "history" && (
          <div className="space-y-2">
            {identities.map((i) => (
              <div key={i.id} className="card p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <History className="w-4 h-4 text-slate-500" />
                  <div>
                    <p className="font-medium text-slate-900">{i.name}</p>
                    <p className="text-xs text-slate-500">
                      {i.phone} · From {new Date(i.validFrom).toLocaleDateString()}
                      {i.validUntil ? ` → ${new Date(i.validUntil).toLocaleDateString()}` : " (current)"}
                    </p>
                  </div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${i.status === "ACTIVE" ? "bg-emerald-500/15 text-emerald-400" : "bg-slate-700 text-slate-500"}`}>
                  {i.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Replace Modal */}
      {showReplace && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => !replacing && setShowReplace(false)}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="card w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Replace Worker</h3>
            <p className="text-sm text-slate-500 mb-5">
              The same worker account and portfolio will be transferred to a new person. Historical actions stay with the previous identity.
            </p>
            {newPassword ? (
              <div className="space-y-4">
                <p className="text-sm text-emerald-400">Replacement successful.</p>
                <div>
                  <label className="label">New Temporary Password</label>
                  <input readOnly value={newPassword} className="input font-mono text-amber-300" />
                </div>
                <button onClick={() => setShowReplace(false)} className="btn-primary w-full">Done</button>
              </div>
            ) : (
              <form onSubmit={handleReplace} className="space-y-4">
                <div>
                  <label className="label">New Person Name</label>
                  <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" />
                </div>
                <div>
                  <label className="label">Phone</label>
                  <input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input" />
                </div>
                <div>
                  <label className="label">Passport</label>
                  <input required value={form.passport} onChange={(e) => setForm({ ...form, passport: e.target.value })} className="input" />
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setShowReplace(false)} className="btn-secondary flex-1">Cancel</button>
                  <button type="submit" disabled={replacing} className="btn-primary flex-1">
                    {replacing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                    Replace
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
