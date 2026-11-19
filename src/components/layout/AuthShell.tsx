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
 * Cinematic auth experience (TikTok direction):
 * 1. Full-viewport black splash — brand + optional tagline
 * 2. Smooth white curve rising from bottom
 * 3. Login form on white body with black curved header
 *
 * Uses 100dvh so mobile browsers never leave a white gap.
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
    const t1 = setTimeout(() => setPhase("transition"), 2000);
    const t2 = setTimeout(() => setPhase("form"), 2900);
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
            transition={{ duration: 0.45 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black"
            style={{ minHeight: "100dvh", height: "100dvh" }}
          >
            <motion.h1
              initial={{ opacity: 0, y: 16, letterSpacing: "0.4em" }}
              animate={{ opacity: 1, y: 0, letterSpacing: "0.18em" }}
              transition={{ delay: 0.25, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              className="text-4xl sm:text-5xl font-bold text-white uppercase"
            >
              {brand}
            </motion.h1>
            {tagline && (
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.85, duration: 0.6 }}
                className="mt-5 text-sm sm:text-base text-white/55 font-light tracking-wide text-center px-8 max-w-sm"
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
                borderRadius: "100% 100% 0 0 / 45% 45% 0 0",
                y: "110%",
              }}
              animate={{
                borderRadius: "100% 100% 0 0 / 30% 30% 0 0",
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
        transition={{ duration: 0.4 }}
        className="flex flex-col"
        style={{ minHeight: "100dvh" }}
      >
        <div className="relative bg-black text-white pt-14 pb-20 px-6 shrink-0">
          <div className="max-w-md mx-auto">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-[0.14em] uppercase">
              {brand}
            </h1>
            {tagline && (
              <p className="mt-2 text-xs sm:text-sm text-white/50 font-light tracking-wide">
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
