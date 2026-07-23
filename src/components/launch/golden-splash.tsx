"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface GoldenSplashProps {
  onProceed: () => void;
}

// Particle element for floating money & gold particles
function Particle({ style, char }: { style: React.CSSProperties; char: string }) {
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute bottom-0 text-amber-400/30 text-xl md:text-2xl font-black opacity-0 select-none"
      style={style}
    >
      {char}
    </span>
  );
}

// Deterministic particles generated outside the component to adhere to react-hooks/purity
const PARTICLES = Array.from({ length: 16 }, (_, i) => {
  const characters = ["🪙", "💵", "$"];
  return {
    id: i,
    char: characters[i % characters.length],
    style: {
      left: `${4 + i * 6.2}%`,
      animationDelay: `${(i * 0.22).toFixed(2)}s`,
      animationDuration: `${3.2 + (i % 4) * 0.5}s`,
      animationName: "bb-particle-float",
      animationTimingFunction: "ease-out",
      animationIterationCount: "infinite",
    } as React.CSSProperties,
  };
});

const budgetLetters = Array.from("BUDGET");
const bossLetters = Array.from("BOSS");

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.15,
    },
  },
};

const letterVariants = {
  hidden: {
    opacity: 0,
    y: -90,
    scale: 2.2,
    rotateX: -90,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    rotateX: 0,
    transition: {
      type: "spring" as const,
      damping: 9,
      stiffness: 150,
    },
  },
};

export function GoldenSplash({ onProceed }: GoldenSplashProps) {
  const [phase, setPhase] = useState<"reckoning" | "statement" | "invitation">("reckoning");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("statement"), 400);
    const t2 = setTimeout(() => setPhase("invitation"), 1800);
    const t3 = setTimeout(() => setReady(true), 2400);
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
          0%   { transform: translateY(0) scale(0.6) rotate(0deg); opacity: 0; }
          15%  { opacity: 0.6; }
          80%  { opacity: 0.4; }
          100% { transform: translateY(-85vh) scale(1.1) rotate(360deg); opacity: 0; }
        }
        @keyframes bb-glow-pulse {
          0%, 100% { text-shadow: 0 0 16px rgba(245,215,66,0.5), 0 0 40px rgba(245,215,66,0.2); }
          50%       { text-shadow: 0 0 36px rgba(245,215,66,0.95), 0 0 90px rgba(245,215,66,0.45); }
        }
        @keyframes bb-cta-breathe {
          0%, 100% { box-shadow: 0 0 0 0 rgba(245,215,66,0.6), inset 0 0 0 1px rgba(245,215,66,0.7); }
          50%       { box-shadow: 0 0 28px 8px rgba(245,215,66,0.35), inset 0 0 0 1px rgba(255,255,255,1); }
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
        {/* Floating Money & Gold Particles */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {PARTICLES.map((p) => (
            <Particle key={p.id} style={p.style} char={p.char} />
          ))}
        </div>

        {/* Cinematic Ambient Gold Radial Glows */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          animate={{
            opacity: phase === "reckoning" ? 0.08 : phase === "statement" ? 0.28 : 0.2,
          }}
          transition={{ duration: 0.8 }}
          style={{
            background: "radial-gradient(circle 750px at 50% 50%, #F5D742 0%, #C9960C 25%, transparent 80%)",
          }}
        />

        {/* Scanline Overlay */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none z-10"
          style={{
            backgroundImage: "repeating-linear-gradient(0deg, rgba(0,0,0,0.22) 0px, rgba(0,0,0,0.22) 1px, transparent 1px, transparent 4px)",
            animation: "bb-scanline 0.3s steps(1) infinite",
          }}
        />

        {/* Main Content Area */}
        <div className="relative flex flex-col items-center w-full max-w-xl px-6 z-20 text-center">

          {/* Monogram Crest */}
          <motion.div
            initial={{ opacity: 0, scale: 0.3, y: 20 }}
            animate={
              phase !== "reckoning"
                ? { opacity: 1, scale: 1, y: 0 }
                : { opacity: 0, scale: 0.3, y: 20 }
            }
            transition={{ type: "spring", stiffness: 380, damping: 18, delay: 0 }}
            className="relative mb-6 flex justify-center"
          >
            <motion.div
              className="absolute inset-0 rounded-full pointer-events-none"
              animate={phase === "statement" ? { opacity: [0, 0.7, 0] } : { opacity: 0 }}
              transition={{ duration: 1.2, delay: 0.1 }}
              style={{
                background: "radial-gradient(circle 70px at 50% 50%, #F5D742 0%, transparent 70%)",
                filter: "blur(10px)",
              }}
            />
            <svg className="w-20 h-20 drop-shadow-[0_0_20px_rgba(245,215,66,0.6)]" viewBox="0 0 100 100">
              <motion.path
                d="M 18,50 A 32,32 0 1,1 82,50 A 32,32 0 0,1 18,50"
                fill="none"
                stroke="#F5D742"
                strokeWidth="2"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={phase !== "reckoning" ? { pathLength: 1 } : { pathLength: 0 }}
                transition={{ duration: 0.9, ease: "easeInOut", delay: 0.1 }}
              />
              <text
                x="50"
                y="58"
                textAnchor="middle"
                className="font-black fill-[#F5D742]"
                fontSize="22"
                style={{ fontFamily: "var(--font-space-grotesk, sans-serif)", letterSpacing: "-0.04em" }}
              >
                BB
              </text>
            </svg>
          </motion.div>

          {/* Top Metallic Blade Accent Line */}
          <motion.div
            initial={{ scaleX: 0, originX: 0 }}
            animate={phase !== "reckoning" ? { scaleX: 1 } : { scaleX: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
            className="w-full h-[2px] mb-6"
            style={{
              background: "linear-gradient(90deg, transparent 0%, #C9960C 30%, #F5D742 50%, #C9960C 70%, transparent 100%)",
              boxShadow: "0 0 12px #F5D742",
            }}
          />

          {/* 3D Staggered Letter Slam: BUDGET on Line 1, BOSS on Line 2 */}
          <div className="flex flex-col items-center gap-1 select-none" style={{ perspective: "1000px" }}>
            {/* LINE 1: BUDGET */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate={phase !== "reckoning" ? "visible" : "hidden"}
              className="flex justify-center text-4xl md:text-6xl font-black uppercase tracking-widest text-white font-space-grotesk"
            >
              {budgetLetters.map((letter, idx) => (
                <motion.span
                  key={idx}
                  variants={letterVariants}
                  className="inline-block transform-gpu filter drop-shadow-[0_4px_12px_rgba(255,255,255,0.2)]"
                  style={{ transformOrigin: "bottom center" }}
                >
                  {letter}
                </motion.span>
              ))}
            </motion.div>

            {/* LINE 2: BOSS */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate={phase !== "reckoning" ? "visible" : "hidden"}
              className="flex justify-center text-5xl md:text-7xl font-black uppercase tracking-[0.3em] bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-600 bg-clip-text text-transparent font-space-grotesk"
              style={{
                animation: phase === "invitation" ? "bb-glow-pulse 2.4s ease-in-out infinite" : "none",
              }}
            >
              {bossLetters.map((letter, idx) => (
                <motion.span
                  key={idx}
                  variants={letterVariants}
                  className="inline-block transform-gpu filter drop-shadow-[0_6px_30px_rgba(245,215,66,0.65)]"
                  style={{ transformOrigin: "bottom center" }}
                >
                  {letter}
                </motion.span>
              ))}
            </motion.div>
          </div>

          {/* ACT 3: SHOUTED SLOGAN BANNER */}
          <AnimatePresence>
            {phase === "invitation" && (
              <motion.div
                initial={{ scale: 0, rotate: -15, opacity: 0 }}
                animate={{ scale: 1, rotate: -2, opacity: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ type: "spring", stiffness: 240, damping: 11 }}
                className="mt-6 inline-block rounded-2xl border-2 border-[#F5D742] bg-zinc-950 px-6 py-2.5 shadow-[0_0_35px_rgba(245,215,66,0.3)] animate-pulse"
              >
                <span 
                  className="text-sm md:text-base font-black uppercase tracking-widest bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 bg-clip-text text-transparent filter drop-shadow font-space-grotesk"
                >
                  &ldquo;Shut up and do it!!!&rdquo;
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bottom Blade Line */}
          <motion.div
            initial={{ scaleX: 0, originX: 1 }}
            animate={phase !== "reckoning" ? { scaleX: 1 } : { scaleX: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
            className="w-2/3 h-[1px] mt-8 mb-8"
            style={{
              background: "linear-gradient(90deg, transparent 0%, #C9960C 40%, transparent 100%)",
              opacity: 0.6,
            }}
          />

          {/* CTA ENTER BUTTON */}
          <div className="h-16 flex items-center justify-center">
            <AnimatePresence>
              {ready && (
                <motion.button
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -14 }}
                  transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                  onClick={onProceed}
                  className="relative px-9 py-3 text-black bg-[#F5D742] font-black text-sm tracking-widest uppercase cursor-pointer transition-all duration-200 hover:bg-amber-300 hover:scale-105 active:scale-[0.97] rounded-xl shadow-[0_0_25px_rgba(245,215,66,0.4)]"
                  style={{
                    fontFamily: "var(--font-space-grotesk, sans-serif)",
                    animation: "bb-cta-breathe 2s ease-in-out infinite",
                  }}
                >
                  [ ENTER BOSS MODE ]
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </>
  );
}
