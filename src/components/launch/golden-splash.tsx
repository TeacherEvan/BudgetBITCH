"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface GoldenSplashProps {
  onProceed: () => void;
}

// CSS-only particle element — floats upward, fades out
function Particle({ style }: { style: React.CSSProperties }) {
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute bottom-0 rounded-full bg-[#E8B020] opacity-0"
      style={style}
    />
  );
}

const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  style: {
    width: `${2 + (i % 3)}px`,
    height: `${2 + (i % 3)}px`,
    left: `${5 + i * 5.2}%`,
    animationDelay: `${(i * 0.18).toFixed(2)}s`,
    animationDuration: `${2.8 + (i % 5) * 0.4}s`,
    animationName: "bb-particle-float",
    animationTimingFunction: "ease-out",
    animationIterationCount: "infinite",
  } as React.CSSProperties,
}));

const titleLetters = Array.from("BUDGETBITCH");

export function GoldenSplash({ onProceed }: GoldenSplashProps) {
  const [phase, setPhase] = useState<"reckoning" | "statement" | "invitation">("reckoning");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("statement"), 600);
    const t2 = setTimeout(() => setPhase("invitation"), 2200);
    const t3 = setTimeout(() => setReady(true), 2800);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  return (
    <>
      {/* Particle float keyframes injected via style tag */}
      <style>{`
        @keyframes bb-particle-float {
          0%   { transform: translateY(0) scale(1); opacity: 0; }
          10%  { opacity: 0.7; }
          80%  { opacity: 0.3; }
          100% { transform: translateY(-80vh) scale(0.3); opacity: 0; }
        }
        @keyframes bb-glow-pulse {
          0%, 100% { text-shadow: 0 0 12px rgba(232,176,32,0.4), 0 0 30px rgba(232,176,32,0.15); }
          50%       { text-shadow: 0 0 32px rgba(232,176,32,0.9), 0 0 80px rgba(232,176,32,0.35); }
        }
        @keyframes bb-cta-breathe {
          0%, 100% { box-shadow: 0 0 0 0 rgba(201,150,12,0.5), inset 0 0 0 1px rgba(201,150,12,0.6); }
          50%       { box-shadow: 0 0 24px 6px rgba(201,150,12,0.25), inset 0 0 0 1px rgba(201,150,12,1); }
        }
        @keyframes bb-scanline {
          0%   { background-position: 0 0; }
          100% { background-position: 0 8px; }
        }
      `}</style>

      <div
        data-testid="golden-splash"
        className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#080600] text-[#F8F3E8] overflow-hidden select-none"
      >
        {/* === ACT 1: THE RECKONING — particle field always present === */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {PARTICLES.map((p) => (
            <Particle key={p.id} style={p.style} />
          ))}
        </div>

        {/* Radial gold pulse — intensifies in statement phase */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          animate={{
            opacity: phase === "reckoning" ? 0.05 : phase === "statement" ? 0.22 : 0.14,
          }}
          transition={{ duration: 0.9 }}
          style={{
            background: "radial-gradient(circle 700px at 50% 52%, #C9960C 0%, transparent 100%)",
          }}
        />

        {/* Scanline overlay — cinema texture */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none z-10"
          style={{
            backgroundImage: "repeating-linear-gradient(0deg, rgba(0,0,0,0.18) 0px, rgba(0,0,0,0.18) 1px, transparent 1px, transparent 4px)",
            animation: "bb-scanline 0.3s steps(1) infinite",
          }}
        />

        {/* === ACT 2: THE STATEMENT === */}
        <div className="relative flex flex-col items-center w-full max-w-lg px-6 z-20 text-center">

          {/* Monogram crest — springs in with overshoot */}
          <motion.div
            initial={{ opacity: 0, scale: 0.3, y: 20 }}
            animate={
              phase !== "reckoning"
                ? { opacity: 1, scale: 1, y: 0 }
                : { opacity: 0, scale: 0.3, y: 20 }
            }
            transition={{ type: "spring", stiffness: 380, damping: 18, delay: 0 }}
            className="relative mb-5 flex justify-center"
          >
            {/* Gold bloom burst behind crest */}
            <motion.div
              className="absolute inset-0 rounded-full pointer-events-none"
              animate={phase === "statement" ? { opacity: [0, 0.6, 0] } : { opacity: 0 }}
              transition={{ duration: 1.2, delay: 0.15 }}
              style={{
                background: "radial-gradient(circle 60px at 50% 50%, #E8B020 0%, transparent 70%)",
                filter: "blur(8px)",
              }}
            />
            <svg className="w-20 h-20 drop-shadow-[0_0_16px_rgba(232,176,32,0.5)]" viewBox="0 0 100 100">
              <motion.path
                d="M 18,50 A 32,32 0 1,1 82,50 A 32,32 0 0,1 18,50"
                fill="none"
                stroke="#C9960C"
                strokeWidth="1.5"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={phase !== "reckoning" ? { pathLength: 1 } : { pathLength: 0 }}
                transition={{ duration: 1.0, ease: "easeInOut", delay: 0.1 }}
              />
              <text
                x="50"
                y="58"
                textAnchor="middle"
                className="font-bold fill-[#E8B020]"
                fontSize="22"
                style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.04em" }}
              >
                BB
              </text>
            </svg>
          </motion.div>

          {/* Blade line sweeps left → right */}
          <motion.div
            initial={{ scaleX: 0, originX: 0 }}
            animate={phase !== "reckoning" ? { scaleX: 1 } : { scaleX: 0 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
            className="w-full h-[1px] mb-5"
            style={{
              background: "linear-gradient(90deg, transparent 0%, #C9960C 30%, #F5D742 50%, #C9960C 70%, transparent 100%)",
              boxShadow: "0 0 8px #E8B020",
            }}
          />

          {/* BUDGETBITCH letter-drop */}
          <h1
            className="text-4xl md:text-5xl font-bold tracking-[0.28em] flex justify-center mb-3"
            style={{
              fontFamily: "var(--font-display)",
              animation: phase === "invitation" ? "bb-glow-pulse 2.4s ease-in-out infinite" : "none",
            }}
          >
            {titleLetters.map((letter, idx) => (
              <motion.span
                key={idx}
                initial={{ opacity: 0, y: -24 }}
                animate={phase !== "reckoning" ? { opacity: 1, y: 0 } : { opacity: 0, y: -24 }}
                transition={{
                  duration: 0.35,
                  delay: 0.15 + idx * 0.06,
                  ease: [0.16, 1, 0.3, 1],
                }}
              >
                {letter}
              </motion.span>
            ))}
          </h1>

          {/* === ACT 3: THE INVITATION === */}
          <AnimatePresence>
            {phase === "invitation" && (
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                className="text-xs md:text-sm tracking-[0.12em] uppercase font-medium mb-10 max-w-xs leading-relaxed"
                style={{ color: "#8B6914" }}
              >
                No bullshit. No marketing.<br />Just your money.
              </motion.p>
            )}
          </AnimatePresence>

          {/* Blade line bottom — mirrors top */}
          <motion.div
            initial={{ scaleX: 0, originX: 1 }}
            animate={phase !== "reckoning" ? { scaleX: 1 } : { scaleX: 0 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1], delay: 0.25 }}
            className="w-2/3 h-[1px] mb-10"
            style={{
              background: "linear-gradient(90deg, transparent 0%, #C9960C 40%, transparent 100%)",
              opacity: 0.5,
            }}
          />

          {/* CTA button — breathing animation once ready */}
          <div className="h-14 flex items-center justify-center">
            <AnimatePresence>
              {ready && (
                <motion.button
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                  onClick={onProceed}
                  className="relative px-8 py-2.5 text-[#F8F3E8] bg-transparent font-semibold text-sm tracking-widest uppercase cursor-pointer transition-colors duration-200 hover:text-[#080600] hover:bg-[#C9960C] active:scale-[0.97]"
                  style={{
                    fontFamily: "var(--font-display)",
                    animation: "bb-cta-breathe 2s ease-in-out infinite",
                  }}
                >
                  [ ENTER ]
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </>
  );
}
