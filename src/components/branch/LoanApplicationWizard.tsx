"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Loader2, Check, AlertTriangle } from "lucide-react";
import { isTallyExact, calculateTotalContractual, formatNaira } from "@/lib/money";
import { DisbursementConfirm } from "@/components/branch/DisbursementConfirm";
import { FaceCapture } from "@/components/branch/FaceCapture";
import { EvidenceCapture } from "@/components/branch/EvidenceCapture";

type Props = {
  application: {
    id: string;
    stage: number;
    status: string;
    repaymentMode: string | null;
    requestedAmount: number | null;
    interestPercentage: number | null;
    repaymentAmount: number | null;
    period: number | null;
    repaymentWeekday: string | null;
    loanPurpose: string | null;
    capturedData: string | null;
  };
  customer: {
    id: string;
    fullName: string;
    phone: string | null;
    gender: string | null;
    maritalStatus: string | null;
    address: string | null;
    nextOfKinName: string | null;
    nextOfKinPhone: string | null;
    occupation: string | null;
    bvn: string | null;
    nin: string | null;
    bankAccount: string | null;
  };
};

const STAGES = [
  "Basic Application",
  "Additional Customer Info",
  "Guarantor Information",
  "Customer Face Capture",
  "Guarantor Face Capture",
  "Customer House Evidence",
  "Guarantor House Evidence",
  "Customer Business Evidence",
  "Guarantor Business Evidence",
  "Loan Form Capture",
  "Repayment Terms",
  "Final Preview",
];

export function LoanApplicationWizard({ application, customer }: Props) {
  const router = useRouter();
  const [stage, setStage] = useState(application.stage || 1);

  if (application.status === "AWAITING_DISBURSEMENT_CONFIRMATION") {
    return (
      <div className="min-h-screen bg-slate-950">
        <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
          <div className="max-w-2xl mx-auto px-4 h-16 flex items-center gap-4">
            <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-slate-800 text-slate-400">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-white">Confirm Disbursement</h1>
              <p className="text-xs text-slate-500">{customer.fullName}</p>
            </div>
          </div>
        </header>
        <main className="max-w-2xl mx-auto px-4 py-8">
          <DisbursementConfirm
            applicationId={application.id}
            customerName={customer.fullName}
            amount={application.requestedAmount || 0}
          />
        </main>
      </div>
    );
  }

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Stage 1
  const [mode, setMode] = useState(application.repaymentMode || "WEEKLY");
  const [amount, setAmount] = useState(application.requestedAmount?.toString() || "");
  const [purpose, setPurpose] = useState(application.loanPurpose || "");

  // Stage 2
  const [nextOfKinName, setNextOfKinName] = useState(customer.nextOfKinName || "");
  const [nextOfKinPhone, setNextOfKinPhone] = useState(customer.nextOfKinPhone || "");
  const [occupation, setOccupation] = useState(customer.occupation || "");
  const [bvn, setBvn] = useState(customer.bvn || "");
  const [nin, setNin] = useState(customer.nin || "");
  const [bankAccount, setBankAccount] = useState(customer.bankAccount || "");

  // Stage 3
  const [guarantorName, setGuarantorName] = useState("");
  const [guarantorPhone, setGuarantorPhone] = useState("");
  const [guarantorAddress, setGuarantorAddress] = useState("");
  const [guarantorRelation, setGuarantorRelation] = useState("");

  // Stage 11
  const [interestPct, setInterestPct] = useState(application.interestPercentage?.toString() || "20");
  const [repayAmount, setRepayAmount] = useState(application.repaymentAmount?.toString() || "");
  const [period, setPeriod] = useState(application.period?.toString() || "");
  const [weekday, setWeekday] = useState(application.repaymentWeekday || "1");

  async function saveStage(nextStage: number, data: Record<string, any>) {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/branch/applications/${application.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: nextStage, ...data }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Save failed");
        setSaving(false);
        return false;
      }
      setStage(nextStage);
      setSaving(false);
      return true;
    } catch {
      setError("Something went wrong");
      setSaving(false);
      return false;
    }
  }

  async function handleNext() {
    if (stage === 1) {
      if (!amount || Number(amount) <= 0) {
        setError("Enter a valid loan amount");
        return;
      }
      await saveStage(2, {
        repaymentMode: mode,
        requestedAmount: Number(amount),
        loanPurpose: purpose,
      });
    } else if (stage === 2) {
      await saveStage(3, {
        nextOfKinName,
        nextOfKinPhone,
        occupation,
        bvn,
        nin,
        bankAccount,
      });
    } else if (stage === 3) {
      if (!guarantorName || !guarantorPhone) {
        setError("Guarantor name and phone are required");
        return;
      }
      await saveStage(4, {
        guarantor: { name: guarantorName, phone: guarantorPhone, address: guarantorAddress, relation: guarantorRelation },
      });
    } else if (stage >= 4 && stage <= 10) {
      // Evidence stages are optional (zero or more). Skip for now with note.
      await saveStage(stage + 1, { skippedEvidence: true });
    } else if (stage === 11) {
      const principal = Number(amount) || application.requestedAmount || 0;
      const interest = Number(interestPct);
      const repay = Number(repayAmount);
      const per = Number(period);
      if (!principal || !interest || !repay || !per) {
        setError("All repayment fields are required");
        return;
      }
      if (!isTallyExact(principal, interest, repay, per)) {
        setError("NOT TALLY — Repayment Amount × Period must equal Principal + Interest");
        return;
      }
      await saveStage(12, {
        interestPercentage: interest,
        repaymentAmount: repay,
        period: per,
        repaymentWeekday: mode === "WEEKLY" ? weekday : null,
      });
    } else if (stage === 12) {
      // Submit
      setSaving(true);
      try {
        const res = await fetch(`/api/branch/applications/${application.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "submit" }),
        });
        if (res.ok) {
          router.push("/branch");
        } else {
          const data = await res.json();
          setError(data.error || "Submit failed");
        }
      } catch {
        setError("Something went wrong");
      } finally {
        setSaving(false);
      }
    }
  }

  const principal = Number(amount) || application.requestedAmount || 0;
  const interest = Number(interestPct) || 0;
  const total = principal && interest ? calculateTotalContractual(principal, interest) : 0;
  const tallyOk = principal && interest && repayAmount && period
    ? isTallyExact(principal, interest, Number(repayAmount), Number(period))
    : null;

  return (
    <div className="min-h-screen bg-slate-950">
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-slate-800 text-slate-400">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-semibold text-white truncate">Loan Application</h1>
            <p className="text-xs text-slate-500">{customer.fullName} · Stage {stage} of 12</p>
          </div>
        </div>
      </header>

      {/* Progress */}
      <div className="max-w-2xl mx-auto px-4 pt-4">
        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-sky-500 transition-all duration-300" style={{ width: `${(stage / 12) * 100}%` }} />
        </div>
        <p className="text-xs text-slate-500 mt-2">{STAGES[stage - 1]}</p>
      </div>

      <main className="max-w-2xl mx-auto px-4 py-6">
        <div className="card p-6">
          {stage === 1 && (
            <div className="space-y-4">
              <div>
                <label className="label">Repayment Mode</label>
                <div className="flex gap-3">
                  {["WEEKLY", "DAILY"].map((m) => (
                    <button key={m} type="button" onClick={() => setMode(m)} className={`flex-1 py-3 rounded-xl border text-sm font-medium transition-colors ${mode === m ? "border-sky-500/50 bg-sky-500/10 text-sky-300" : "border-slate-700 text-slate-400"}`}>
                      {m}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="label">Requested Loan Amount (₦)</label>
                <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="input" placeholder="100000" required />
              </div>
              <div>
                <label className="label">Loan Purpose</label>
                <input value={purpose} onChange={(e) => setPurpose(e.target.value)} className="input" placeholder="e.g. Business capital" />
              </div>
            </div>
          )}

          {stage === 2 && (
            <div className="space-y-4">
              <p className="text-sm text-slate-400 mb-2">Additional information (reuses existing profile data where available)</p>
              <div>
                <label className="label">Next of Kin Name</label>
                <input value={nextOfKinName} onChange={(e) => setNextOfKinName(e.target.value)} className="input" />
              </div>
              <div>
                <label className="label">Next of Kin Phone</label>
                <input value={nextOfKinPhone} onChange={(e) => setNextOfKinPhone(e.target.value)} className="input" />
              </div>
              <div>
                <label className="label">Occupation</label>
                <input value={occupation} onChange={(e) => setOccupation(e.target.value)} className="input" />
              </div>
              <div>
                <label className="label">BVN</label>
                <input value={bvn} onChange={(e) => setBvn(e.target.value)} className="input" />
              </div>
              <div>
                <label className="label">NIN</label>
                <input value={nin} onChange={(e) => setNin(e.target.value)} className="input" />
              </div>
              <div>
                <label className="label">Bank Account</label>
                <input value={bankAccount} onChange={(e) => setBankAccount(e.target.value)} className="input" />
              </div>
            </div>
          )}

          {stage === 3 && (
            <div className="space-y-4">
              <div>
                <label className="label">Guarantor Full Name</label>
                <input value={guarantorName} onChange={(e) => setGuarantorName(e.target.value)} className="input" required />
              </div>
              <div>
                <label className="label">Guarantor Phone</label>
                <input value={guarantorPhone} onChange={(e) => setGuarantorPhone(e.target.value)} className="input" required />
              </div>
              <div>
                <label className="label">Home Address</label>
                <input value={guarantorAddress} onChange={(e) => setGuarantorAddress(e.target.value)} className="input" />
              </div>
              <div>
                <label className="label">Relationship with Customer</label>
                <input value={guarantorRelation} onChange={(e) => setGuarantorRelation(e.target.value)} className="input" />
              </div>
            </div>
          )}

          {stage === 4 && (
            <FaceCapture
              label="Customer Live Face Capture"
              onCaptured={() => saveStage(5, { customerFace: true })}
            />
          )}

          {stage === 5 && (
            <FaceCapture
              label="Guarantor Live Face Capture"
              onCaptured={() => saveStage(6, { guarantorFace: true })}
            />
          )}

          {stage === 6 && (
            <EvidenceCapture
              title="Customer House Evidence"
              description="Optional. Capture zero or more photos of the customer house."
              onSave={(c) => saveStage(7, { customerHouse: c.length })}
              onSkip={() => saveStage(7, { skipped: true })}
            />
          )}
          {stage === 7 && (
            <EvidenceCapture
              title="Guarantor House Evidence"
              description="Optional. Capture zero or more photos of the guarantor house."
              onSave={(c) => saveStage(8, { guarantorHouse: c.length })}
              onSkip={() => saveStage(8, { skipped: true })}
            />
          )}
          {stage === 8 && (
            <EvidenceCapture
              title="Customer Business Evidence"
              description="Optional. Capture zero or more photos of the customer business/shop."
              onSave={(c) => saveStage(9, { customerBusiness: c.length })}
              onSkip={() => saveStage(9, { skipped: true })}
            />
          )}
          {stage === 9 && (
            <EvidenceCapture
              title="Guarantor Business Evidence"
              description="Optional. Capture zero or more photos of the guarantor business/shop."
              onSave={(c) => saveStage(10, { guarantorBusiness: c.length })}
              onSkip={() => saveStage(10, { skipped: true })}
            />
          )}
          {stage === 10 && (
            <EvidenceCapture
              title="Loan Form Pages"
              description="Optional. Capture each page of the loan form. Pages are saved individually."
              onSave={(c) => saveStage(11, { formPages: c.length })}
              onSkip={() => saveStage(11, { skipped: true })}
            />
          )}

          {stage === 11 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Interest %</label>
                  <input type="number" value={interestPct} onChange={(e) => setInterestPct(e.target.value)} className="input" />
                </div>
                <div>
                  <label className="label">Period ({mode === "WEEKLY" ? "weeks" : "days"})</label>
                  <input type="number" value={period} onChange={(e) => setPeriod(e.target.value)} className="input" />
                </div>
              </div>
              <div>
                <label className="label">Repayment Amount per {mode === "WEEKLY" ? "Week" : "Day"} (₦)</label>
                <input type="number" value={repayAmount} onChange={(e) => setRepayAmount(e.target.value)} className="input" />
              </div>
              {mode === "WEEKLY" && (
                <div>
                  <label className="label">Repayment Weekday</label>
                  <select value={weekday} onChange={(e) => setWeekday(e.target.value)} className="input">
                    <option value="1">Monday</option>
                    <option value="2">Tuesday</option>
                    <option value="3">Wednesday</option>
                    <option value="4">Thursday</option>
                    <option value="5">Friday</option>
                  </select>
                </div>
              )}
              {principal > 0 && interest > 0 && (
                <div className="rounded-xl bg-slate-900/80 border border-slate-700 p-4 text-sm space-y-1">
                  <p className="text-slate-400">Principal: <span className="text-white">{formatNaira(principal)}</span></p>
                  <p className="text-slate-400">Interest: <span className="text-white">{formatNaira(calculateTotalContractual(principal, interest) - principal)}</span></p>
                  <p className="text-slate-400">Total Contractual: <span className="text-white font-medium">{formatNaira(total)}</span></p>
                  {tallyOk !== null && (
                    <p className={tallyOk ? "text-emerald-400 flex items-center gap-1.5 mt-2" : "text-red-400 flex items-center gap-1.5 mt-2"}>
                      {tallyOk ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                      {tallyOk ? "TALLY OK" : "NOT TALLY"}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {stage === 12 && (
            <div className="space-y-3 text-sm">
              <h3 className="font-medium text-white text-base mb-3">Final Preview</h3>
              <div className="flex justify-between"><span className="text-slate-400">Customer</span><span className="text-white">{customer.fullName}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Mode</span><span className="text-white">{mode}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Amount</span><span className="text-white">{formatNaira(principal)}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Interest</span><span className="text-white">{interestPct}%</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Total Contractual</span><span className="text-white font-medium">{formatNaira(total)}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Period</span><span className="text-white">{period} {mode === "WEEKLY" ? "weeks" : "days"}</span></div>
              <p className="text-xs text-slate-500 pt-3">After submission the company disburses externally. You will confirm disbursement in Nexora to activate the loan.</p>
            </div>
          )}

          {error && (
            <div className="mt-4 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          <div className="flex gap-3 mt-6">
            {stage > 1 && (
              <button type="button" onClick={() => setStage(stage - 1)} className="btn-secondary flex-1" disabled={saving}>
                Back
              </button>
            )}
            <button type="button" onClick={handleNext} disabled={saving} className="btn-primary flex-1">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : stage === 12 ? "Submit Application" : <>Next <ArrowRight className="w-4 h-4" /></>}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
