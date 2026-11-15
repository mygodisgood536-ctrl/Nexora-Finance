"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle2, Loader2, Banknote } from "lucide-react";
import { formatNaira } from "@/lib/money";

type Props = {
  applicationId: string;
  customerName: string;
  amount: number;
};

export function DisbursementConfirm({ applicationId, customerName, amount }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function confirm() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/branch/disbursement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId, disbursementAmount: amount }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Confirmation failed");
        setLoading(false);
        return;
      }
      setDone(true);
      setTimeout(() => router.push("/branch"), 1800);
    } catch {
      setError("Something went wrong");
      setLoading(false);
    }
  }

  if (done) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="card p-10 text-center">
        <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Loan Activated</h2>
        <p className="text-sm text-slate-400">Immutable schedule created. Virtual account provisioning is running in the background.</p>
      </motion.div>
    );
  }

  return (
    <div className="card p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center">
          <Banknote className="w-5 h-5 text-emerald-400" />
        </div>
        <div>
          <h3 className="font-semibold text-white">Confirm External Disbursement</h3>
          <p className="text-xs text-slate-500">Nexora does not disburse funds. Confirm after the company has paid out.</p>
        </div>
      </div>
      <div className="space-y-2 text-sm mb-6">
        <div className="flex justify-between"><span className="text-slate-400">Customer</span><span className="text-white">{customerName}</span></div>
        <div className="flex justify-between"><span className="text-slate-400">Amount</span><span className="text-white font-medium">{formatNaira(amount)}</span></div>
      </div>
      {error && <p className="text-sm text-red-400 mb-4">{error}</p>}
      <button onClick={confirm} disabled={loading} className="btn-primary w-full py-3">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
        Confirm Disbursement & Activate Loan
      </button>
    </div>
  );
}
