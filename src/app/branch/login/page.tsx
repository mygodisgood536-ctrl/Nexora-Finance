"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Lock, ArrowRight, Loader2, User } from "lucide-react";

export default function BranchLoginPage() {
  const router = useRouter();
  const [companySlug, setCompanySlug] = useState("");
  const [branchSlug, setBranchSlug] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/branch/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companySlug, branchSlug, phone, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Invalid credentials");
        setLoading(false);
        return;
      }
      router.push("/branch");
      router.refresh();
    } catch {
      setError("Network or server error");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#05050a]">
      <div className="ambient" />
      <div className="relative z-10 min-h-screen flex items-center justify-center p-5">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-[400px]"
        >
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-sky-500 shadow-xl shadow-emerald-500/20 mb-5">
              <User className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Worker Access</h1>
            <p className="mt-1.5 text-sm text-slate-500">Branch Manager or Collection Officer</p>
          </div>

          <div className="card p-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Company</label>
                  <input value={companySlug} onChange={(e) => setCompanySlug(e.target.value.toLowerCase())} className="input" placeholder="slug" required />
                </div>
                <div>
                  <label className="label">Branch</label>
                  <input value={branchSlug} onChange={(e) => setBranchSlug(e.target.value.toLowerCase())} className="input" placeholder="slug" required />
                </div>
              </div>
              <div>
                <label className="label">Phone Number</label>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} className="input" placeholder="080..." required />
              </div>
              <div>
                <label className="label">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input pl-11" required />
                </div>
              </div>
              {error && (
                <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-2xl px-4 py-3">{error}</div>
              )}
              <button type="submit" disabled={loading} className="btn-primary w-full py-4 text-[15px]">
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</> : <>Sign in <ArrowRight className="w-4 h-4" /></>}
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
