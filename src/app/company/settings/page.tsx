"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Lock, Sun, Moon, Loader2 } from "lucide-react";

export default function CompanySettingsPage() {
  const router = useRouter();
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      setMessage("Password must be at least 8 characters");
      return;
    }
    if (password !== confirm) {
      setMessage("Passwords do not match");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/company/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        setMessage("Password updated successfully");
        setPassword("");
        setConfirm("");
        setShowPassword(false);
      } else {
        setMessage("Failed to update password");
      }
    } catch {
      setMessage("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center gap-4">
          <button onClick={() => router.push("/company")} className="p-2 rounded-lg hover:bg-slate-800 text-slate-400">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold text-white">Settings</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Theme */}
        <div className="card p-6">
          <h2 className="font-medium text-white mb-4">Appearance</h2>
          <div className="flex gap-3">
            <button
              onClick={() => setTheme("dark")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border transition-colors ${
                theme === "dark" ? "border-sky-500/50 bg-sky-500/10 text-sky-300" : "border-slate-700 text-slate-400 hover:bg-slate-800"
              }`}
            >
              <Moon className="w-4 h-4" /> Dark mode
            </button>
            <button
              onClick={() => setTheme("light")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border transition-colors ${
                theme === "light" ? "border-sky-500/50 bg-sky-500/10 text-sky-300" : "border-slate-700 text-slate-400 hover:bg-slate-800"
              }`}
            >
              <Sun className="w-4 h-4" /> Light mode
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-3">Light mode support is prepared. Dark is the default creative theme.</p>
        </div>

        {/* Change password */}
        <div className="card p-6">
          <h2 className="font-medium text-white mb-4">Change Password</h2>
          {!showPassword ? (
            <button onClick={() => setShowPassword(true)} className="btn-secondary">
              <Lock className="w-4 h-4" /> Change Password
            </button>
          ) : (
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="label">New Password</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input" required />
              </div>
              <div>
                <label className="label">Confirm Password</label>
                <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="input" required />
              </div>
              {message && (
                <p className={`text-sm ${message.includes("success") ? "text-emerald-400" : "text-red-400"}`}>{message}</p>
              )}
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowPassword(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={loading} className="btn-primary flex-1">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Update"}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Reset password note */}
        <div className="card p-6">
          <h2 className="font-medium text-white mb-2">Reset Password</h2>
          <p className="text-sm text-slate-400">
            Contact the Platform Owner if you need a full password reset. Company settings only contain Change password, Reset password, Light mode and Dark mode as specified in the vision.
          </p>
        </div>
      </main>
    </div>
  );
}
