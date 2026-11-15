"use client";

import { useState, useRef } from "react";
import { Camera, Plus, X, Image as ImageIcon } from "lucide-react";

type Props = {
  title: string;
  description: string;
  onSave: (captures: string[]) => void;
  onSkip: () => void;
};

/**
 * Optional evidence capture (house / business / loan form pages).
 * Vision: ZERO or more captures. No minimum.
 */
export function EvidenceCapture({ title, description, onSave, onSkip }: Props) {
  const [captures, setCaptures] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFiles(files: FileList | null) {
    if (!files) return;
    Array.from(files).forEach((file) => {
      if (file.size > 10 * 1024 * 1024) return; // 10MB limit from vision
      const reader = new FileReader();
      reader.onload = () => {
        setCaptures((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
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
              <button
                onClick={() => setCaptures((prev) => prev.filter((_, idx) => idx !== i))}
                className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,application/pdf"
        multiple
        capture="environment"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      <div className="flex gap-3">
        <button onClick={() => inputRef.current?.click()} className="btn-secondary flex-1">
          <Plus className="w-4 h-4" /> Add Capture
        </button>
        <button onClick={() => onSave(captures)} className="btn-primary flex-1">
          {captures.length === 0 ? "Continue (0 captures)" : `Save ${captures.length} & Continue`}
        </button>
      </div>
      <button onClick={onSkip} className="text-xs text-slate-500 hover:text-slate-300 w-full text-center">
        Skip this stage
      </button>
    </div>
  );
}
