"use client";

import { motion } from "framer-motion";

export type ChartPoint = { label: string; expected: number; realised: number };

type Props = {
  data: ChartPoint[];
  height?: number;
};

/**
 * Simple animated dual-series area chart (expected vs realised).
 * No external chart library — pure SVG for reliability.
 */
export function TrendChart({ data, height = 180 }: Props) {
  if (!data.length) {
    return (
      <div
        className="flex items-center justify-center rounded-2xl bg-slate-50 border border-slate-100 text-sm text-slate-400"
        style={{ height }}
      >
        No collection data yet
      </div>
    );
  }

  const w = 600;
  const h = height;
  const pad = { t: 16, r: 12, b: 28, l: 8 };
  const innerW = w - pad.l - pad.r;
  const innerH = h - pad.t - pad.b;

  const maxY = Math.max(
    1,
    ...data.map((d) => Math.max(d.expected, d.realised))
  );

  const x = (i: number) =>
    pad.l + (data.length === 1 ? innerW / 2 : (i / (data.length - 1)) * innerW);
  const y = (v: number) => pad.t + innerH - (v / maxY) * innerH;

  function pathFor(key: "expected" | "realised") {
    return data
      .map((d, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(d[key]).toFixed(1)}`)
      .join(" ");
  }

  function areaFor(key: "expected" | "realised") {
    const line = pathFor(key);
    const last = data.length - 1;
    return `${line} L ${x(last).toFixed(1)} ${y(0).toFixed(1)} L ${x(0).toFixed(1)} ${y(0).toFixed(1)} Z`;
  }

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto" preserveAspectRatio="none">
        <motion.path
          d={areaFor("expected")}
          fill="rgba(15,23,42,0.06)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
        />
        <motion.path
          d={pathFor("expected")}
          fill="none"
          stroke="#94a3b8"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 as any }}
          animate={{ pathLength: 1 as any }}
          transition={{ duration: 1.1, ease: "easeOut" }}
        />
        <motion.path
          d={areaFor("realised")}
          fill="rgba(16,185,129,0.12)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.15 }}
        />
        <motion.path
          d={pathFor("realised")}
          fill="none"
          stroke="#10b981"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 as any }}
          animate={{ pathLength: 1 as any }}
          transition={{ duration: 1.2, ease: "easeOut", delay: 0.1 }}
        />
        {data.map((d, i) => (
          <text
            key={d.label}
            x={x(i)}
            y={h - 6}
            textAnchor="middle"
            className="fill-slate-400"
            style={{ fontSize: 10 }}
          >
            {d.label}
          </text>
        ))}
      </svg>
      <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 bg-slate-400 rounded" /> Expected
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 bg-emerald-500 rounded" /> Realised
        </span>
      </div>
    </div>
  );
}
