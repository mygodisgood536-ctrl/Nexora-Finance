"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, CreditCard, Loader2, AlertTriangle } from "lucide-react";

type Props = {
  customer: {
    id: string;
    fullName: string;
    phone: string;
    gender: string;
    maritalStatus: string;
    address: string;
    savingsBalance: number;
    status: string;
    hasActiveLoan: boolean;
  };
  groups: Array<{ id: string; name: string; role: string }>;
  loans: Array<{ id: string; status: string; outstanding: number; total: number; activatedAt: string }>;
  applications: Array<{ id: string; stage: number; status: string; amount: number; mode: string; updatedAt: string }>;
};

export function CustomerDetail({ customer, groups, loans, applications }: Props) {
  const router = useRouter();
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");

  async function startLoanApplication() {
    if (customer.hasActiveLoan) {
      setError("Customer already has an active loan");
      return;
    }
    setStarting(true);
    setError("");
    try {
      const res = await fetch("/api/branch/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: customer.id,
          groupId: groups[0]?.id || null,
          repaymentMode: "WEEKLY",
          requestedAmount: 0,
          loanPurpose: "",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to start application");
        setStarting(false);
        return;
      }
      router.push(`/branch/applications/${data.applicationId}`);
    } catch {
      setError("Something went wrong");
      setStarting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#05050a]">
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-[#05050a]/80 backdrop-blur-xl">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-slate-800 text-slate-400">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-white">{customer.fullName}</h1>
            <p className="text-xs text-slate-500">{customer.phone}</p>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <div className="card p-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-slate-500 text-xs">Gender</p>
              <p className="text-white">{customer.gender || "—"}</p>
            </div>
            <div>
              <p className="text-slate-500 text-xs">Marital Status</p>
              <p className="text-white">{customer.maritalStatus || "—"}</p>
            </div>
            <div className="col-span-2">
              <p className="text-slate-500 text-xs">Address</p>
              <p className="text-white">{customer.address || "—"}</p>
            </div>
            <div>
              <p className="text-slate-500 text-xs">Savings Balance</p>
              <p className="text-white font-medium">₦{customer.savingsBalance.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-slate-500 text-xs">Status</p>
              <p className="text-white">{customer.status}</p>
            </div>
          </div>
        </div>

        {groups.length > 0 && (
          <div className="card p-5">
            <h3 className="font-medium text-white mb-3">Groups</h3>
            <div className="space-y-2">
              {groups.map((g) => (
                <div key={g.id} className="flex justify-between text-sm">
                  <span className="text-slate-300">{g.name}</span>
                  <span className="text-slate-500">{g.role}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {loans.length > 0 && (
          <div className="card p-5">
            <h3 className="font-medium text-white mb-3">Loan History</h3>
            <div className="space-y-2">
              {loans.map((l) => (
                <div key={l.id} className="flex justify-between text-sm">
                  <span className="text-slate-300">{l.status}</span>
                  <span className="text-slate-400">₦{l.outstanding.toLocaleString()} / ₦{l.total.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {applications.length > 0 && (
          <div className="card p-5">
            <h3 className="font-medium text-white mb-3">Open Applications</h3>
            <div className="space-y-2">
              {applications.map((a) => (
                <button
                  key={a.id}
                  onClick={() => router.push(`/branch/applications/${a.id}`)}
                  className="w-full flex justify-between text-sm p-3 rounded-xl bg-slate-900/60 hover:bg-slate-800 transition-colors"
                >
                  <span className="text-slate-300">Stage {a.stage} · {a.status}</span>
                  <span className="text-sky-400">Continue →</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="card p-6">
          <h3 className="font-medium text-white mb-3">New Loan Application</h3>
          {customer.hasActiveLoan ? (
            <div className="flex items-center gap-2 text-amber-400 text-sm">
              <AlertTriangle className="w-4 h-4" />
              Customer has an active loan. New application is blocked.
            </div>
          ) : (
            <>
              {error && <p className="text-sm text-red-400 mb-3">{error}</p>}
              <button onClick={startLoanApplication} disabled={starting} className="btn-primary w-full">
                {starting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                Apply for Loan
              </button>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
