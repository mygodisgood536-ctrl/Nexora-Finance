"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CreditCard, Loader2, Check, Link2 } from "lucide-react";

type Props = {
  branchId: string;
  branchName: string;
  existing?: {
    providerCode: string;
    connectionStatus: string;
    webhookUrl: string | null;
  } | null;
};

const PROVIDERS = [
  { code: "MONNIFY", label: "Monnify", fields: ["apiKey", "secretKey", "contractCode"] },
  { code: "PAYSTACK", label: "Paystack", fields: ["secretKey", "publicKey"] },
  { code: "FLUTTERWAVE", label: "Flutterwave", fields: ["secretKey", "publicKey", "encryptionKey"] },
];

export function ProviderSetup({ branchId, branchName, existing }: Props) {
  const [provider, setProvider] = useState(existing?.providerCode || "PAYSTACK");
  const [creds, setCreds] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ webhookUrl: string } | null>(null);
  const [error, setError] = useState("");

  const current = PROVIDERS.find((p) => p.code === provider)!;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/company/providers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          branchId,
          providerCode: provider,
          credentials: creds,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to save");
        setSaving(false);
        return;
      }
      setResult({ webhookUrl: data.webhookUrl });
    } catch {
      setError("Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card p-6">
      <div className="flex items-center gap-3 mb-5">
        <CreditCard className="w-5 h-5 text-sky-400" />
        <div>
          <h3 className="font-semibold text-white">Payment Provider — {branchName}</h3>
          <p className="text-xs text-slate-500">One active provider per branch. Credentials are encrypted at rest.</p>
        </div>
      </div>

      {existing && !result && (
        <div className="mb-4 p-3 rounded-xl bg-slate-900/80 border border-slate-700 text-sm">
          <p className="text-slate-300">Current: <span className="text-white font-medium">{existing.providerCode}</span></p>
          <p className="text-xs text-slate-500 mt-1">Status: {existing.connectionStatus}</p>
          {existing.webhookUrl && (
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <Link2 className="w-3 h-3" /> {existing.webhookUrl}
            </p>
          )}
        </div>
      )}

      {result ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-emerald-400 text-sm">
            <Check className="w-4 h-4" /> Provider connection saved
          </div>
          <div>
            <label className="label">Webhook Endpoint</label>
            <input readOnly value={result.webhookUrl} className="input text-sky-300 text-sm" />
          </div>
          <p className="text-xs text-slate-500">
            Where the provider requires manual registration, paste this exact URL into the provider dashboard.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="label">Provider</label>
            <div className="flex gap-2">
              {PROVIDERS.map((p) => (
                <button
                  key={p.code}
                  type="button"
                  onClick={() => { setProvider(p.code); setCreds({}); }}
                  className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                    provider === p.code
                      ? "border-sky-500/50 bg-sky-500/10 text-sky-300"
                      : "border-slate-700 text-slate-400 hover:bg-slate-800"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          {current.fields.map((field) => (
            <div key={field}>
              <label className="label capitalize">{field.replace(/([A-Z])/g, " $1")}</label>
              <input
                type="password"
                value={creds[field] || ""}
                onChange={(e) => setCreds({ ...creds, [field]: e.target.value })}
                className="input"
                required
                autoComplete="off"
              />
            </div>
          ))}
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button type="submit" disabled={saving} className="btn-primary w-full">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save & Connect"}
          </button>
        </form>
      )}
    </div>
  );
}
