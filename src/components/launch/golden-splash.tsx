"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface GoldenSplashProps {
  onProceed: () => void;
}

export function GoldenSplash({ onProceed }: GoldenSplashProps) {
  const [progress, setProgress] = useState(0);
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    const duration = 2800; // 2.8 seconds
    const intervalTime = 30;
    const step = (intervalTime / duration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setComplete(true);
          return 100;
        }
        return prev + step;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, []);

  const titleLetters = Array.from("BUDGETBITCH");

  return (
    <div
      data-testid="golden-splash"
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#080600] text-[#F8F3E8] overflow-hidden select-none"
    >
      {/* Radial gold background burst */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-25"
        style={{
          background: "radial-gradient(circle 600px at 50% 50%, #C9960C 0%, transparent 100%)",
        }}
      />

      <div className="relative flex flex-col items-center w-full max-w-lg px-6 z-10 text-center">
        {/* Monogram / Crest */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.4 }}
          className="relative mb-6 flex justify-center"
        >
          <svg className="w-24 h-24" viewBox="0 0 100 100">
            {/* Crest border arc */}
            <motion.path
              d="M 20,50 A 30,30 0 1,1 80,50 A 30,30 0 0,1 20,50"
              fill="none"
              stroke="#C9960C"
              strokeWidth="2"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.5, ease: "easeInOut", delay: 0.6 }}
            />
            {/* Monogram letters "BB" */}
            <text
              x="50"
              y="58"
              textAnchor="middle"
              className="font-bold text-2xl fill-[#E8B020] tracking-tighter"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              BB
            </text>
          </svg>
        </motion.div>

        {/* Central horizontal line expanding */}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: "100%" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="h-[1px] bg-gradient-to-r from-transparent via-[#C9960C] to-transparent mb-6"
        />

        {/* BUDGETBITCH letter-by-letter entry */}
        <h1 
          className="text-4xl md:text-5xl font-bold tracking-[0.25em] flex justify-center mb-2"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {titleLetters.map((letter, idx) => (
            <motion.span
              key={idx}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.4,
                delay: 0.8 + idx * 0.05,
                ease: [0.16, 1, 0.3, 1],
              }}
              className={letter === " " ? "mr-4" : ""}
            >
              {letter}
            </motion.span>
          ))}
        </h1>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.6 }}
          className="text-xs tracking-[0.15em] text-[#8B6914] uppercase font-medium mb-12"
        >
          Financial Detox System
        </motion.p>

        {/* Progress Bar Container */}
        <div className="relative w-48 h-[2px] bg-white/10 rounded-full overflow-hidden mb-8">
          <div
            className="absolute top-0 bottom-0 left-0 bg-[#E8B020]"
            style={{ 
              width: `${progress}%`,
              boxShadow: "0 0 12px #E8B020"
            }}
          />
        </div>

        {/* Click to proceed button */}
        <div className="h-12 flex items-center justify-center">
          <AnimatePresence>
            {complete && (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                onClick={onProceed}
                className="px-6 py-2 border border-[#C9960C] text-[#F8F3E8] bg-transparent font-semibold text-sm tracking-widest uppercase hover:bg-[#C9960C] hover:text-[#080600] active:scale-[0.97] transition-all duration-200 cursor-pointer"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                [ Click to Proceed ]
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
