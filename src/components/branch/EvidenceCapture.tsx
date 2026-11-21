"use client";

import { useState, useRef } from "react";
import { Camera, Plus, X, Image as ImageIcon, Loader2 } from "lucide-react";

type Props = {
  title: string;
  description: string;
  applicationId: string;
  captureType: string;
  onSave: (captures: string[]) => void;
  onSkip: () => void;
};

/**
 * Optional evidence capture (house / business / loan-form pages).
 * Vision: ZERO or more captures, no minimum. Each accepted image is
 * persisted separately against the application and its person type.
 */
export function EvidenceCapture({ title, description, applicationId, captureType, onSave, onSkip }: Props) {
  const [captures, setCaptures] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFiles(files: FileList | null) {
    if (!files) return;
    Array.from(files).forEach((file) => {
      if (file.size > 10 * 1024 * 1024) return;
      const reader = new FileReader();
      reader.onload = () => setCaptures((prev) => [...prev, reader.result as string]);
      reader.readAsDataURL(file);
    });
  }

  async function save() {
    setSaving(true); setError("");
    try {
      for (let i = 0; i < captures.length; i++) {
        const res = await fetch("/api/branch/captures", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ applicationId, type: captureType, imageData: captures[i], pageNumber: captureType === "LOAN_FORM" ? i + 1 : null }),
        });
        if (!res.ok) throw new Error("Failed to save a capture");
      }
      onSave(captures);
    } catch {
      setError("Could not save captures. Please retry.");
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-medium text-white">{title}</h3>
        <p className="text-sm text-slate-500 mt-1">{description}</p>
        <p className="text-xs text-slate-600 mt-1">Zero or more captures allowed. Max 10 MB each. JPEG / PNG / PDF.</p>
      </div>

      {captures.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {captures.map((src, i) => (
            <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-slate-900 border border-slate-700">
              <img src={src} alt="" className="w-full h-full object-cover" />
              <button onClick={() => setCaptures((prev) => prev.filter((_, idx) => idx !== i))} className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white"><X className="w-3 h-3" /></button>
              <span className="absolute bottom-1 left-1 text-[10px] bg-black/60 text-white px-1.5 py-0.5 rounded">{captureType === "LOAN_FORM" ? `Page ${i + 1}` : `Capture ${i + 1}`}</span>
            </div>
          ))}
        </div>
      )}

      <input ref={inputRef} type="file" accept="image/jpeg,image/png,application/pdf" multiple capture="environment" className="hidden" onChange={(e) => handleFiles(e.target.files)} />
      <div className="flex gap-3">
        <button onClick={() => inputRef.current?.click()} disabled={saving} className="btn-secondary flex-1"><Plus className="w-4 h-4" /> Add Capture</button>
        <button onClick={save} disabled={saving} className="btn-primary flex-1">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
          {captures.length === 0 ? "Continue (0 captures)" : `Save ${captures.length} & Continue`}
        </button>
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button onClick={onSkip} disabled={saving} className="text-xs text-slate-500 hover:text-slate-300 w-full text-center">Skip this stage (zero captures)</button>
    </div>
  );
}
