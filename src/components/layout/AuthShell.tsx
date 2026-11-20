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
 * Exact TikTok / DailyFlutterUI "SLATE" login experience:
 *
 * 1. SPLASH (5 seconds): pure solid black, ONLY the brand word in white.
 *    No icon, no shield, no progress bar, no extra decoration.
 * 2. TRANSITION: white curved shape expands upward from the bottom;
 *    black recedes with a soft curved edge.
 * 3. LOGIN: solid black curved top header + pure white body,
 *    soft grey inputs, solid black button.
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
    const toTransition = setTimeout(() => setPhase("transition"), 5000);
    const toForm = setTimeout(() => setPhase("form"), 5850);
    return () => {
      clearTimeout(toTransition);
      clearTimeout(toForm);
    };
  }, [skipSplash]);

  return (
    <div
      className="relative overflow-hidden bg-white"
      style={{ minHeight: "100dvh", height: "100dvh", width: "100%" }}
    >
      <AnimatePresence mode="wait">
        {/* ===== 1. SPLASH: solid black + brand word only ===== */}
        {phase === "splash" && (
          <motion.div
            key="splash"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center"
            style={{
              background: "#000000",
              minHeight: "100dvh",
              height: "100dvh",
              width: "100%",
            }}
          >
            <motion.h1
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                delay: 0.25,
                duration: 0.75,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="text-white font-bold uppercase"
              style={{
                fontSize: "clamp(2rem, 8vw, 3.25rem)",
                letterSpacing: "0.2em",
                color: "#ffffff",
              }}
            >
              {brand}
            </motion.h1>
            {tagline ? (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.0, duration: 0.65 }}
                className="mt-6 text-center px-8 max-w-xs font-light"
                style={{
                  color: "rgba(255,255,255,0.5)",
                  fontSize: "0.9rem",
                  letterSpacing: "0.02em",
                  lineHeight: 1.5,
                }}
              >
                {tagline}
              </motion.p>
            ) : null}
          </motion.div>
        )}

        {/* ===== 2. TRANSITION: white curve rises from bottom ===== */}
        {phase === "transition" && (
          <motion.div
            key="transition"
            className="fixed inset-0 z-50"
            style={{
              background: "#000000",
              minHeight: "100dvh",
              height: "100dvh",
            }}
            initial={{ clipPath: "inset(0 0 0 0)" }}
            animate={{ clipPath: "inset(0 0 100% 0)" }}
            transition={{ duration: 0.85, ease: [0.65, 0, 0.35, 1] }}
          >
            <motion.div
              className="absolute left-0 right-0 bottom-0"
              style={{
                background: "#ffffff",
                height: "58%",
              }}
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

      {/* ===== 3. LOGIN FORM: black curve header + white body ===== */}
      <motion.div
        initial={skipSplash ? false : { opacity: 0 }}
        animate={{ opacity: phase === "form" ? 1 : 0 }}
        transition={{ duration: 0.35 }}
        className="flex flex-col"
        style={{ minHeight: "100dvh" }}
      >
        <div
          className="relative shrink-0 text-white px-6 pt-14 pb-20"
          style={{ background: "#000000" }}
        >
          <div className="max-w-md mx-auto">
            <h1
              className="font-bold uppercase"
              style={{
                fontSize: "clamp(1.5rem, 5vw, 1.875rem)",
                letterSpacing: "0.16em",
                color: "#ffffff",
              }}
            >
              {brand}
            </h1>
            {tagline ? (
              <p
                className="mt-2 font-light"
                style={{
                  color: "rgba(255,255,255,0.45)",
                  fontSize: "0.8rem",
                  letterSpacing: "0.02em",
                }}
              >
                {tagline}
              </p>
            ) : null}
            <p
              className="mt-3"
              style={{ color: "rgba(255,255,255,0.65)", fontSize: "0.9rem" }}
            >
              {subtitle}
            </p>
          </div>
          {/* Curve into white body */}
          <div
            className="absolute left-0 right-0 bottom-0"
            style={{
              height: "48px",
              background: "#ffffff",
              borderRadius: "50% 50% 0 0 / 100% 100% 0 0",
            }}
          />
        </div>

        <div className="flex-1 px-6 pb-12 -mt-1" style={{ background: "#ffffff" }}>
          <div className="max-w-md mx-auto pt-2">
            <h2
              className="font-bold mb-6"
              style={{ color: "#0f172a", fontSize: "1.5rem" }}
            >
              {formTitle}
            </h2>
            {children}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
