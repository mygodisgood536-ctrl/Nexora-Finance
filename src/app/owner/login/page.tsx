"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, User, ArrowRight, Loader2 } from "lucide-react";

export default function OwnerLoginPage() {
  const router = useRouter();
  const [showSplash, setShowSplash] = useState(true);
  const [username, setUsername] = useState("owner");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShowSplash(false), 2200);
    return () => clearTimeout(t);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/owner/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Invalid credentials");
        setLoading(false);
        return;
      }
      router.push("/owner");
      router.refresh();
    } catch (err: any) {
      setError(err?.message || "Network or server error. Is the database ready?");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#05050a]">
      <div className="ambient" />

      <AnimatePresence mode="wait">
        {showSplash ? (
          <motion.div
            key="splash"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 z-50 flex flex-col items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 18, delay: 0.15 }}
              className="w-24 h-24 rounded-[28px] bg-gradient-to-br from-sky-400 to-indigo-500 flex items-center justify-center shadow-2xl shadow-sky-500/30"
            >
              <span className="text-4xl font-bold text-white tracking-tighter">N</span>
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="mt-8 text-3xl font-bold tracking-tight text-white"
            >
              Nexora
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.65 }}
              className="mt-2 text-sm text-slate-500"
            >
              Microfinance Infrastructure
            </motion.p>
          </motion.div>
        ) : (
          <motion.div
            key="login"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 min-h-screen flex items-center justify-center p-5"
          >
            <div className="w-full max-w-[400px]">
              {/* Brand */}
              <div className="text-center mb-10">
                <motion.div
                  initial={{ scale: 0.85, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-400 to-indigo-500 shadow-xl shadow-sky-500/25 mb-5"
                >
                  <span className="text-2xl font-bold text-white">N</span>
                </motion.div>
                <h1 className="text-2xl font-bold tracking-tight text-white">Welcome back</h1>
                <p className="mt-1.5 text-sm text-slate-500">Infrastructure Owner</p>
              </div>

              {/* Card */}
              <div className="card p-8">
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="label">Username</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="input pl-11"
                        placeholder="owner"
                        required
                        autoComplete="username"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="label">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="input pl-11"
                        placeholder="••••••••"
                        required
                        autoComplete="current-password"
                      />
                    </div>
                  </div>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-2xl px-4 py-3"
                    >
                      {error}
                    </motion.div>
                  )}

                  <button type="submit" disabled={loading} className="btn-primary w-full py-4 text-[15px]">
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      <>
                        Sign in
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              </div>

              <p className="text-center text-[11px] text-slate-600 mt-10 tracking-wide">
                Centrally owned microfinance infrastructure
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
