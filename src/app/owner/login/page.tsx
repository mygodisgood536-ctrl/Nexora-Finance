"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, ArrowRight } from "lucide-react";
import { AuthShell } from "@/components/layout/AuthShell";
import { PasswordInput } from "@/components/ui/PasswordInput";

/**
 * Infrastructure Owner login — vision §2
 * Main NEXORA URL only leads here. No company/branch/staff selection.
 */
export default function OwnerLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("owner");
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
      const res = await fetch("/api/owner/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = (data.error || "").toLowerCase();
        if (
          msg.includes("database") ||
          msg.includes("prisma") ||
          msg.includes("generate")
        ) {
          setError("Sign-in is temporarily unavailable. Please try again shortly.");
        } else if (res.status === 401) {
          setError("Incorrect username or password.");
        } else {
          setError(data.error || "Unable to sign in. Please try again.");
        }
        setLoading(false);
        return;
      }
      router.push("/owner");
      router.refresh();
    } catch {
      setError("Unable to reach the server. Check your connection and try again.");
      setLoading(false);
    }
  }

  return (
    <AuthShell
      brand="NEXORA"
      tagline="Intelligent Infrastructure for Financial Growth."
      subtitle="Infrastructure Owner"
      formTitle="Sign in"
      skipSplash={tried}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label" htmlFor="owner-username">
            Username
          </label>
          <input
            id="owner-username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="input"
            placeholder="owner"
            required
            autoComplete="username"
          />
        </div>
        <div>
          <label className="label" htmlFor="owner-password">
            Password
          </label>
          <PasswordInput
            id="owner-password"
            value={password}
            onChange={setPassword}
            required
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
