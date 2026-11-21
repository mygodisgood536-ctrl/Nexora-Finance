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
    readOnly?: boolean;
  };
  groups: Array<{ id: string; name: string; role: string }>;
  loans: Array<{ id: string; status: string; outstanding: number; total: number; activatedAt: string; virtualAccountStatus: string; scheduleRows: Array<{ id: string; dueDate: string; totalDue: number; status: string }> }>;
  applications: Array<{ id: string; stage: number; status: string; amount: number; mode: string; updatedAt: string }>;
  collections: Array<{ id: string; loan: number; savings: number; at: string; status: string }>;
  readOnly?: boolean;
};

export function CustomerDetail({ customer, groups, loans, applications, collections, readOnly = false }: Props) {
  const router = useRouter();
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");

  async function changeStatus(status: string) {
    const res = await fetch("/api/branch/customer-status", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customerId: customer.id, status }),
    });
    if (res.ok) router.refresh();
    else setError("Could not update customer status");
  }

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
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-slate-50/80 backdrop-blur-xl">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-slate-900">{customer.fullName}</h1>
            <p className="text-xs text-slate-500">{customer.phone}</p>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <div className="card p-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-slate-500 text-xs">Gender</p>
              <p className="text-slate-900">{customer.gender || "—"}</p>
            </div>
            <div>
              <p className="text-slate-500 text-xs">Marital Status</p>
              <p className="text-slate-900">{customer.maritalStatus || "—"}</p>
            </div>
            <div className="col-span-2">
              <p className="text-slate-500 text-xs">Address</p>
              <p className="text-slate-900">{customer.address || "—"}</p>
            </div>
            <div>
              <p className="text-slate-500 text-xs">Savings Balance</p>
              <p className="text-slate-900 font-medium">₦{customer.savingsBalance.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-slate-500 text-xs">Status</p>
              <p className="text-slate-900">{customer.status}</p>
              {!readOnly && (
                <div className="flex gap-1.5 mt-2">
                  {customer.status !== "CLOSED" && <button onClick={() => changeStatus("CLOSED")} className="text-[10px] px-2 py-1 rounded bg-red-50 text-red-600">Close</button>}
                  {customer.status === "CLOSED" && <button onClick={() => changeStatus("REOPENED")} className="text-[10px] px-2 py-1 rounded bg-emerald-50 text-emerald-600">Reopen</button>}
                  {customer.status === "REOPENED" && <button onClick={() => changeStatus("ACTIVE")} className="text-[10px] px-2 py-1 rounded bg-slate-100 text-slate-600">Set active</button>}
                </div>
              )}
            </div>
          </div>
        </div>

        {groups.length > 0 && (
          <div className="card p-5">
            <h3 className="font-medium text-slate-900 mb-3">Groups</h3>
            <div className="space-y-2">
              {groups.map((g) => (
                <div key={g.id} className="flex justify-between text-sm">
                  <span className="text-slate-600">{g.name}</span>
                  <span className="text-slate-500">{g.role}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {loans.length > 0 && (
          <div className="card p-5">
            <h3 className="font-medium text-slate-900 mb-3">Loan History &amp; Repayment Schedules</h3>
            <div className="space-y-4">
              {loans.map((l) => (
                <div key={l.id} className="rounded-xl border border-slate-100 p-3">
                  <div className="flex justify-between text-sm items-center flex-wrap gap-2">
                    <span className="font-medium text-slate-800">₦{l.outstanding.toLocaleString()} outstanding / ₦{l.total.toLocaleString()} total · {l.status}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${l.virtualAccountStatus === "CREATED" ? "bg-emerald-50 text-emerald-600" : l.virtualAccountStatus === "FAILED" ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-600"}`}>VA {l.virtualAccountStatus}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">Activated {new Date(l.activatedAt).toLocaleDateString()}</p>
                  {l.scheduleRows.length > 0 && (
                    <div className="mt-3 max-h-40 overflow-y-auto">
                      <table className="w-full text-xs"><thead><tr className="text-left text-slate-400"><th className="py-1">Due</th><th className="py-1 text-right">Amount</th><th className="py-1 text-right">Status</th></tr></thead><tbody>
                        {l.scheduleRows.map((r) => <tr key={r.id} className="border-t border-slate-50"><td className="py-1 text-slate-600">{new Date(r.dueDate).toLocaleDateString()}</td><td className="py-1 text-right text-slate-600">₦{r.totalDue.toLocaleString()}</td><td className="py-1 text-right text-slate-500">{r.status}</td></tr>)}
                      </tbody></table>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {collections.length > 0 && (
          <div className="card p-5">
            <h3 className="font-medium text-slate-900 mb-3">Collections &amp; Allocation History</h3>
            <div className="overflow-x-auto"><table className="w-full text-xs"><thead><tr className="text-left text-slate-400"><th className="py-1">Date</th><th className="py-1 text-right">Loan</th><th className="py-1 text-right">Savings</th><th className="py-1 text-right">Status</th></tr></thead><tbody>
              {collections.map((a) => <tr key={a.id} className="border-t border-slate-50"><td className="py-1 text-slate-600">{new Date(a.at).toLocaleString()}</td><td className="py-1 text-right text-slate-600">₦{a.loan.toLocaleString()}</td><td className="py-1 text-right text-slate-600">₦{a.savings.toLocaleString()}</td><td className="py-1 text-right text-slate-500">{a.status}</td></tr>)}
            </tbody></table></div>
          </div>
        )}

        {applications.length > 0 && (
          <div className="card p-5">
            <h3 className="font-medium text-slate-900 mb-3">Open Applications</h3>
            <div className="space-y-2">
              {applications.map((a) => (
                <button
                  key={a.id}
                  onClick={() => router.push(`/branch/applications/${a.id}`)}
                  className="w-full flex justify-between text-sm p-3 rounded-xl bg-slate-100 hover:bg-slate-100 transition-colors"
                >
                  <span className="text-slate-600">Stage {a.stage} · {a.status}</span>
                  <span className="text-sky-400">Continue →</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="card p-6">
          <h3 className="font-medium text-slate-900 mb-3">New Loan Application</h3>
          {readOnly ? (
            <p className="text-sm text-amber-600">Inspection only — you cannot start applications on another officer's portfolio.</p>
          ) : customer.hasActiveLoan ? (
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
