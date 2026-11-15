"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Plus, FolderOpen, Users, Loader2, MapPin } from "lucide-react";

type Group = {
  id: string;
  name: string;
  number: string;
  address: string;
  memberCount: number;
  dateCreated: string;
};

export function GroupsPage({ groups }: { groups: Group[] }) {
  const router = useRouter();
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", number: "", address: "" });

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch("/api/branch/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to create group");
        setCreating(false);
        return;
      }
      setShowCreate(false);
      setForm({ name: "", number: "", address: "" });
      router.refresh();
    } catch {
      alert("Something went wrong");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center gap-4">
          <button onClick={() => router.push("/branch")} className="p-2 rounded-lg hover:bg-slate-800 text-slate-400">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold text-white">Groups</h1>
          <div className="ml-auto">
            <button onClick={() => setShowCreate(true)} className="btn-primary text-sm">
              <Plus className="w-4 h-4" /> Create Group
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {groups.length === 0 ? (
          <div className="card p-16 text-center">
            <FolderOpen className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-white mb-2">No groups yet</h2>
            <p className="text-sm text-slate-400 mb-6">Create your first group and start adding members.</p>
            <button onClick={() => setShowCreate(true)} className="btn-primary">
              <Plus className="w-4 h-4" /> Create Group
            </button>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {groups.map((g, i) => (
              <motion.div
                key={g.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="card p-5 hover:border-slate-700 transition-colors cursor-pointer"
                onClick={() => router.push(`/branch/groups/${g.id}`)}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-white">{g.name}</h3>
                    {g.number && <p className="text-xs text-slate-500 mt-0.5">#{g.number}</p>}
                  </div>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" /> {g.memberCount}
                  </span>
                </div>
                {g.address && (
                  <p className="text-sm text-slate-400 mt-3 flex items-center gap-1.5 truncate">
                    <MapPin className="w-3.5 h-3.5 shrink-0" /> {g.address}
                  </p>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </main>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => !creating && setShowCreate(false)}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="card w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-white mb-5">Create Group</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="label">Group Name</label>
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" placeholder="e.g. Market Women Group" />
              </div>
              <div>
                <label className="label">Group Number (optional)</label>
                <input value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} className="input" placeholder="e.g. G-001" />
              </div>
              <div>
                <label className="label">Group Address (optional)</label>
                <textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="input min-h-[70px] resize-none" placeholder="Meeting location or area" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={creating} className="btn-primary flex-1">
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Create
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
