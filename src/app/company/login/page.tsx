"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, ArrowRight } from "lucide-react";
import { AuthShell } from "@/components/layout/AuthShell";

/**
 * Company workspace login.
 * Pre-login: neutral identity only (no Nexora / BM / CO).
 * After login: company name is supplied by session everywhere.
 */
export default function CompanyLoginPage() {
  const router = useRouter();
  const [slug, setSlug] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [tried, setTried] = useState(false);

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
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Invalid credentials");
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

  const displayBrand = slug.trim() ? slug.trim() : "Workspace";

  return (
    <AuthShell
      brand={displayBrand}
      subtitle="Company workspace"
      formTitle="Sign in"
      skipSplash={tried}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Workspace ID</label>
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
            className="input"
            placeholder="your-company"
            required
            autoComplete="organization"
          />
        </div>
        <div>
          <label className="label">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input"
            placeholder="••••••••"
            required
            autoComplete="current-password"
          />
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
