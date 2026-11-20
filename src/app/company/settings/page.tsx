"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Lock, Sun, Moon, Loader2 } from "lucide-react";
import { PasswordInput } from "@/components/ui/PasswordInput";

/**
 * Company Settings — vision §2.2
 * Only: Change password, Reset password, Light mode and Dark mode.
 */
export default function CompanySettingsPage() {
  const router = useRouter();
  const [theme, setTheme] = useState<"light" | "dark">("light");
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
        const data = await res.json().catch(() => ({}));
        setMessage(data.error || "Failed to update password");
      }
    } catch {
      setMessage("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-shell">
      <header className="page-header">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center gap-4">
          <button
            onClick={() => router.push("/company")}
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-500"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold text-slate-900">Settings</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-slate-900 mb-3">Appearance</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setTheme("light")}
              className={`btn-secondary flex-1 ${theme === "light" ? "ring-2 ring-black" : ""}`}
            >
              <Sun className="w-4 h-4" /> Light mode
            </button>
            <button
              onClick={() => setTheme("dark")}
              className={`btn-secondary flex-1 ${theme === "dark" ? "ring-2 ring-black" : ""}`}
            >
              <Moon className="w-4 h-4" /> Dark mode
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Preference is stored on this device for now.
          </p>
        </div>

        <div className="card p-5">
          <h2 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <Lock className="w-4 h-4" /> Change password
          </h2>
          {!showPassword ? (
            <button onClick={() => setShowPassword(true)} className="btn-secondary">
              Change password
            </button>
          ) : (
            <form onSubmit={handleChangePassword} className="space-y-3">
              <div>
                <label className="label">New password</label>
                <PasswordInput value={password} onChange={setPassword} required />
              </div>
              <div>
                <label className="label">Confirm password</label>
                <PasswordInput value={confirm} onChange={setConfirm} required />
              </div>
              {message && (
                <p
                  className={`text-sm ${
                    message.includes("success") ? "text-emerald-600" : "text-red-600"
                  }`}
                >
                  {message}
                </p>
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowPassword(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="btn-primary flex-1">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Save
                </button>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
