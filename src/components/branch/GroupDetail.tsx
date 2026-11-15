"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, UserPlus, Users, Loader2, Phone } from "lucide-react";

type Member = {
  membershipId: string;
  customerId: string;
  fullName: string;
  phone: string;
  gender: string;
  maritalStatus: string;
  groupRole: string;
  status: string;
};

type Props = {
  group: { id: string; name: string; number: string; address: string; dateCreated: string };
  members: Member[];
};

const ROLES = ["LEADER", "SECRETARY", "TREASURER", "CHIEF_WHIP", "MEMBER"];
const MARITAL = ["Single", "Married", "Divorced", "Widowed"];

export function GroupDetail({ group, members }: Props) {
  const router = useRouter();
  const [showAdd, setShowAdd] = useState(false);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    fullName: "",
    fatherHusband: "",
    maritalStatus: "Single",
    dateOfBirth: "",
    gender: "Female",
    address: "",
    phone: "",
    groupRole: "MEMBER",
  });

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setAdding(true);
    setError("");
    try {
      const res = await fetch("/api/branch/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupId: group.id, ...form }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to add member");
        setAdding(false);
        return;
      }
      setShowAdd(false);
      setForm({
        fullName: "",
        fatherHusband: "",
        maritalStatus: "Single",
        dateOfBirth: "",
        gender: "Female",
        address: "",
        phone: "",
        groupRole: "MEMBER",
      });
      router.refresh();
    } catch {
      setError("Something went wrong");
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#05050a]">
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-[#05050a]/80 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center gap-4">
          <button onClick={() => router.push("/branch/groups")} className="p-2 rounded-lg hover:bg-slate-800 text-slate-400">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-white">{group.name}</h1>
            {group.number && <p className="text-xs text-slate-500">#{group.number}</p>}
          </div>
          <div className="ml-auto">
            <button onClick={() => setShowAdd(true)} className="btn-primary text-sm">
              <UserPlus className="w-4 h-4" /> Add Member
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="card p-5 mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-400">Members</p>
            <p className="text-2xl font-bold text-white">{members.length}</p>
          </div>
          {group.address && <p className="text-sm text-slate-400 max-w-xs text-right">{group.address}</p>}
        </div>

        {members.length === 0 ? (
          <div className="card p-12 text-center">
            <Users className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <h3 className="font-medium text-slate-300 mb-1">No members yet</h3>
            <p className="text-sm text-slate-500 mb-5">Add the first member to this group.</p>
            <button onClick={() => setShowAdd(true)} className="btn-primary">
              <UserPlus className="w-4 h-4" /> Add Member
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {members.map((m) => (
              <div key={m.membershipId} className="card p-4 flex items-center justify-between hover:border-slate-700 transition-colors">
                <div>
                  <p className="font-medium text-white">{m.fullName}</p>
                  <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                    <Phone className="w-3 h-3" /> {m.phone} · {m.groupRole}
                  </p>
                </div>
                <button
                  onClick={() => router.push(`/branch/customers/${m.customerId}`)}
                  className="text-xs text-sky-400 hover:text-sky-300"
                >
                  View / Apply Loan
                </button>
              </div>
            ))}
          </div>
        )}
      </main>

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto" onClick={() => !adding && setShowAdd(false)}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="card w-full max-w-lg p-6 my-8" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-white mb-5">Add Member</h3>
            <form onSubmit={handleAdd} className="space-y-3">
              <div>
                <label className="label">Full Name</label>
                <input required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className="input" />
              </div>
              <div>
                <label className="label">Father / Husband</label>
                <input value={form.fatherHusband} onChange={(e) => setForm({ ...form, fatherHusband: e.target.value })} className="input" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Marital Status</label>
                  <select value={form.maritalStatus} onChange={(e) => setForm({ ...form, maritalStatus: e.target.value })} className="input">
                    {MARITAL.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Gender</label>
                  <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className="input">
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Date of Birth</label>
                <input type="date" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} className="input" />
              </div>
              <div>
                <label className="label">Address</label>
                <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="input" />
              </div>
              <div>
                <label className="label">Phone Number</label>
                <input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input" placeholder="080..." />
              </div>
              <div>
                <label className="label">Group Role</label>
                <select value={form.groupRole} onChange={(e) => setForm({ ...form, groupRole: e.target.value })} className="input">
                  {ROLES.map((r) => <option key={r} value={r}>{r.replace("_", " ")}</option>)}
                </select>
              </div>
              {error && <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</div>}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAdd(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={adding} className="btn-primary flex-1">
                  {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                  Add Member
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
