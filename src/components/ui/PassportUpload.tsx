"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Upload, Camera, X, Check, Image as ImageIcon } from "lucide-react";

type Props = {
  value: string;
  onChange: (dataUrl: string) => void;
  label?: string;
};

/**
 * Passport upload: gallery/file or live camera. Stored as a data URL on the
 * worker identity (passportReference) — no external URL is required.
 */
export function PassportUpload({ value, onChange, label = "Passport" }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");

  function read(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("Please choose an image file"); return; }
    if (file.size > 8 * 1024 * 1024) { setError("Image must be 8 MB or smaller"); return; }
    setError("");
    const reader = new FileReader();
    reader.onload = () => onChange(reader.result as string);
    reader.readAsDataURL(file);
  }

  return (
    <div>
      <label className="label">{label}</label>
      <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => read(e.target.files?.[0])} />
      <input ref={cameraRef} type="file" accept="image/*" capture="user" className="hidden" onChange={(e) => read(e.target.files?.[0])} />

      {value ? (
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-3 rounded-2xl bg-slate-100 border border-slate-200 p-3">
          <img src={value} alt="Passport preview" className="w-14 h-14 rounded-xl object-cover border border-slate-200" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-slate-700 flex items-center gap-1"><Check className="w-3.5 h-3.5 text-emerald-500" /> Passport captured</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Stored securely on the worker identity.</p>
          </div>
          <button type="button" onClick={() => onChange("")} className="p-2 rounded-lg text-slate-400 hover:bg-slate-200" aria-label="Remove passport"><X className="w-4 h-4" /></button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={() => fileRef.current?.click()} className="flex flex-col items-center justify-center gap-2 py-5 rounded-2xl border border-dashed border-slate-300 text-slate-500 hover:bg-slate-50 hover:border-sky-300 transition-colors">
            <ImageIcon className="w-5 h-5" />
            <span className="text-xs font-medium">Gallery / file</span>
          </button>
          <button type="button" onClick={() => cameraRef.current?.click()} className="flex flex-col items-center justify-center gap-2 py-5 rounded-2xl border border-dashed border-slate-300 text-slate-500 hover:bg-slate-50 hover:border-sky-300 transition-colors">
            <Camera className="w-5 h-5" />
            <span className="text-xs font-medium">Take photo</span>
          </button>
        </div>
      )}
      {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
      <p className="text-[11px] text-slate-400 mt-2 flex items-center gap-1"><Upload className="w-3 h-3" /> JPEG, PNG or WebP · max 8 MB</p>
    </div>
  );
}
