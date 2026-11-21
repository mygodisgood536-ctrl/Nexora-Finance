"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, UserPlus, Users, Loader2, Phone, Search, ChevronDown, Info, CalendarDays, MapPin, Hash,
} from "lucide-react";

type Member = {
  membershipId: string; customerId: string; fullName: string; phone: string;
  gender: string; maritalStatus: string; groupRole: string; status: string;
};
type Props = {
  group: { id: string; name: string; number: string; address: string; dateCreated: string };
  members: Member[];
  readOnly?: boolean;
};

const ROLES = ["LEADER", "SECRETARY", "TREASURER", "CHIEF_WHIP", "MEMBER"];
const MARITAL = ["Single", "Married", "Divorced", "Widowed"];
const ROLE_LABEL: Record<string, string> = {
  LEADER: "Leader", SECRETARY: "Secretary", TREASURER: "Treasurer", CHIEF_WHIP: "Chief Whip", MEMBER: "Member",
};

export function GroupDetail({ group, members, readOnly = false }: Props) {
  const router = useRouter();
  const [showAdd, setShowAdd] = useState(false);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [openRole, setOpenRole] = useState<string | null>(null);
  const [form, setForm] = useState({
    fullName: "", fatherHusband: "", maritalStatus: "Single", dateOfBirth: "", gender: "Female",
    address: "", phone: "", groupRole: "MEMBER",
  });

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault(); setAdding(true); setError("");
    try {
      const res = await fetch("/api/branch/members", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupId: group.id, ...form }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.error || "Failed to add member"); setAdding(false); return; }
      setShowAdd(false);
      setForm({ fullName: "", fatherHusband: "", maritalStatus: "Single", dateOfBirth: "", gender: "Female", address: "", phone: "", groupRole: "MEMBER" });
      router.refresh();
    } catch { setError("Something went wrong"); }
    finally { setAdding(false); }
  }

  const filtered = members.filter((m) => [m.fullName, m.phone, m.groupRole].some((v) => v.toLowerCase().includes(query.toLowerCase())));
  const byRole = ROLES.map((role) => ({ role, items: filtered.filter((m) => m.groupRole === role) })).filter((r) => r.items.length > 0);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center gap-3">
          <button onClick={() => router.push("/branch/groups")} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"><ArrowLeft className="w-5 h-5" /></button>
          <div className="min-w-0">
            <h1 className="text-lg font-semibold text-slate-900 truncate">{group.name}</h1>
            {group.number && <p className="text-[11px] text-slate-400">Group #{group.number}</p>}
          </div>
          <div className="ml-auto">
            {readOnly ? <span className="text-xs text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full">Inspection only</span> : (
              <button onClick={() => { setShowAdd(true); setError(""); }} className="btn-primary text-sm py-2.5 px-4"><UserPlus className="w-4 h-4" /> Add Member</button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">{group.name}</h2>
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500">
                {group.number && <span className="flex items-center gap-1.5"><Hash className="w-3.5 h-3.5" /> {group.number}</span>}
                {group.address && <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {group.address}</span>}
                <span className="flex items-center gap-1.5"><CalendarDays className="w-3.5 h-3.5" /> {new Date(group.dateCreated).toLocaleDateString()}</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center"><p className="text-2xl font-bold text-slate-900">{members.length}</p><p className="text-[11px] text-slate-500">Members</p></div>
              <div className="w-px h-10 bg-slate-200" />
              <div className="text-center"><p className="text-2xl font-bold text-slate-900">{byRole.length}</p><p className="text-[11px] text-slate-500">Roles present</p></div>
            </div>
          </div>
        </motion.div>

        <div className="rounded-2xl bg-sky-50 border border-sky-100 p-4 flex items-start gap-3">
          <Info className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
          <p className="text-xs text-slate-600">Group roles (Leader, Secretary, Treasurer, Chief Whip, Member) are labels describing a member's position. They do not grant Nexora permissions. There is no fixed member limit — add as many members as needed.</p>
        </div>

        {members.length > 0 && (
          <div className="relative max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search members" className="input pl-9" />
          </div>
        )}

        {members.length === 0 ? (
          <div className="card p-14 text-center">
            <Users className="w-11 h-11 text-slate-300 mx-auto mb-3" />
            <h3 className="font-semibold text-slate-900 mb-1">No members yet</h3>
            <p className="text-sm text-slate-500 mb-5">Add the first member to this group.</p>
            {!readOnly && <button onClick={() => setShowAdd(true)} className="btn-primary"><UserPlus className="w-4 h-4" /> Add Member</button>}
          </div>
        ) : byRole.length === 0 ? (
          <div className="card p-12 text-center text-slate-500">No members match your search.</div>
        ) : (
          <div className="space-y-3">
            {byRole.map((section, idx) => (
              <motion.div key={section.role} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }} className="card overflow-hidden">
                <button
                  onClick={() => setOpenRole(openRole === section.role ? null : section.role)}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-slate-800">{ROLE_LABEL[section.role] || section.role}</span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">{section.items.length}</span>
                  </div>
                  <motion.span animate={{ rotate: openRole === section.role ? 180 : 0 }}><ChevronDown className="w-4 h-4 text-slate-400" /></motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {(openRole === section.role || byRole.length === 1) && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="overflow-x-auto border-t border-slate-100">
                        <table className="w-full text-sm">
                          <thead><tr className="text-left text-[11px] text-slate-400 uppercase tracking-wide bg-slate-50/60">
                            <th className="px-5 py-3 font-medium">Member</th>
                            <th className="px-5 py-3 font-medium">Phone</th>
                            <th className="px-5 py-3 font-medium">Gender</th>
                            <th className="px-5 py-3 font-medium">Marital status</th>
                            <th className="px-5 py-3 font-medium">Status</th>
                            <th className="px-5 py-3"></th>
                          </tr></thead>
                          <tbody>
                            {section.items.map((m) => (
                              <tr key={m.membershipId} className="border-t border-slate-50 hover:bg-slate-50/60">
                                <td className="px-5 py-3 font-medium text-slate-800">{m.fullName}</td>
                                <td className="px-5 py-3 text-slate-500 flex items-center gap-1.5"><Phone className="w-3 h-3" />{m.phone}</td>
                                <td className="px-5 py-3 text-slate-500">{m.gender || "—"}</td>
                                <td className="px-5 py-3 text-slate-500">{m.maritalStatus || "—"}</td>
                                <td className="px-5 py-3"><span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600">{m.status}</span></td>
                                <td className="px-5 py-3 text-right">
                                  <button onClick={() => router.push(`/branch/customers/${m.customerId}`)} className="text-xs text-sky-600 hover:underline">{readOnly ? "Inspect" : "Profile"}</button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      <AnimatePresence>
        {showAdd && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto" onClick={() => !adding && setShowAdd(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="card-elevated w-full max-w-lg p-6 my-8" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-semibold text-slate-900 mb-1">Add Member</h3>
              <p className="text-xs text-slate-500 mb-5">Adding a member creates or links their customer profile. Saved one at a time.</p>
              <form onSubmit={handleAdd} className="space-y-3">
                <div><label className="label">Full Name</label><input required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className="input" /></div>
                <div><label className="label">Father / Husband</label><input value={form.fatherHusband} onChange={(e) => setForm({ ...form, fatherHusband: e.target.value })} className="input" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="label">Marital Status</label><select value={form.maritalStatus} onChange={(e) => setForm({ ...form, maritalStatus: e.target.value })} className="input">{MARITAL.map((m) => <option key={m}>{m}</option>)}</select></div>
                  <div><label className="label">Gender</label><select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className="input"><option>Female</option><option>Male</option></select></div>
                </div>
                <div><label className="label">Date of Birth</label><input type="date" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} className="input" /></div>
                <div><label className="label">Address</label><input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="input" /></div>
                <div><label className="label">Phone Number</label><input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input" placeholder="080..." /></div>
                <div><label className="label">Group Role</label><select value={form.groupRole} onChange={(e) => setForm({ ...form, groupRole: e.target.value })} className="input">{ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}</select></div>
                {error && <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{error}</div>}
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowAdd(false)} className="btn-secondary flex-1">Cancel</button>
                  <button type="submit" disabled={adding} className="btn-primary flex-1">{adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />} Add Member</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
