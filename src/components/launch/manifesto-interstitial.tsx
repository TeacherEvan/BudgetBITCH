"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ManifestoInterstitialProps {
  locale: "th" | "en";
  onDone: () => void;
}

const EN_LINES = [
  { text: "This app is for you.", emphasis: false },
  { text: "No BULLSHIT. No marketing. No tracking. Ever.", emphasis: true, highlight: "BULLSHIT" },
  { text: "Work smart. Not hard.", emphasis: false },
  { text: "Discipline is the only currency that doesn't depreciate.", emphasis: false },
  { text: "The time is now. Focus. SLAM the brakes.", emphasis: true, highlight: "SLAM" },
  { text: "Your financial detox has begun.", emphasis: true, highlight: "" },
];

const TH_LINES = [
  { text: "แอปนี้สร้างเพื่อคุณ", emphasis: false },
  { text: "ไม่มีการตลาด ไม่มีการโฆษณา ไม่มีการติดตาม เด็ดขาด", emphasis: true, highlight: "" },
  { text: "ทำงานอย่างฉลาด ไม่ใช่อย่างหนัก", emphasis: false },
  { text: "วินัยคือสิ่งที่ไม่มีวันเสื่อมค่า", emphasis: false },
  { text: "เวลานี้คือเวลาของคุณ จดจ่อ กดเบรค!", emphasis: true, highlight: "" },
  { text: "การล้างพิษทางการเงินของคุณได้เริ่มต้นแล้ว", emphasis: true, highlight: "" },
];

function formatLine(text: string, highlight: string) {
  if (!highlight) return <>{text}</>;
  const parts = text.split(highlight);
  return (
    <>
      {parts.map((part, i) => (
        <span key={i}>
          {part}
          {i < parts.length - 1 && (
            <span
              className="text-[#E84040] font-extrabold"
              style={{ animation: "bb-glitch 1.8s steps(2) infinite" }}
            >
              {highlight}
            </span>
          )}
        </span>
      ))}
    </>
  );
}

export function ManifestoInterstitial({ locale, onDone }: ManifestoInterstitialProps) {
  const lines = locale === "th" ? TH_LINES : EN_LINES;
  const [visibleLines, setVisibleLines] = useState(0);
  const [ctaUnlocked, setCtaUnlocked] = useState(false);
  const [exiting, setExiting] = useState(false);

  // Reveal lines one by one, then unlock CTA
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    lines.forEach((_, idx) => {
      timers.push(setTimeout(() => setVisibleLines(idx + 1), 300 + idx * 300));
    });
    // CTA unlocks 800ms after last line
    timers.push(setTimeout(() => setCtaUnlocked(true), 300 + lines.length * 300 + 800));
    return () => timers.forEach(clearTimeout);
  }, [lines]);

  const handleAcknowledge = () => {
    setExiting(true);
    // Parent marks the key after the exit animation
    setTimeout(onDone, 600);
  };

  return (
    <>
      <style>{`
        @keyframes bb-scanline-fast {
          0%   { background-position: 0 0; }
          100% { background-position: 0 6px; }
        }
        @keyframes bb-glitch {
          0%, 90%, 100% { opacity: 1; transform: skewX(0deg); }
          92%            { opacity: 0.7; transform: skewX(-4deg); }
          96%            { opacity: 0.9; transform: skewX(3deg); }
        }
        @keyframes bb-cta-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(201,150,12,0.55); }
          50%       { box-shadow: 0 0 0 8px rgba(201,150,12,0); }
        }
        @keyframes bb-attention-ping {
          0%   { transform: scale(1);   opacity: 1; }
          100% { transform: scale(2.2); opacity: 0; }
        }
      `}</style>

      <AnimatePresence>
        {!exiting && (
          <motion.div
            key="manifesto-gate"
            initial={{ opacity: 1 }}
            exit={{ y: "-100vh", opacity: 0, transition: { duration: 0.55, ease: [0.7, 0, 0.3, 1] } }}
            className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-[#080600] overflow-hidden"
            aria-modal="true"
            role="dialog"
            aria-label={locale === "th" ? "ข้อความสำคัญก่อนเริ่มใช้งาน" : "Important message before you begin"}
          >
            {/* Scanline cinema texture */}
            <div
              aria-hidden="true"
              className="absolute inset-0 pointer-events-none z-0"
              style={{
                backgroundImage: "repeating-linear-gradient(0deg, rgba(0,0,0,0.22) 0px, rgba(0,0,0,0.22) 1px, transparent 1px, transparent 6px)",
                animation: "bb-scanline-fast 0.25s steps(1) infinite",
              }}
            />

            {/* Radial background glow */}
            <div
              aria-hidden="true"
              className="absolute inset-0 pointer-events-none z-0"
              style={{
                background: "radial-gradient(circle 500px at 50% 40%, rgba(201,150,12,0.07) 0%, transparent 100%)",
              }}
            />

            <div className="relative z-10 w-full max-w-2xl px-6 md:px-12">
              {/* Header row */}
              <div className="flex items-center gap-4 mb-10">
                {/* Pulsing attention indicator */}
                <div className="relative flex-shrink-0">
                  <span
                    className="absolute inset-0 rounded-full bg-[#E8B020]/30"
                    style={{ animation: "bb-attention-ping 1.5s ease-out infinite" }}
                  />
                  <div className="relative w-11 h-11 rounded-full border border-[#C9960C] bg-[#1A1403] flex items-center justify-center">
                    <span className="text-[#E8B020] text-xl">⚡</span>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#C9960C] mb-0.5">
                    {locale === "th" ? "ก่อนเริ่มต้น — อ่านสิ่งนี้" : "Before you begin — read this"}
                  </p>
                  <h1
                    className="text-2xl md:text-3xl font-bold text-[#F8F3E8] tracking-tight"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {locale === "th" ? "คุยกันตรงๆ" : "Serious Talk"}
                  </h1>
                </div>
              </div>

              {/* Gold divider blade */}
              <div
                className="w-full h-[1px] mb-8"
                style={{
                  background: "linear-gradient(90deg, transparent 0%, #C9960C 20%, #F5D742 50%, #C9960C 80%, transparent 100%)",
                  boxShadow: "0 0 6px rgba(201,150,12,0.5)",
                }}
              />

              {/* Lines — stagger reveal */}
              <div className="space-y-4 mb-12 min-h-[260px]">
                {lines.map((line, idx) => (
                  <AnimatePresence key={idx}>
                    {visibleLines > idx && (
                      <motion.p
                        initial={{ opacity: 0, x: -16 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                        className={`leading-relaxed tracking-wide ${
                          line.emphasis
                            ? "text-base md:text-lg font-bold text-[#F8F3E8]"
                            : "text-sm md:text-base text-[#F8F3E8]/75"
                        } ${idx === lines.length - 1 ? "text-[#E8B020] font-semibold" : ""}`}
                      >
                        {line.highlight
                          ? formatLine(line.text, line.highlight)
                          : line.text}
                      </motion.p>
                    )}
                  </AnimatePresence>
                ))}
              </div>

              {/* CTA */}
              <div className="flex justify-end">
                <motion.button
                  disabled={!ctaUnlocked}
                  onClick={handleAcknowledge}
                  animate={ctaUnlocked ? { opacity: 1, y: 0 } : { opacity: 0.3, y: 4 }}
                  transition={{ duration: 0.4 }}
                  className="px-8 py-3 font-bold text-sm uppercase tracking-widest cursor-pointer disabled:cursor-not-allowed transition-colors duration-200"
                  style={{
                    fontFamily: "var(--font-display)",
                    background: ctaUnlocked ? "#C9960C" : "transparent",
                    color: ctaUnlocked ? "#080600" : "#8B6914",
                    border: "1px solid #C9960C",
                    animation: ctaUnlocked ? "bb-cta-pulse 1.8s ease-in-out infinite" : "none",
                  }}
                >
                  {locale === "th" ? "[ รับทราบ. เริ่มใช้งาน ]" : "[ I UNDERSTAND. LET'S GO. ]"}
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
