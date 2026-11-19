"use client";

import { useState, useEffect, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Props = {
  /** Primary brand word shown on splash and black curve (e.g. "Nexora", company name) */
  brand: string;
  /** Line under the brand on the login header */
  subtitle: string;
  /** Title above the form fields */
  formTitle: string;
  children: ReactNode;
  /** Skip splash animation (e.g. after failed login) */
  skipSplash?: boolean;
};

/**
 * TikTok-style auth experience:
 * 1. Full black splash with brand name only
 * 2. Smooth white curve expands from bottom
 * 3. Login form on white body with black curved header
 */
export function AuthShell({ brand, subtitle, formTitle, children, skipSplash }: Props) {
  const [phase, setPhase] = useState<"splash" | "transition" | "form">(
    skipSplash ? "form" : "splash"
  );

  useEffect(() => {
    if (skipSplash) return;
    const t1 = setTimeout(() => setPhase("transition"), 1600);
    const t2 = setTimeout(() => setPhase("form"), 2400);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [skipSplash]);

  return (
    <div className="min-h-screen relative overflow-hidden bg-white">
      <AnimatePresence mode="wait">
        {phase === "splash" && (
          <motion.div
            key="splash"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-black"
          >
            <motion.h1
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="text-4xl sm:text-5xl font-bold tracking-[0.15em] text-white uppercase"
            >
              {brand}
            </motion.h1>
          </motion.div>
        )}

        {phase === "transition" && (
          <motion.div
            key="transition"
            className="absolute inset-0 z-50 bg-black"
            initial={{ clipPath: "inset(0% 0% 0% 0%)" }}
            animate={{ clipPath: "inset(0% 0% 100% 0%)" }}
            transition={{ duration: 0.75, ease: [0.65, 0, 0.35, 1] }}
          >
            {/* White curve rising */}
            <motion.div
              className="absolute left-0 right-0 bottom-0 h-[55%] bg-white"
              initial={{ borderRadius: "100% 100% 0 0 / 40% 40% 0 0", y: "100%" }}
              animate={{ borderRadius: "100% 100% 0 0 / 28% 28% 0 0", y: 0 }}
              transition={{ duration: 0.75, ease: [0.65, 0, 0.35, 1] }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Final login layout */}
      <motion.div
        initial={skipSplash ? false : { opacity: 0 }}
        animate={{ opacity: phase === "form" ? 1 : 0 }}
        transition={{ duration: 0.35 }}
        className="min-h-screen flex flex-col"
      >
        {/* Black curved header */}
        <div className="relative bg-black text-white pt-14 pb-16 px-6 shrink-0">
          <div className="max-w-md mx-auto">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-[0.12em] uppercase">
              {brand}
            </h1>
            <p className="mt-2 text-sm text-white/60">{subtitle}</p>
          </div>
          {/* Curve into white */}
          <div
            className="absolute left-0 right-0 bottom-0 h-10 bg-white"
            style={{ borderRadius: "50% 50% 0 0 / 100% 100% 0 0" }}
          />
        </div>

        {/* White body form */}
        <div className="flex-1 bg-white px-6 pb-10 -mt-2">
          <div className="max-w-md mx-auto pt-4">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">{formTitle}</h2>
            {children}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
