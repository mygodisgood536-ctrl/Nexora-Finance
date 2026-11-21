"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Wallet, Loader2, Check, Banknote } from "lucide-react";
import { formatNaira, roundToKobo } from "@/lib/money";

type Receipt = {
  id: string;
  amount: number;
  source: string;
  receivedAt: string;
  customer: { id: string; name: string; phone: string; savings: number };
  loan: { id: string; outstanding: number; total: number } | null;
};

export function PaymentsPage({ receipts, customers }: { receipts: Receipt[]; customers: Array<{ id: string; name: string; loanId: string | null }> }) {
  const router = useRouter();
  const [active, setActive] = useState<Receipt | null>(null);
  const [loanAlloc, setLoanAlloc] = useState("");
  const [savingsAlloc, setSavingsAlloc] = useState("");
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");
  const [showCash, setShowCash] = useState(false);
  const [cashCustomer, setCashCustomer] = useState("");
  const [cashAmount, setCashAmount] = useState("");
  const [cashLoan, setCashLoan] = useState("");

  async function recordCash(e: React.FormEvent) {
    e.preventDefault();
    setPosting(true); setError("");
    try {
      const res = await fetch("/api/branch/manual-cash", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId: cashCustomer, amount: Number(cashAmount), loanId: cashLoan || null }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to record cash payment"); setPosting(false); return; }
      setShowCash(false); setCashCustomer(""); setCashAmount(""); setCashLoan("");
      router.refresh();
    } catch { setError("Something went wrong"); }
    finally { setPosting(false); }
  }

  function openAllocate(r: Receipt) {
    setActive(r);
    const outstanding = r.loan?.outstanding ?? 0;
    const defaultLoan = Math.min(r.amount, outstanding);
    setLoanAlloc(String(defaultLoan));
    setSavingsAlloc(String(roundToKobo(r.amount - defaultLoan)));
    setError("");
  }

  async function postAllocation() {
    if (!active) return;
    setPosting(true);
    setError("");
    try {
      const res = await fetch("/api/branch/allocations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiptId: active.id,
          loanAllocation: Number(loanAlloc),
          savingsAllocation: Number(savingsAlloc),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Allocation failed");
        setPosting(false);
        return;
      }
      setActive(null);
      router.refresh();
    } catch {
      setError("Something went wrong");
    } finally {
      setPosting(false);
    }
  }

  const tallyOk =
    active &&
    Math.abs(Number(loanAlloc) + Number(savingsAlloc) - active.amount) < 0.015;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-slate-50/80 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center gap-4">
          <button onClick={() => router.push("/branch")} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold text-slate-900">Payments Awaiting Allocation</h1>
          <button onClick={() => setShowCash(true)} className="ml-auto btn-primary text-xs py-2 px-3 flex items-center gap-1"><Banknote className="w-3.5 h-3.5" /> Record cash payment</button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {receipts.length === 0 ? (
          <div className="card p-16 text-center">
            <Wallet className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-slate-900 mb-2">No pending payments</h2>
            <p className="text-sm text-slate-500">Verified payments will appear here for allocation.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {receipts.map((r, i) => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="card p-4 flex items-center justify-between"
              >
                <div>
                  <p className="font-medium text-slate-900">{r.customer.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {r.source} · {formatNaira(r.amount)} · {new Date(r.receivedAt).toLocaleString()}
                  </p>
                </div>
                <button onClick={() => openAllocate(r)} className="btn-primary text-xs py-2 px-3">
                  Allocate
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      {active && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => !posting && setActive(null)}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="card w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-slate-900 mb-1">Allocate Payment</h3>
            <p className="text-sm text-slate-500 mb-5">{active.customer.name} · {formatNaira(active.amount)}</p>

            {active.loan && (
              <p className="text-xs text-slate-500 mb-3">
                Outstanding loan balance: {formatNaira(active.loan.outstanding)}
              </p>
            )}

            <div className="space-y-3">
              <div>
                <label className="label">Loan Allocation (₦)</label>
                <input
                  type="number"
                  value={loanAlloc}
                  onChange={(e) => {
                    setLoanAlloc(e.target.value);
                    const remaining = roundToKobo(active.amount - Number(e.target.value || 0));
                    setSavingsAlloc(String(Math.max(0, remaining)));
                  }}
                  className="input"
                />
              </div>
              <div>
                <label className="label">Savings Allocation (₦)</label>
                <input
                  type="number"
                  value={savingsAlloc}
                  onChange={(e) => {
                    setSavingsAlloc(e.target.value);
                    const remaining = roundToKobo(active.amount - Number(e.target.value || 0));
                    setLoanAlloc(String(Math.max(0, remaining)));
                  }}
                  className="input"
                />
              </div>
              <div className={`text-sm flex items-center gap-1.5 ${tallyOk ? "text-emerald-400" : "text-red-400"}`}>
                {tallyOk ? <Check className="w-4 h-4" /> : null}
                {tallyOk ? "Exact tally" : "Loan + Savings must equal receipt amount"}
              </div>
            </div>

            {error && <p className="text-sm text-red-400 mt-3">{error}</p>}

            <div className="flex gap-3 mt-6">
              <button onClick={() => setActive(null)} className="btn-secondary flex-1" disabled={posting}>Cancel</button>
              <button onClick={postAllocation} disabled={posting || !tallyOk} className="btn-primary flex-1">
                {posting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Post Allocation"}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {showCash && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => !posting && setShowCash(false)}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="card w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-slate-900 mb-1">Record Manual Cash Payment</h3>
            <p className="text-xs text-slate-500 mb-5">Recorded as MANUAL_CASH — distinct from provider webhooks. It enters the same allocation workflow.</p>
            <form onSubmit={recordCash} className="space-y-4">
              <div>
                <label className="label">Customer</label>
                <select value={cashCustomer} onChange={(e) => { setCashCustomer(e.target.value); const c = customers.find((x) => x.id === e.target.value); setCashLoan(c?.loanId || ""); }} className="input" required>
                  <option value="">Select customer</option>
                  {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div><label className="label">Amount (₦)</label><input type="number" min="0.01" step="0.01" value={cashAmount} onChange={(e) => setCashAmount(e.target.value)} className="input" required /></div>
              <div><label className="label">Active loan (optional)</label><select value={cashLoan} onChange={(e) => setCashLoan(e.target.value)} className="input"><option value="">None</option>{cashCustomer && customers.find((c) => c.id === cashCustomer)?.loanId && <option value={customers.find((c) => c.id === cashCustomer)!.loanId!}>Active loan</option>}</select></div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowCash(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={posting} className="btn-primary flex-1">{posting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Record & Queue"}</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
