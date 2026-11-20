"use client";

import { useState, useEffect, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Props = {
  brand: string;
  tagline?: string;
  subtitle: string;
  formTitle: string;
  children: ReactNode;
  skipSplash?: boolean;
};

/**
 * TikTok / SLATE style:
 * 1. Full black splash — brand only (held 5 seconds)
 * 2. Smooth white curve rising from bottom
 * 3. Login form: black curved header + white body
 */
export function AuthShell({
  brand,
  tagline,
  subtitle,
  formTitle,
  children,
  skipSplash,
}: Props) {
  const [phase, setPhase] = useState<"splash" | "transition" | "form">(
    skipSplash ? "form" : "splash"
  );

  useEffect(() => {
    if (skipSplash) return;
    // Hold splash for 5 seconds, then animate transition (~0.85s)
    const t1 = setTimeout(() => setPhase("transition"), 5000);
    const t2 = setTimeout(() => setPhase("form"), 5850);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [skipSplash]);

  return (
    <div
      className="relative overflow-hidden bg-white"
      style={{ minHeight: "100dvh", height: "100dvh" }}
    >
      <AnimatePresence mode="wait">
        {phase === "splash" && (
          <motion.div
            key="splash"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black"
            style={{ minHeight: "100dvh", height: "100dvh", width: "100%" }}
          >
            <motion.h1
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="text-4xl sm:text-5xl font-bold text-white tracking-[0.2em] uppercase"
            >
              {brand}
            </motion.h1>
            {tagline && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.1, duration: 0.7 }}
                className="mt-6 text-sm sm:text-[15px] text-white/50 font-light tracking-wide text-center px-8 max-w-xs leading-relaxed"
              >
                {tagline}
              </motion.p>
            )}
          </motion.div>
        )}

        {phase === "transition" && (
          <motion.div
            key="transition"
            className="fixed inset-0 z-50 bg-black"
            style={{ minHeight: "100dvh", height: "100dvh" }}
            initial={{ clipPath: "inset(0 0 0 0)" }}
            animate={{ clipPath: "inset(0 0 100% 0)" }}
            transition={{ duration: 0.85, ease: [0.65, 0, 0.35, 1] }}
          >
            <motion.div
              className="absolute left-0 right-0 bottom-0 bg-white"
              style={{ height: "58%" }}
              initial={{
                borderRadius: "100% 100% 0 0 / 48% 48% 0 0",
                y: "110%",
              }}
              animate={{
                borderRadius: "100% 100% 0 0 / 28% 28% 0 0",
                y: 0,
              }}
              transition={{ duration: 0.85, ease: [0.65, 0, 0.35, 1] }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={skipSplash ? false : { opacity: 0 }}
        animate={{ opacity: phase === "form" ? 1 : 0 }}
        transition={{ duration: 0.35 }}
        className="flex flex-col"
        style={{ minHeight: "100dvh" }}
      >
        <div className="relative bg-black text-white pt-14 pb-20 px-6 shrink-0">
          <div className="max-w-md mx-auto">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-[0.16em] uppercase">
              {brand}
            </h1>
            {tagline && (
              <p className="mt-2 text-xs sm:text-sm text-white/45 font-light tracking-wide">
                {tagline}
              </p>
            )}
            <p className="mt-3 text-sm text-white/65">{subtitle}</p>
          </div>
          <div
            className="absolute left-0 right-0 bottom-0 h-12 bg-white"
            style={{ borderRadius: "50% 50% 0 0 / 100% 100% 0 0" }}
          />
        </div>

        <div className="flex-1 bg-white px-6 pb-12 -mt-1">
          <div className="max-w-md mx-auto pt-2">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">{formTitle}</h2>
            {children}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
