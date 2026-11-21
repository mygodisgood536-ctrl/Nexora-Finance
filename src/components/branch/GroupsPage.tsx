"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Plus, FolderOpen, Users, Loader2, MapPin, Search, ChevronDown, ArrowRight, CalendarDays } from "lucide-react";

type Member = { id: string; name: string; role: string };
type Group = {
  id: string; name: string; number: string; address: string;
  memberCount: number; dateCreated: string; members: Member[];
};

export function GroupsPage({ groups }: { groups: Group[] }) {
  const router = useRouter();
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", number: "", address: "" });
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch("/api/branch/groups", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { alert(data.error || "Failed to create group"); setCreating(false); return; }
      setShowCreate(false); setForm({ name: "", number: "", address: "" }); router.refresh();
    } catch { alert("Something went wrong"); }
    finally { setCreating(false); }
  }

  const filtered = groups.filter((g) => [g.name, g.number, g.address].some((v) => v.toLowerCase().includes(query.toLowerCase())));

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center gap-3">
          <button onClick={() => router.push("/branch")} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"><ArrowLeft className="w-5 h-5" /></button>
          <div className="min-w-0">
            <h1 className="text-lg font-semibold text-slate-900">Groups</h1>
            <p className="text-[11px] text-slate-400 hidden sm:block">{groups.length} group{groups.length === 1 ? "" : "s"} · unlimited members per group</p>
          </div>
          <button onClick={() => setShowCreate(true)} className="ml-auto btn-primary text-sm py-2.5 px-4"><Plus className="w-4 h-4" /> Create Group</button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {groups.length > 0 && (
          <div className="relative mb-6 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search groups" className="input pl-9" />
          </div>
        )}

        {groups.length === 0 ? (
          <div className="card p-16 text-center">
            <FolderOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-slate-900 mb-2">No groups yet</h2>
            <p className="text-sm text-slate-500 mb-6">Create your first group and start adding members.</p>
            <button onClick={() => setShowCreate(true)} className="btn-primary"><Plus className="w-4 h-4" /> Create Group</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="card p-12 text-center text-slate-500">No groups match your search.</div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((g, i) => (
              <motion.div key={g.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} layout className="card overflow-hidden">
                <div className="p-5 cursor-pointer" onClick={() => router.push(`/branch/groups/${g.id}`)}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-slate-900 truncate">{g.name}</h3>
                      {g.number && <p className="text-xs text-slate-400 mt-0.5">Group #{g.number}</p>}
                    </div>
                    <span className="shrink-0 flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-sky-50 text-sky-700">
                      <Users className="w-3.5 h-3.5" /> {g.memberCount}
                    </span>
                  </div>
                  {g.address && <p className="text-xs text-slate-500 mt-3 flex items-center gap-1.5 truncate"><MapPin className="w-3.5 h-3.5 shrink-0" />{g.address}</p>}
                  <p className="text-[11px] text-slate-400 mt-2 flex items-center gap-1.5"><CalendarDays className="w-3 h-3" /> Created {new Date(g.dateCreated).toLocaleDateString()}</p>
                </div>

                <div className="border-t border-slate-100">
                  <button
                    onClick={() => setExpanded(expanded === g.id ? null : g.id)}
                    className="w-full flex items-center justify-between px-5 py-3 text-xs font-medium text-slate-600 hover:bg-slate-50"
                  >
                    <span>{expanded === g.id ? "Hide members" : `Member preview${g.members.length ? ` (${Math.min(g.members.length, g.memberCount)})` : ""}`}</span>
                    <motion.span animate={{ rotate: expanded === g.id ? 180 : 0 }}><ChevronDown className="w-4 h-4" /></motion.span>
                  </button>
                  <AnimatePresence initial={false}>
                    {expanded === g.id && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="px-5 pb-4 space-y-1.5">
                          {g.members.length === 0 ? (
                            <p className="text-xs text-slate-400">No members added yet.</p>
                          ) : g.members.map((m) => (
                            <div key={m.id} className="flex items-center justify-between text-xs rounded-lg bg-slate-50 px-3 py-2">
                              <span className="text-slate-700 truncate">{m.name}</span>
                              <span className="text-[10px] text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-100">{m.role.replace("_", " ")}</span>
                            </div>
                          ))}
                          {g.memberCount > g.members.length && <p className="text-[11px] text-slate-400 pt-1">+ {g.memberCount - g.members.length} more members</p>}
                          <button onClick={() => router.push(`/branch/groups/${g.id}`)} className="w-full mt-2 text-xs text-sky-600 flex items-center justify-center gap-1 py-2">
                            Open group <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      <AnimatePresence>
        {showCreate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => !creating && setShowCreate(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="card-elevated w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-semibold text-slate-900 mb-1">Create Group</h3>
              <p className="text-xs text-slate-500 mb-5">Only a name is required. Members are added one at a time later.</p>
              <form onSubmit={handleCreate} className="space-y-4">
                <div><label className="label">Group Name</label><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" placeholder="e.g. Market Women Group" /></div>
                <div><label className="label">Group Number (optional)</label><input value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} className="input" placeholder="e.g. G-001" /></div>
                <div><label className="label">Group Address (optional)</label><textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="input min-h-[70px] resize-none" placeholder="Meeting location or area" /></div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary flex-1">Cancel</button>
                  <button type="submit" disabled={creating} className="btn-primary flex-1">{creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Create</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
