// components/launch/golden-splash.tsx
'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { motion, useAnimationControls } from 'framer-motion';

const SPLASH_KEY = 'bb:splash-seen';

const TITLE = 'BUDGETBITCH'.split('');
const SUBTITLE = 'FINANCIAL DETOX SYSTEM';

const ENTRY_EASE = [0.16, 1, 0.3, 1] as const;
const EXIT_EASE = [0.7, 0, 1, 0.3] as const;

// Hydration-safe "seen" flag: server/first client render => false (don't show),
// real client render => read from sessionStorage. `show` is derived from this
// store value (never setState-in-effect), keeping SSR/CSR HTML identical.
function subscribeSeen() {
  return () => {};
}
function getSeenSnapshot(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return sessionStorage.getItem(SPLASH_KEY) === '1';
  } catch {
    return false;
  }
}

export function GoldenSplash({ onComplete }: { onComplete?: () => void }) {
  const seen = useSyncExternalStore(subscribeSeen, getSeenSnapshot, () => false);
  const [dismissed, setDismissed] = useState(false);
  const [ready, setReady] = useState(false);
  const controls = useAnimationControls();

  const show = !seen && !dismissed;

  // Mark as seen (external system sync) — no setState here, so no lint error.
  useEffect(() => {
    if (seen) return;
    try {
      sessionStorage.setItem(SPLASH_KEY, '1');
    } catch {
      /* ignore */
    }
    const t = setTimeout(() => setReady(true), 2800);
    return () => clearTimeout(t);
  }, [seen]);

  const handleProceed = async () => {
    await controls.start({
      scale: 0.96,
      opacity: 0,
      transition: { duration: 0.35, ease: EXIT_EASE },
    });
    setDismissed(true);
    onComplete?.();
  };

  if (!show) return null;

  return (
    <motion.div
      role="dialog"
      aria-label="BudgetBITCH"
      animate={controls}
      initial={{ opacity: 1 }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#080600] overflow-hidden"
      style={{ height: '100dvh' }}
    >
      {/* Expanding gold line */}
      <motion.div
        className="absolute left-0 right-0 top-1/2 h-px"
        initial={{ scaleX: 0, opacity: 0, x: '-50%', width: '100%' }}
        animate={{ scaleX: 1, opacity: 1, x: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        style={{
          background:
            'linear-gradient(90deg, transparent, #E8B020 20%, #F5D742 50%, #E8B020 80%, transparent)',
          boxShadow: '0 0 12px #E8B020',
          transformOrigin: 'center',
        }}
      />

      {/* Monogram + arc */}
      <div className="relative mb-6 flex flex-col items-center">
        <motion.svg
          width="120"
          height="120"
          viewBox="0 0 120 120"
          className="absolute -top-2"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.4, ease: ENTRY_EASE }}
        >
          <motion.circle
            cx="60"
            cy="60"
            r="48"
            fill="none"
            stroke="#C9960C"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 48}
            initial={{ strokeDashoffset: 2 * Math.PI * 48 }}
            animate={{ strokeDashoffset: 0 }}
            transition={{ duration: 0.9, delay: 0.5, ease: 'easeOut' }}
          />
        </motion.svg>
        <motion.div
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.45, ease: ENTRY_EASE }}
          className="font-display text-5xl font-bold text-[#F5D742]"
          style={{ textShadow: '0 0 18px rgba(245,215,66,0.45)' }}
        >
          BB
        </motion.div>
      </div>

      {/* Title — letters drop in */}
      <div className="flex" aria-hidden="true">
        {TITLE.map((ch, i) => (
          <motion.span
            key={`${ch}-${i}`}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.7 + i * 0.05, ease: ENTRY_EASE }}
            className="font-display text-2xl font-bold text-[#F8F3E8] sm:text-3xl"
            style={{ letterSpacing: '0.08em' }}
          >
            {ch}
          </motion.span>
        ))}
      </div>

      {/* Subtitle */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 1.3 }}
        className="mt-3 font-display text-xs font-medium uppercase text-[#8B6914]"
        style={{ letterSpacing: '0.15em' }}
      >
        {SUBTITLE}
      </motion.div>

      {/* Progress line */}
      <div className="absolute bottom-[22%] left-1/2 w-2/3 -translate-x-1/2">
        <div className="h-px w-full bg-white/10">
          <motion.div
            className="h-px w-full origin-left"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 2.8, ease: 'linear' }}
            style={{ background: '#E8B020', boxShadow: '0 0 12px #E8B020' }}
          />
        </div>
      </div>

      {/* CTA */}
      {ready && (
        <motion.button
          type="button"
          onClick={handleProceed}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: ENTRY_EASE }}
          whileHover={{ scale: 1.03, backgroundColor: '#E8B020', color: '#080600' }}
          className="absolute bottom-[12%] min-h-[44px] min-w-[200px] rounded-full border border-[#C9960C] bg-transparent px-6 font-display text-sm font-bold uppercase tracking-[0.12em] text-[#E8B020] transition-colors"
        >
          Click to Proceed
        </motion.button>
      )}
    </motion.div>
  );
}
