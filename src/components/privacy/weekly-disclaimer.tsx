// components/privacy/weekly-disclaimer.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';

const STORAGE_KEY = 'budgetbitch:privacyDisclaimerWeek';

const LABELS = {
  th: {
    title: 'ความเป็นส่วนตัวของคุณ คือคำมั่นสัญญาของเรา',
    body: 'ไม่มีข้อมูลส่วนตัวใดออกจากโทรศัพท์ของคุณ ข้อมูลส่วนตัวทั้งหมดถูกเข้ารหัสก่อนถึงเซิร์ฟเวอร์ของเรา',
    learnMore: 'เรียนรู้วิธีที่ข้อมูลของคุณปลอดภัย →',
    dismiss: 'รับทราบ',
  },
  en: {
    title: 'Your privacy, our promise',
    body: 'No personal information leaves your phone. All private data is encrypted before it ever reaches our servers.',
    learnMore: 'Learn how your data is secured →',
    dismiss: 'Got it',
  },
} as const;

function currentIsoWeek(): string {
  const d = new Date();
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - dayNum + 3);
  const firstThursday = new Date(Date.UTC(date.getUTCFullYear(), 0, 4));
  const week =
    1 +
    Math.round(
      ((date.getTime() - firstThursday.getTime()) / 86400000 -
        3 +
        ((firstThursday.getUTCDay() + 6) % 7)) /
        7,
    );
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

export function WeeklyPrivacyDisclaimer({ locale }: { locale: 'th' | 'en' }) {
  const l = LABELS[locale];
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof localStorage === 'undefined') return;
    const acknowledged = localStorage.getItem(STORAGE_KEY);
    if (acknowledged !== currentIsoWeek()) {
      setOpen(true);
    }
  }, []);

  const acknowledge = () => {
    try {
      localStorage.setItem(STORAGE_KEY, currentIsoWeek());
    } catch {
      // ignore storage failures (private mode)
    }
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      data-testid="privacy-disclaimer"
      role="dialog"
      aria-modal="true"
      aria-label={l.title}
    >
      <div className="w-full max-w-md rounded-2xl border border-[rgba(201,150,12,0.3)] bg-[#0a0a0a] p-6 shadow-2xl">
        <div className="mb-3 flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-[#E8B020]" />
          <h2 className="text-sm font-bold uppercase tracking-widest text-[#C9960C]">{l.title}</h2>
        </div>
        <p className="mb-5 text-sm leading-relaxed text-white/70">{l.body}</p>
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/security"
            data-testid="privacy-learn-more"
            className="text-xs font-semibold text-[#E8B020] underline-offset-2 hover:underline"
          >
            {l.learnMore}
          </Link>
          <button
            type="button"
            data-testid="privacy-gotit-btn"
            onClick={acknowledge}
            className="rounded-xl bg-[#C9960C] px-5 py-2.5 text-xs font-bold text-[#080600] transition-colors hover:bg-[#F5D742]"
          >
            {l.dismiss}
          </button>
        </div>
      </div>
    </div>
  );
}
