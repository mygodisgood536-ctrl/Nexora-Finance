"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Loader2, Check, AlertTriangle, Camera, FileText } from "lucide-react";
import { isTallyExact, calculateTotalContractual, formatNaira } from "@/lib/money";
import { generateSchedule } from "@/lib/schedule";
import { DisbursementConfirm } from "@/components/branch/DisbursementConfirm";
import { FaceCapture } from "@/components/branch/FaceCapture";
import { EvidenceCapture } from "@/components/branch/EvidenceCapture";

type Props = {
  application: {
    id: string; stage: number; status: string; repaymentMode: string | null;
    requestedAmount: number | null; interestPercentage: number | null;
    repaymentAmount: number | null; period: number | null; repaymentWeekday: string | null;
    loanPurpose: string | null; capturedData: string | null; cycle: number | null;
  };
  customer: {
    id: string; fullName: string; phone: string; gender: string; maritalStatus: string; address: string;
    financialProfile?: boolean;
    nextOfKinName: string; nextOfKinPhone: string; nextOfKinRelationship?: string; occupation: string; bvn: string; nin: string; bankAccount: string;
    houseAddress?: string; street?: string; directionToHouse?: string; childName?: string; localKnownAs?: string; shopAddress?: string;
    averageDailyIncome?: number; averageMonthlyIncome?: number; identificationType?: string;
    savingsBalance: number; groups: string[];
    previousLoans: Array<{ id: string; status: string; total: number; outstanding: number; activatedAt: string }>;
  };
  groupName: string;
};

const STAGES = [
  "Basic Application", "Additional Customer Information", "Guarantor Information",
  "Customer Face Capture", "Guarantor Face Capture", "Customer House Evidence",
  "Guarantor House Evidence", "Customer Business Evidence", "Guarantor Business Evidence",
  "Loan Form Capture", "Repayment Terms", "Final Preview",
];

export function LoanApplicationWizard({ application, customer, groupName }: Props) {
  const router = useRouter();
  const [stage, setStage] = useState(application.stage || 1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  let captured: any = {};
  try { captured = application.capturedData ? JSON.parse(application.capturedData) : {}; } catch { /* ignore */ }

  const [mode, setMode] = useState(application.repaymentMode || "WEEKLY");
  const [amount, setAmount] = useState(application.requestedAmount?.toString() || "");
  const [purpose, setPurpose] = useState(application.loanPurpose || "");
  const [cycle, setCycle] = useState(application.cycle?.toString() || "1");

  const [nokName, setNokName] = useState(customer.nextOfKinName || captured.stage2?.nextOfKinName || "");
  const [nokRel, setNokRel] = useState(customer.nextOfKinRelationship || captured.stage2?.nextOfKinRelationship || "");
  const [nokPhone, setNokPhone] = useState(customer.nextOfKinPhone || captured.stage2?.nextOfKinPhone || "");
  const [occupation, setOccupation] = useState(customer.occupation || "");
  const [houseAddress, setHouseAddress] = useState(customer.houseAddress || "");
  const [street, setStreet] = useState(customer.street || "");
  const [direction, setDirection] = useState(customer.directionToHouse || "");
  const [childName, setChildName] = useState(customer.childName || "");
  const [knownAs, setKnownAs] = useState(customer.localKnownAs || "");
  const [shopAddress, setShopAddress] = useState(customer.shopAddress || "");
  const [dailyIncome, setDailyIncome] = useState(customer.averageDailyIncome?.toString() || "");
  const [monthlyIncome, setMonthlyIncome] = useState(customer.averageMonthlyIncome?.toString() || "");
  const [idType, setIdType] = useState(customer.identificationType || "");
  const [bvn, setBvn] = useState(customer.bvn || "");
  const [nin, setNin] = useState(customer.nin || "");
  const [bankAccount, setBankAccount] = useState(customer.bankAccount || "");

  const [gName, setGName] = useState(captured.stage3?.guarantor?.name || "");
  const [gPhone, setGPhone] = useState(captured.stage3?.guarantor?.phone || "");
  const [gHome, setGHome] = useState(captured.stage3?.guarantor?.address || "");
  const [gShop, setGShop] = useState(captured.stage3?.guarantor?.shopAddress || "");
  const [gRelation, setGRelation] = useState(captured.stage3?.guarantor?.relation || "");

  const [interestPct, setInterestPct] = useState(application.interestPercentage?.toString() || "20");
  const [repayAmount, setRepayAmount] = useState(application.repaymentAmount?.toString() || "");
  const [period, setPeriod] = useState(application.period?.toString() || "");
  const [weekday, setWeekday] = useState(application.repaymentWeekday || "1");

  async function saveStage(nextStage: number, data: Record<string, any>) {
    setSaving(true); setError("");
    try {
      const res = await fetch(`/api/branch/applications/${application.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: nextStage, ...data }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error || "Save failed"); setSaving(false); return false; }
      setStage(nextStage); setSaving(false); return true;
    } catch { setError("Something went wrong"); setSaving(false); return false; }
  }

  async function saveFace(type: string, data: { imageDataUrl: string; quality: any }) {
    setSaving(true); setError("");
    try {
      const res = await fetch("/api/branch/captures", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId: application.id, type, imageData: data.imageDataUrl, quality: data.quality }),
      });
      if (!res.ok) { setError("Could not save face capture"); setSaving(false); return; }
      await saveStage(type === "CUSTOMER_FACE" ? 5 : 6, { [`${type}Saved`]: true });
    } catch { setError("Something went wrong"); setSaving(false); }
  }

  async function handleNext() {
    if (stage === 1) {
      if (!amount || Number(amount) <= 0) { setError("Enter a valid loan amount"); return; }
      await saveStage(2, { repaymentMode: mode, requestedAmount: Number(amount), loanPurpose: purpose, loanCycle: Number(cycle) });
    } else if (stage === 2) {
      await saveStage(3, {
        nextOfKinName: nokName, nextOfKinRelationship: nokRel, nextOfKinPhone: nokPhone, occupation,
        houseAddress, street, directionToHouse: direction, childName, localKnownAs: knownAs, shopAddress,
        averageDailyIncome: Number(dailyIncome) || 0, averageMonthlyIncome: Number(monthlyIncome) || 0,
        identificationType: idType, bvn, nin, bankAccount,
      });
    } else if (stage === 3) {
      if (!gName || !gPhone) { setError("Guarantor name and phone are required"); return; }
      await saveStage(4, { guarantor: { name: gName, phone: gPhone, address: gHome, shopAddress: gShop, relation: gRelation } });
    } else if (stage === 11) {
      const principal = Number(amount) || application.requestedAmount || 0;
      const interest = Number(interestPct);
      const repay = Number(repayAmount);
      const per = Number(period);
      if (!principal || !interest || !repay || !per) { setError("All repayment fields are required"); return; }
      if (!isTallyExact(principal, interest, repay, per)) { setError("NOT TALLY — Repayment Amount × Period must equal Principal + Interest"); return; }
      await saveStage(12, { interestPercentage: interest, repaymentAmount: repay, period: per, repaymentWeekday: mode === "WEEKLY" ? weekday : null });
    } else if (stage === 12) {
      setSaving(true);
      try {
        const res = await fetch(`/api/branch/applications/${application.id}`, {
          method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "submit" }),
        });
        if (res.ok) router.push("/branch");
        else { const data = await res.json(); setError(data.error || "Submit failed"); }
      } catch { setError("Something went wrong"); }
      finally { setSaving(false); }
    }
  }

  if (application.status === "AWAITING_DISBURSEMENT_CONFIRMATION") {
    return (
      <div className="min-h-screen bg-slate-50">
        <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-slate-50/80 backdrop-blur-xl">
          <div className="max-w-2xl mx-auto px-4 h-16 flex items-center gap-4">
            <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"><ArrowLeft className="w-5 h-5" /></button>
            <div><h1 className="text-lg font-semibold text-slate-900">Confirm Disbursement</h1><p className="text-xs text-slate-500">{customer.fullName}</p></div>
          </div>
        </header>
        <main className="max-w-2xl mx-auto px-4 py-8">
          <DisbursementConfirm applicationId={application.id} customerName={customer.fullName} amount={application.requestedAmount || 0} />
        </main>
      </div>
    );
  }

  const principal = Number(amount) || application.requestedAmount || 0;
  const interest = Number(interestPct) || 0;
  const total = principal && interest ? calculateTotalContractual(principal, interest) : 0;
  const tallyOk = principal && interest && repayAmount && period ? isTallyExact(principal, interest, Number(repayAmount), Number(period)) : null;
  const schedule = tallyOk && period && interestPct && (application.repaymentMode || mode)
    ? generateSchedule({ principal, interestPercentage: interest, repaymentAmount: Number(repayAmount), period: Number(period), mode: (application.repaymentMode || mode) as any, weekday: Number(weekday), disbursementDate: new Date() })
    : [];

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-slate-50/80 backdrop-blur-xl">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"><ArrowLeft className="w-5 h-5" /></button>
          <div className="flex-1 min-w-0"><h1 className="text-lg font-semibold text-slate-900 truncate">Loan Application</h1><p className="text-xs text-slate-500">{customer.fullName} · Stage {stage} of 12</p></div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 pt-4">
        <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden"><div className="h-full bg-sky-500 transition-all duration-300" style={{ width: `${(stage / 12) * 100}%` }} /></div>
        <p className="text-xs text-slate-500 mt-2">{STAGES[stage - 1]}</p>
      </div>

      <main className="max-w-2xl mx-auto px-4 py-6">
        <div className="card p-6">
          {stage === 1 && (
            <div className="space-y-4">
              <div><label className="label">Repayment Mode</label><div className="flex gap-3">{["WEEKLY", "DAILY"].map((m) => (
                <button key={m} type="button" onClick={() => setMode(m)} className={`flex-1 py-3 rounded-xl border text-sm font-medium ${mode === m ? "border-sky-500 bg-sky-50 text-sky-700" : "border-slate-200 text-slate-500"}`}>{m}</button>
              ))}</div></div>
              <div><label className="label">Requested Loan Amount (₦)</label><input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="input" required /></div>
              <div><label className="label">Requested Loan Cycle</label><input type="number" min="1" value={cycle} onChange={(e) => setCycle(e.target.value)} className="input" /></div>
              <div><label className="label">Loan Purpose</label><input value={purpose} onChange={(e) => setPurpose(e.target.value)} className="input" /></div>
              <p className="text-[11px] text-slate-400">All stage data is saved explicitly and can be resumed later.</p>
            </div>
          )}

          {stage === 2 && (
            <div className="space-y-4">
              <p className="text-sm text-slate-500">Information already on the customer profile is pre-filled. Update only what is needed.</p>
              <div className="grid sm:grid-cols-2 gap-3">
                <div><label className="label">Next of Kin Name</label><input value={nokName} onChange={(e) => setNokName(e.target.value)} className="input" /></div>
                <div><label className="label">Next of Kin Relationship</label><input value={nokRel} onChange={(e) => setNokRel(e.target.value)} className="input" /></div>
                <div><label className="label">Next of Kin Phone</label><input value={nokPhone} onChange={(e) => setNokPhone(e.target.value)} className="input" /></div>
                <div><label className="label">Occupation</label><input value={occupation} onChange={(e) => setOccupation(e.target.value)} className="input" /></div>
                <div><label className="label">House Address</label><input value={houseAddress} onChange={(e) => setHouseAddress(e.target.value)} className="input" /></div>
                <div><label className="label">Street</label><input value={street} onChange={(e) => setStreet(e.target.value)} className="input" /></div>
                <div><label className="label">Direction to House</label><input value={direction} onChange={(e) => setDirection(e.target.value)} className="input" /></div>
                <div><label className="label">Child Name (if applicable)</label><input value={childName} onChange={(e) => setChildName(e.target.value)} className="input" /></div>
                <div><label className="label">Local / Area Known As</label><input value={knownAs} onChange={(e) => setKnownAs(e.target.value)} className="input" /></div>
                <div><label className="label">Shop Address</label><input value={shopAddress} onChange={(e) => setShopAddress(e.target.value)} className="input" /></div>
                <div><label className="label">Average Daily Income</label><input type="number" value={dailyIncome} onChange={(e) => setDailyIncome(e.target.value)} className="input" /></div>
                <div><label className="label">Average Monthly Income</label><input type="number" value={monthlyIncome} onChange={(e) => setMonthlyIncome(e.target.value)} className="input" /></div>
                <div><label className="label">Identification Type</label><input value={idType} onChange={(e) => setIdType(e.target.value)} className="input" placeholder="BVN / NIN / Voters card / ..." /></div>
                <div><label className="label">BVN</label><input value={bvn} onChange={(e) => setBvn(e.target.value)} className="input" /></div>
                <div><label className="label">NIN</label><input value={nin} onChange={(e) => setNin(e.target.value)} className="input" /></div>
                <div><label className="label">Bank Account</label><input value={bankAccount} onChange={(e) => setBankAccount(e.target.value)} className="input" /></div>
              </div>
            </div>
          )}

          {stage === 3 && (
            <div className="space-y-4">
              <div><label className="label">Guarantor Full Name</label><input value={gName} onChange={(e) => setGName(e.target.value)} className="input" required /></div>
              <div><label className="label">Guarantor Phone</label><input value={gPhone} onChange={(e) => setGPhone(e.target.value)} className="input" required /></div>
              <div><label className="label">Home Address</label><input value={gHome} onChange={(e) => setGHome(e.target.value)} className="input" /></div>
              <div><label className="label">Shop Address</label><input value={gShop} onChange={(e) => setGShop(e.target.value)} className="input" /></div>
              <div><label className="label">Relationship with Customer</label><input value={gRelation} onChange={(e) => setGRelation(e.target.value)} className="input" /></div>
              <p className="text-[11px] text-slate-400">Guarantor information is kept separate from the customer's records.</p>
            </div>
          )}

          {stage === 4 && <FaceCapture label="Customer Live Face Capture" onCaptured={(d) => saveFace("CUSTOMER_FACE", d)} />}
          {stage === 5 && <FaceCapture label="Guarantor Live Face Capture" onCaptured={(d) => saveFace("GUARANTOR_FACE", d)} />}
          {stage === 6 && <EvidenceCapture title="Customer House Evidence" description="Optional, zero or more captures." applicationId={application.id} captureType="CUSTOMER_HOUSE" onSave={(c) => saveStage(7, { customerHouseCount: c.length })} onSkip={() => saveStage(7, { skipped: true })} />}
          {stage === 7 && <EvidenceCapture title="Guarantor House Evidence" description="Optional, zero or more captures." applicationId={application.id} captureType="GUARANTOR_HOUSE" onSave={(c) => saveStage(8, { guarantorHouseCount: c.length })} onSkip={() => saveStage(8, { skipped: true })} />}
          {stage === 8 && <EvidenceCapture title="Customer Business Evidence" description="Optional, zero or more captures." applicationId={application.id} captureType="CUSTOMER_BUSINESS" onSave={(c) => saveStage(9, { customerBusinessCount: c.length })} onSkip={() => saveStage(9, { skipped: true })} />}
          {stage === 9 && <EvidenceCapture title="Guarantor Business Evidence" description="Optional, zero or more captures." applicationId={application.id} captureType="GUARANTOR_BUSINESS" onSave={(c) => saveStage(10, { guarantorBusinessCount: c.length })} onSkip={() => saveStage(10, { skipped: true })} />}
          {stage === 10 && <EvidenceCapture title="Loan Form Pages" description="Optional. Each page is saved separately with Add Capture; later pages never replace earlier ones." applicationId={application.id} captureType="LOAN_FORM" onSave={(c) => saveStage(11, { formPages: c.length })} onSkip={() => saveStage(11, { skipped: true })} />}

          {stage === 11 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Interest %</label><input type="number" value={interestPct} onChange={(e) => setInterestPct(e.target.value)} className="input" /></div>
                <div><label className="label">Period ({mode === "WEEKLY" ? "weeks" : "days"})</label><input type="number" value={period} onChange={(e) => setPeriod(e.target.value)} className="input" /></div>
              </div>
              <div><label className="label">Repayment Amount per {mode === "WEEKLY" ? "Week" : "Day"} (₦)</label><input type="number" value={repayAmount} onChange={(e) => setRepayAmount(e.target.value)} className="input" /></div>
              {mode === "WEEKLY" && <div><label className="label">Repayment Weekday</label><select value={weekday} onChange={(e) => setWeekday(e.target.value)} className="input">
                <option value="1">Monday</option><option value="2">Tuesday</option><option value="3">Wednesday</option><option value="4">Thursday</option><option value="5">Friday</option>
              </select></div>}
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 text-sm space-y-1">
                <p className="text-slate-500">Principal: <span className="text-slate-900">{formatNaira(principal)}</span></p>
                <p className="text-slate-500">Interest: <span className="text-slate-900">{formatNaira(total - principal)}</span></p>
                <p className="text-slate-500">Total Contractual: <span className="font-medium text-slate-900">{formatNaira(total)}</span></p>
                {tallyOk !== null && <p className={tallyOk ? "text-emerald-600 flex items-center gap-1.5 mt-2" : "text-red-600 flex items-center gap-1.5 mt-2"}>{tallyOk ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}{tallyOk ? "TALLY OK" : "NOT TALLY"}</p>}
              </div>
              {schedule.length > 0 && (
                <div className="rounded-xl border border-slate-200 p-4">
                  <p className="text-sm font-medium text-slate-800 mb-3">Repayment schedule ({schedule.length} instalments)</p>
                  <div className="max-h-48 overflow-y-auto"><table className="w-full text-xs"><thead><tr className="text-left text-slate-400"><th className="py-1">#</th><th className="py-1">Due date</th><th className="py-1 text-right">Principal</th><th className="py-1 text-right">Interest</th><th className="py-1 text-right">Total</th></tr></thead><tbody>
                    {schedule.map((r, i) => <tr key={i} className="border-t border-slate-100"><td className="py-1 text-slate-500">{i + 1}</td><td className="py-1 text-slate-600">{r.dueDate.toLocaleDateString()}</td><td className="py-1 text-right text-slate-600">{formatNaira(r.principalDue)}</td><td className="py-1 text-right text-slate-600">{formatNaira(r.interestDue)}</td><td className="py-1 text-right font-medium text-slate-800">{formatNaira(r.totalDue)}</td></tr>)}
                  </tbody></table></div>
                </div>
              )}
            </div>
          )}

          {stage === 12 && (
            <div className="space-y-3 text-sm">
              <h3 className="font-semibold text-slate-900 text-base mb-3">Final Preview — review before submission</h3>
              <div className="rounded-xl bg-slate-50 border border-slate-100 p-4 space-y-2">
                <p className="font-medium text-slate-700">Customer</p>
                <Row k="Name" v={customer.fullName} /><Row k="Phone" v={customer.phone} /><Row k="Group" v={groupName} /><Row k="Groups" v={customer.groups.join(", ") || "—"} /><Row k="Loan cycle" v={cycle} /><Row k="Savings balance" v={formatNaira(customer.savingsBalance)} />
              </div>
              <div className="rounded-xl bg-slate-50 border border-slate-100 p-4 space-y-2">
                <p className="font-medium text-slate-700">Guarantor</p>
                <Row k="Name" v={gName || "—"} /><Row k="Phone" v={gPhone || "—"} /><Row k="Home" v={gHome || "—"} /><Row k="Shop" v={gShop || "—"} /><Row k="Relationship" v={gRelation || "—"} />
              </div>
              <div className="rounded-xl bg-slate-50 border border-slate-100 p-4 space-y-2">
                <p className="font-medium text-slate-700">Loan &amp; repayment</p>
                <Row k="Mode" v={mode} /><Row k="Amount" v={formatNaira(principal)} /><Row k="Interest" v={`${interest}% (${formatNaira(total - principal)})`} /><Row k="Total contractual" v={formatNaira(total)} /><Row k="Period" v={`${period} ${mode === "WEEKLY" ? "weeks" : "days"}`} />
                <Row k="Bank account" v={bankAccount || "—"} /><Row k="ID type" v={idType || "—"} /><Row k="BVN / NIN" v={`${bvn || "—"} / ${nin || "—"}`} />
                {schedule.length > 0 && <p className="text-xs text-slate-500 pt-1">Schedule: {schedule.length} instalments, first due {schedule[0].dueDate.toLocaleDateString()}.</p>}
              </div>
              <div className="rounded-xl bg-slate-50 border border-slate-100 p-4 space-y-2">
                <p className="font-medium text-slate-700">Evidence &amp; captures</p>
                <Row k="Customer face" v={captured.stage4 ? "Saved" : "Not captured"} /><Row k="Guarantor face" v={captured.stage5 ? "Saved" : "Not captured"} />
                <Row k="House / business evidence" v={`${captured.stage6?.customerHouseCount || 0} / ${captured.stage7?.guarantorHouseCount || 0} / ${captured.stage8?.customerBusinessCount || 0} / ${captured.stage9?.guarantorBusinessCount || 0}`} />
                <Row k="Loan form pages" v={String(captured.stage10?.formPages || 0)} />
              </div>
              <div className="rounded-xl bg-slate-50 border border-slate-100 p-4 space-y-2">
                <p className="font-medium text-slate-700">Previous loan history</p>
                {customer.previousLoans.length === 0 ? <p className="text-xs text-slate-500">No previous loans.</p> : customer.previousLoans.map((l) => <Row key={l.id} k={`${l.status} · ${new Date(l.activatedAt).toLocaleDateString()}`} v={formatNaira(l.total)} />)}
              </div>
              <p className="text-xs text-slate-500 pt-2">After submission the company disburses externally. You will confirm disbursement in Nexora to activate the loan. No branch approval stage exists.</p>
            </div>
          )}

          {error && <div className="mt-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3 flex items-start gap-2"><AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />{error}</div>}

          {stage !== 4 && stage !== 5 && stage !== 6 && stage !== 7 && stage !== 8 && stage !== 9 && stage !== 10 && (
            <div className="flex gap-3 mt-6">
              {stage > 1 && <button type="button" onClick={() => setStage(stage - 1)} className="btn-secondary flex-1" disabled={saving}>Back</button>}
              <button type="button" onClick={handleNext} disabled={saving} className="btn-primary flex-1">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : stage === 12 ? "Submit Application" : <>Save &amp; Next <ArrowRight className="w-4 h-4" /></>}
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return <div className="flex justify-between gap-3"><span className="text-slate-500">{k}</span><span className="text-slate-800 text-right">{v}</span></div>;
}
