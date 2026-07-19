"use client";

import { motion } from "framer-motion";

interface ManifestoNotificationProps {
  locale: 'th' | 'en';
  onDismiss: () => void;
}

export function ManifestoNotification({ locale, onDismiss }: ManifestoNotificationProps) {
  const lines = [
    "This app is for you,... no *BULLSHIT* NO MARKETING.",
    "Work smart! Not hard!",
    "Diicipline is key, dont be a lazy WORM depending on charity.",
    "The time is now... Focus... SLAM the breaks!",
    "Your finanacial detox has begun..."
  ];

  return (
    <div className="relative w-full bg-[#110D01] border border-[#C9960C]/35 rounded-xl overflow-hidden mb-4">
      {/* Subtle gold glow behind content */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_left,rgba(201,150,12,0.06),transparent_50%)] pointer-events-none" />
      
      <div className="px-4 py-5 md:px-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
        <div className="flex items-start gap-4">
          {/* Pulsing Alert Icon */}
          <div className="relative mt-1 md:mt-0 flex-shrink-0">
            <span className="absolute inset-0 rounded-full bg-[#E8B020]/20 animate-ping" />
            <div className="relative w-10 h-10 rounded-full border border-[#C9960C] flex items-center justify-center bg-[#1A1403]">
              <span className="text-[#E8B020] text-lg font-bold">⚡</span>
            </div>
          </div>

          {/* Typographic layout */}
          <div className="flex flex-col gap-1 text-[#F8F3E8] max-w-3xl">
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-[#E8B020] mb-1">
              ⚡ {locale === 'th' ? 'คำชี้แจงผู้เริ่มใช้งาน' : '⚡ ATTENTION ⚡'}
            </h3>
            {lines.map((line, index) => {
              // Format the *BULLSHIT* text
              const formattedLine = line.split("*BULLSHIT*").map((part, partIdx, arr) => (
                <span key={partIdx}>
                  {part}
                  {partIdx < arr.length - 1 && (
                    <span className="text-[#E84040] font-extrabold animate-pulse">BULLSHIT</span>
                  )}
                </span>
              ));

              return (
                <motion.p
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 + index * 0.1 }}
                  className={`text-sm md:text-base leading-relaxed tracking-wide ${
                    index === 0 ? "font-bold" : ""
                  } ${index === 3 || index === 4 ? "text-[#E8B020] font-medium" : "text-[#F8F3E8]/85"}`}
                >
                  {formattedLine}
                </motion.p>
              );
            })}
          </div>
        </div>

        {/* CTA */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <button
            onClick={onDismiss}
            className="px-5 py-2 bg-[#C9960C] text-[#080600] font-bold text-xs uppercase tracking-widest hover:bg-[#E8B020] active:scale-[0.97] transition-all cursor-pointer whitespace-nowrap"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {locale === 'th' ? '[ รับทราบ. เริ่มใช้งาน ]' : "[ I UNDERSTAND. LET'S GO. ]"}
          </button>
        </div>
      </div>
    </div>
  );
}
