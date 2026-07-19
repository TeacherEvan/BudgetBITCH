// components/launch/manifesto-notification.tsx
'use client';

import { useState, useSyncExternalStore } from 'react';
import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';

const MANIFESTO_KEY = 'bb:manifesto-v1';

const LINES_EN = [
  'No BULLSHIT. No marketing.',
  'Work smart — not hard.',
  'Discipline is key.',
  "Don't be a lazy WORM depending on charity.",
  'The time is NOW. Focus.',
  'SLAM THE BRAKES.',
  'Your financial detox has begun.',
];

const LINES_TH = [
  'ไม่มีขี้โม้ ไม่มีการตลาด',
  'ทำงานฉลาด ไม่ใช่หนัก',
  'วินัยคือหัวใจ',
  'อย่าปล่อยให้ตัวเองเป็นพยาธิ์ที่พึ่งพาผู้อื่น',
  'เวลาคือตอนนี้ จดจ่อ',
  'เหยียบเบรกให้แรง',
  'การดีท็อกซ์การเงินของคุณเริ่มแล้ว',
];

// Hydration-safe "seen" flag: server/first render => false (show banner),
// real client render => read from localStorage. `show` is derived, so we
// never call setState synchronously inside an effect (Next 16 lint rule).
function subscribeSeen() {
  return () => {};
}
function getSeenSnapshot(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(MANIFESTO_KEY) === '1';
  } catch {
    return false;
  }
}

interface ManifestoNotificationProps {
  locale: 'th' | 'en';
  onDismiss?: () => void;
}

export function ManifestoNotification({ locale, onDismiss }: ManifestoNotificationProps) {
  const seen = useSyncExternalStore(subscribeSeen, getSeenSnapshot, () => false);
  const [dismissed, setDismissed] = useState(false);

  const show = !seen && !dismissed;

  const dismiss = () => {
    try {
      localStorage.setItem(MANIFESTO_KEY, '1');
    } catch {
      /* ignore */
    }
    setDismissed(true);
    onDismiss?.();
  };

  if (!show) return null;

  const lines = locale === 'th' ? LINES_TH : LINES_EN;

  return (
    <motion.div
      initial={{ y: '-100%', opacity: 0 }}
      animate={{ y: 0, opacity: 1, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } }}
      exit={{ y: '-100%', opacity: 0, transition: { duration: 0.35, ease: [0.7, 0, 1, 0.3] } }}
      role="status"
      data-testid="manifesto-banner"
      className="bb-manifesto relative flex items-stretch gap-4 overflow-hidden rounded-2xl border-l-4 border-l-[#E8B020] px-4 py-3"
      style={{
        background:
          'linear-gradient(90deg, rgba(201,150,12,0.05), rgba(8,6,0,0.0) 70%), #110D01',
      }}
    >
      {/* Pulsing icon */}
      <div className="flex shrink-0 items-center">
        <motion.div
          className="bb-pulse-ring flex h-12 w-12 items-center justify-center rounded-full"
          style={{ border: '1px solid rgba(232,176,32,0.4)' }}
        >
          <Zap className="h-6 w-6 text-[#E8B020]" />
        </motion.div>
      </div>

      <div className="min-w-0 flex-1">
        <p className="mb-1 font-display text-xs font-bold uppercase tracking-[0.15em] text-[#E8B020]">
          {locale === 'th' ? 'ประกาศ' : 'THIS APP IS FOR YOU'}
        </p>
        <ul className="space-y-0.5">
          {lines.map((line, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0, transition: { duration: 0.25, delay: 0.15 + i * 0.03, ease: [0.16, 1, 0.3, 1] } }}
              className="text-sm text-[#F8F3E8]"
            >
              {line}
            </motion.li>
          ))}
        </ul>
      </div>

      <div className="flex shrink-0 items-center">
        <button
          type="button"
          onClick={dismiss}
          className="bb-button-primary min-h-[44px] px-4 text-sm"
        >
          {locale === 'th' ? "พร้อมแล้ว" : "I'M READY"}
        </button>
      </div>
    </motion.div>
  );
}
