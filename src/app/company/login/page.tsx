"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, ArrowRight } from "lucide-react";
import { AuthShell } from "@/components/layout/AuthShell";
import { PasswordInput } from "@/components/ui/PasswordInput";

function CompanyLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const presetSlug = searchParams.get("slug") || "";

  const [slug, setSlug] = useState(presetSlug);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [tried, setTried] = useState(false);

  useEffect(() => {
    if (presetSlug) setSlug(presetSlug);
  }, [presetSlug]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    setTried(true);
    try {
      const res = await fetch("/api/company/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: slug.trim().toLowerCase(), password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = data.error || "";
        if (msg.toLowerCase().includes("database") || msg.toLowerCase().includes("prisma")) {
          setError("Sign-in is temporarily unavailable. Please try again shortly.");
        } else if (res.status === 401) {
          setError("Incorrect workspace or password.");
        } else {
          setError(msg || "Unable to sign in.");
        }
        setLoading(false);
        return;
      }
      if (data.mustChangePassword) {
        router.push("/company/change-password");
      } else {
        router.push("/company");
      }
      router.refresh();
    } catch {
      setError("Unable to reach the server.");
      setLoading(false);
    }
  }

  const brand = slug.trim() || "Workspace";

  return (
    <AuthShell
      brand={brand}
      subtitle="Company workspace"
      formTitle="Sign in"
      skipSplash={tried || !!presetSlug}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {!presetSlug && (
          <div>
            <label className="label">Workspace ID</label>
            <input
              type="text"
              value={slug}
              onChange={(e) =>
                setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))
              }
              className="input"
              placeholder="your-company"
              required
            />
          </div>
        )}
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

export default function CompanyLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[100dvh] bg-black flex items-center justify-center text-white">
          Loading...
        </div>
      }
    >
      <CompanyLoginForm />
    </Suspense>
  );
}
