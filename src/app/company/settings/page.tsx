"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Lock, Sun, Moon, Loader2, KeyRound, Settings as SettingsIcon } from "lucide-react";

export default function CompanySettingsPage() {
  const router = useRouter();
  const [theme, setTheme] = useState<"dark" | "light">("light");
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [showReset, setShowReset] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [tempPassword, setTempPassword] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  useEffect(() => {
    const saved = (localStorage.getItem("nexora-theme") as "dark" | "light") || "light";
    setTheme(saved);
    document.documentElement.dataset.theme = saved;
  }, []);

  function chooseTheme(value: "dark" | "light") {
    setTheme(value);
    localStorage.setItem("nexora-theme", value);
    document.documentElement.dataset.theme = value;
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) { setMessage("Password must be at least 8 characters"); return; }
    if (password !== confirm) { setMessage("Passwords do not match"); return; }
    setLoading(true); setMessage("");
    try {
      const res = await fetch("/api/company/change-password", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }),
      });
      if (res.ok) {
        setMessage("Password updated successfully"); setPassword(""); setConfirm(""); setShowPassword(false);
      } else {
        const data = await res.json().catch(() => ({}));
        setMessage(data.error || "Failed to update password");
      }
    } catch { setMessage("Something went wrong"); }
    finally { setLoading(false); }
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault(); setResetLoading(true); setMessage("");
    try {
      const res = await fetch("/api/company/reset-password", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ currentPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setMessage(data.error || "Reset failed");
      else { setTempPassword(data.tempPassword); setCurrentPassword(""); }
    } catch { setMessage("Something went wrong"); }
    finally { setResetLoading(false); }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-slate-50/80 backdrop-blur-xl">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center gap-4">
          <button onClick={() => router.push("/company")} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"><ArrowLeft className="w-5 h-5" /></button>
          <h1 className="text-lg font-semibold text-slate-900">Settings</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-5"><SettingsIcon className="w-5 h-5 text-slate-400" /><div><h2 className="font-semibold text-slate-900">Appearance</h2><p className="text-xs text-slate-500">Choose light or dark mode. Your preference is saved on this device.</p></div></div>
          <div className="flex gap-3">
            <button onClick={() => chooseTheme("light")} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border transition-colors ${theme === "light" ? "border-sky-500/50 bg-sky-50 text-sky-700" : "border-slate-200 text-slate-500 hover:bg-slate-50"}`}>
              <Sun className="w-4 h-4" /> Light mode
            </button>
            <button onClick={() => chooseTheme("dark")} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border transition-colors ${theme === "dark" ? "border-sky-500/50 bg-sky-50 text-sky-700" : "border-slate-200 text-slate-500 hover:bg-slate-50"}`}>
              <Moon className="w-4 h-4" /> Dark mode
            </button>
          </div>
        </div>

        {message && <div className="card p-3 text-sm text-sky-700 bg-sky-50 border-sky-100">{message}</div>}

        <div className="card p-6">
          <div className="flex items-center gap-3 mb-5"><Lock className="w-5 h-5 text-slate-400" /><h2 className="font-semibold text-slate-900">Change Password</h2></div>
          {!showPassword ? (
            <button onClick={() => setShowPassword(true)} className="btn-secondary"><Lock className="w-4 h-4" /> Change Password</button>
          ) : (
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div><label className="label">New Password</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input" required minLength={8} /></div>
              <div><label className="label">Confirm Password</label><input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="input" required /></div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowPassword(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={loading} className="btn-primary flex-1">{loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Update"}</button>
              </div>
            </form>
          )}
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-3 mb-3"><KeyRound className="w-5 h-5 text-slate-400" /><h2 className="font-semibold text-slate-900">Reset Password</h2></div>
          <p className="text-sm text-slate-500 mb-4">Generate a new temporary password after confirming your current password. You will be required to change it at next login.</p>
          {tempPassword ? (
            <div className="space-y-3">
              <p className="text-sm text-emerald-600">Password reset. Your new temporary password:</p>
              <input readOnly value={tempPassword} className="input font-mono" />
              <p className="text-xs text-slate-500">Store it safely. Sign in with it and change it at next login.</p>
            </div>
          ) : showReset ? (
            <form onSubmit={handleReset} className="space-y-4">
              <div><label className="label">Current Password</label><input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="input" required /></div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowReset(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={resetLoading} className="btn-primary flex-1">{resetLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Reset"}</button>
              </div>
            </form>
          ) : (
            <button onClick={() => setShowReset(true)} className="btn-secondary"><KeyRound className="w-4 h-4" /> Reset password</button>
          )}
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[11px] text-slate-400 mt-4">Company settings contain only Change password, Reset password, Light mode and Dark mode.</motion.p>
        </div>
      </main>
    </div>
  );
}
