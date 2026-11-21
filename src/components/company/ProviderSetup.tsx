"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, CreditCard, Loader2, Check, Link2, Activity, Unplug, RefreshCw, AlertTriangle, ShieldCheck } from "lucide-react";

type Existing = {
  id: string; providerCode: string; connectionStatus: string; webhookUrl: string | null;
  isActive: boolean; lastHealthCheck: string | null;
};
type History = { id: string; providerCode: string; connectionStatus: string; isActive: boolean; webhookUrl: string | null; createdAt: string };

const PROVIDERS = [
  { code: "MONNIFY", label: "Monnify", fields: ["apiKey", "secretKey", "contractCode"] },
  { code: "PAYSTACK", label: "Paystack", fields: ["secretKey", "publicKey", "bankCode"] },
  { code: "FLUTTERWAVE", label: "Flutterwave", fields: ["secretKey", "publicKey", "encryptionKey"] },
];

export function ProviderSetup({ branchId, branchName, existing, history }: { branchId: string; branchName: string; existing?: Existing | null; history: History[] }) {
  const router = useRouter();
  const [provider, setProvider] = useState(existing?.providerCode || "PAYSTACK");
  const [creds, setCreds] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const current = PROVIDERS.find((p) => p.code === provider)!;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError(""); setResult(null);
    try {
      const res = await fetch("/api/company/providers", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ branchId, providerCode: provider, credentials: creds }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to save"); setSaving(false); return; }
      setResult(data.webhookUrl);
      setCreds({});
      router.refresh();
    } catch { setError("Something went wrong"); }
    finally { setSaving(false); }
  }

  async function action(connectionId: string, act: "test" | "reconnect" | "disconnect") {
    setBusy(true); setError("");
    try {
      const res = await fetch("/api/company/providers", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connectionId, action: act }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setError(data.error || "Action failed");
      else setResult(act === "test" ? `Connection verified: ${data.message}` : act === "reconnect" ? "Provider reconnected" : "Provider disconnected");
      router.refresh();
    } catch { setError("Action failed"); }
    finally { setBusy(false); }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-slate-50/80 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center gap-4">
          <button onClick={() => router.push(`/company/branches/${branchId}`)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"><ArrowLeft className="w-5 h-5" /></button>
          <div><h1 className="text-lg font-semibold text-slate-900">Payment provider</h1><p className="text-xs text-slate-500">{branchName} · one active provider per branch</p></div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center"><CreditCard className="w-5 h-5 text-sky-600" /></div>
            <div>
              <h2 className="font-semibold text-slate-900">Provider configuration — {branchName}</h2>
              <p className="text-xs text-slate-500">Company users only. Branch workers never see these settings. Credentials are encrypted at rest.</p>
            </div>
          </div>

          {existing && (
            <div className="mb-6 rounded-xl bg-slate-50 border border-slate-200 p-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <p className="text-sm text-slate-700">Active connection: <span className="font-semibold">{existing.providerCode}</span></p>
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${existing.connectionStatus === "CONNECTED" ? "bg-emerald-500" : existing.connectionStatus === "FAILED" ? "bg-red-500" : "bg-amber-500"}`} />
                    {existing.connectionStatus} {existing.isActive ? "" : "(inactive)"}
                  </p>
                  {existing.webhookUrl && <p className="text-xs text-slate-500 mt-1 flex items-center gap-1"><Link2 className="w-3 h-3" /> {existing.webhookUrl}</p>}
                  {existing.lastHealthCheck && <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1"><Activity className="w-3 h-3" /> Last checked {new Date(existing.lastHealthCheck).toLocaleString()}</p>}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => action(existing.id, "test")} disabled={busy} className="btn-secondary text-xs py-2 px-3 flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5" /> Test</button>
                  <button onClick={() => action(existing.id, "reconnect")} disabled={busy} className="btn-secondary text-xs py-2 px-3 flex items-center gap-1"><RefreshCw className="w-3.5 h-3.5" /> Reconnect</button>
                  <button onClick={() => action(existing.id, "disconnect")} disabled={busy} className="btn-ghost text-xs text-red-600 py-2 px-3 flex items-center gap-1"><Unplug className="w-3.5 h-3.5" /> Disconnect</button>
                </div>
              </div>
            </div>
          )}

          {result && (
            <div className="mb-4 rounded-xl bg-emerald-50 border border-emerald-100 p-4 text-sm text-emerald-700">
              <p className="flex items-center gap-2 font-medium mb-1"><Check className="w-4 h-4" /> {result.startsWith("http") ? "Connection saved and verified" : result}</p>
              {result.startsWith("http") && <>
                <p className="text-xs mt-2">Register this exact webhook URL in your provider dashboard if manual registration is required:</p>
                <input readOnly value={result} className="input mt-2 text-xs" />
              </>}
            </div>
          )}
          {error && <div className="mb-4 rounded-xl bg-red-50 border border-red-100 p-3 text-sm text-red-600 flex items-center gap-2"><AlertTriangle className="w-4 h-4" />{error}</div>}

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="label">Provider</label>
              <div className="flex gap-2">
                {PROVIDERS.map((p) => (
                  <button key={p.code} type="button" onClick={() => { setProvider(p.code); setCreds({}); setResult(null); }}
                    className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-colors ${provider === p.code ? "border-sky-500/50 bg-sky-50 text-sky-700" : "border-slate-200 text-slate-500 hover:bg-slate-50"}`}>
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
            {current.fields.map((field) => (
              <div key={field}>
                <label className="label capitalize">{field.replace(/([A-Z])/g, " $1")}</label>
                <input type="password" value={creds[field] || ""} onChange={(e) => setCreds({ ...creds, [field]: e.target.value })} className="input" required autoComplete="off" />
              </div>
            ))}
            <p className="text-[11px] text-slate-500">The connection is tested against the provider before activation. Webhook signature verification is enforced for all incoming payments.</p>
            <button type="submit" disabled={saving} className="btn-primary w-full">{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Test & Activate Provider"}</button>
          </form>
        </div>

        <div className="card p-6">
          <h3 className="font-semibold text-slate-900 mb-4">Connection history</h3>
          {history.length === 0 ? <p className="text-sm text-slate-500">No provider connections configured for this branch.</p> : (
            <div className="space-y-2">
              {history.map((c) => (
                <div key={c.id} className="rounded-xl border border-slate-100 p-3 flex items-center justify-between text-sm">
                  <div><span className="font-medium text-slate-800">{c.providerCode}</span><span className="text-xs text-slate-400 ml-2">Created {new Date(c.createdAt).toLocaleDateString()}</span></div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${c.isActive ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"}`}>{c.isActive ? "Active" : "Inactive"} · {c.connectionStatus}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
