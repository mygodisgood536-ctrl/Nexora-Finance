"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, ArrowRight } from "lucide-react";
import { AuthShell } from "@/components/layout/AuthShell";
import { PasswordInput } from "@/components/ui/PasswordInput";

function BranchLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const presetCompany = searchParams.get("company") || "";
  const presetBranch = searchParams.get("branch") || "";

  const [companySlug, setCompanySlug] = useState(presetCompany);
  const [branchSlug, setBranchSlug] = useState(presetBranch);
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [tried, setTried] = useState(false);

  useEffect(() => {
    if (presetCompany) setCompanySlug(presetCompany);
    if (presetBranch) setBranchSlug(presetBranch);
  }, [presetCompany, presetBranch]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    setTried(true);
    try {
      const res = await fetch("/api/branch/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companySlug: companySlug.trim().toLowerCase(),
          branchSlug: branchSlug.trim().toLowerCase(),
          phone: phone.trim(),
          password,
        }),
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
      setError("Unable to reach the server.");
      setLoading(false);
    }
  }

  const displayBrand = companySlug.trim() || "Branch";
  const branchLabel = branchSlug.trim() ? `${branchSlug}.${companySlug || "company"}` : "staff access";

  return (
    <AuthShell
      brand={displayBrand}
      subtitle={branchLabel}
      formTitle="Sign in"
      skipSplash={tried}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Workspace</label>
            <input
              value={companySlug}
              onChange={(e) => setCompanySlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
              className="input"
              placeholder="company"
              required
              readOnly={!!presetCompany}
            />
          </div>
          <div>
            <label className="label">Branch</label>
            <input
              value={branchSlug}
              onChange={(e) => setBranchSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
              className="input"
              placeholder="branch"
              required
              readOnly={!!presetBranch}
            />
          </div>
        </div>
        <div>
          <label className="label">Phone</label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="input"
            placeholder="080..."
            required
          />
        </div>
        <div>
          <label className="label">Password</label>
          <PasswordInput value={password} onChange={setPassword} required />
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-2xl px-4 py-3"
          >
            {error}
          </motion.div>
        )}

        <button type="submit" disabled={loading} className="btn-primary w-full py-4 mt-2">
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Signing in...
            </>
          ) : (
            <>
              Continue
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>
    </AuthShell>
  );
}

export default function BranchLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-[100dvh] bg-white flex items-center justify-center text-slate-500">Loading...</div>}>
      <BranchLoginForm />
    </Suspense>
  );
}
