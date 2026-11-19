"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, FileText, Clock } from "lucide-react";
import { formatNaira } from "@/lib/money";

type App = {
  id: string;
  customerName: string;
  phone: string;
  stage: number;
  status: string;
  amount: number;
  mode: string;
  updatedAt: string;
};

export function ApplicationsList({ applications }: { applications: App[] }) {
  const router = useRouter();

  const statusColor = (s: string) => {
    if (s === "DRAFT") return "text-slate-500 bg-slate-800";
    if (s === "AWAITING_DISBURSEMENT_CONFIRMATION") return "text-amber-400 bg-amber-500/15";
    if (s === "COMPLETED") return "text-emerald-400 bg-emerald-500/15";
    return "text-sky-400 bg-sky-500/15";
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-slate-50/80 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center gap-4">
          <button onClick={() => router.push("/branch")} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold text-slate-900">Loan Applications</h1>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {applications.length === 0 ? (
          <div className="card p-16 text-center">
            <FileText className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-slate-900 mb-2">No applications yet</h2>
            <p className="text-sm text-slate-500">Start a loan application from a customer profile.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {applications.map((a, i) => (
              <motion.button
                key={a.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => router.push(`/branch/applications/${a.id}`)}
                className="card p-4 w-full text-left hover:border-slate-200 transition-colors flex items-center justify-between"
              >
                <div>
                  <p className="font-medium text-slate-900">{a.customerName}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {a.mode} · {formatNaira(a.amount)} · Stage {a.stage}/12
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${statusColor(a.status)}`}>
                    {a.status.replace(/_/g, " ")}
                  </span>
                  <Clock className="w-4 h-4 text-slate-600" />
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
