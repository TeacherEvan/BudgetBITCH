// components/dashboard/daily-disposable-hero.tsx
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useWizardProfile } from '@/hooks/use-local-db';
import { useCurrency } from '@/hooks/use-currency';
import { calculateBudgetFromWizard } from '@/lib/utils/budget-calculator';

interface DailyDisposableHeroProps {
  locale: 'th' | 'en';
  onSetup?: () => void;
}

function useCountUp(target: number, duration = 600) {
  const [value, setValue] = useState(0);
  const raf = useRef<number | null>(null);
  useEffect(() => {
    const reduce = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      // Jump to target without animating; defer out of the effect body.
      const id = requestAnimationFrame(() => setValue(target));
      return () => cancelAnimationFrame(id);
    }
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(target * eased));
      if (t < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [target, duration]);
  return value;
}

function useClock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    // Defer the first read to a rAF so setState isn't called synchronously
    // inside the effect body (Next 16 ESLint: react-hooks/set-state-in-effect).
    const id = requestAnimationFrame(() => setNow(new Date()));
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => {
      cancelAnimationFrame(id);
      clearInterval(interval);
    };
  }, []);
  return now;
}

const MONTHS = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
const DAYS = ['SUN','MON','TUE','WED','THU','FRI','SAT'];

export function DailyDisposableHero({ locale, onSetup }: DailyDisposableHeroProps) {
  const formatCurrency = useCurrency();
  const { profile } = useWizardProfile();
  const now = useClock();

  const calculation = useMemo(() => {
    if (!profile) return null;
    return calculateBudgetFromWizard(profile);
  }, [profile]);

  const target = calculation?.dailyDisposable || 0;
  const counted = useCountUp(target);

  const income = calculation?.income || 0;
  const fixed = calculation?.totalFixedExpenses || 0;
  const savings = calculation?.savingsTarget || 0;

  const clockLabel = useMemo(() => {
    if (!now) return '';
    const d = DAYS[now.getDay()];
    const day = now.getDate();
    const mon = MONTHS[now.getMonth()];
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    return `${d} ${day} ${mon} • ${hh}:${mm} local`;
  }, [now]);

  const daysLeft = useMemo(() => {
    if (!now) return null;
    const year = now.getFullYear();
    const month = now.getMonth();
    const lastDay = new Date(year, month + 1, 0).getDate();
    return lastDay - now.getDate();
  }, [now]);

  if (!calculation) {
    return (
      <div className="bb-panel bb-panel-strong relative overflow-hidden p-6 md:p-8">
        <div className="relative z-10 flex flex-col items-center gap-4 text-center">
          <span className="bb-status-pill border border-[#E8A020]/40 bg-[#E8A020]/15 text-[#E8A020]">
            ⚠ {locale === 'th' ? 'ต้องตั้งค่า' : 'SETUP REQUIRED'}
          </span>
          <p className="text-sm text-[rgba(248,243,232,0.72)]">
            {locale === 'th' ? 'กรุณาเปิดตัวช่วยตั้งค่าเพื่อดูงบประจำวัน' : 'Run the setup wizard to see your daily budget.'}
          </p>
          <button
            type="button"
            onClick={() => onSetup?.()}
            className="bb-button-primary"
          >
            {locale === 'th' ? 'ตั้งค่าตอนนี้ →' : 'Complete Setup →'}
          </button>
        </div>
      </div>
    );
  }

  const isZero = target === 0;
  const pct = Math.min(100, Math.round((counted / Math.max(target, 1)) * 100));
  const barColor = pct >= 95 ? '#E84040' : pct >= 80 ? '#E8A020' : '#E8B020';

  return (
    <div className="bb-panel bb-panel-strong relative overflow-hidden p-6 md:p-8">
      <div className="relative z-10">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="bb-kicker">{locale === 'th' ? 'งบประจำวันที่เหลือ' : 'Daily Budget Remaining'}</span>
          <span className="bb-mono text-xs text-[rgba(248,243,232,0.44)]">{clockLabel}</span>
        </div>

        <div className="mt-3">
          <div
            className={`bb-mono text-[clamp(3rem,9vw,4.5rem)] font-bold leading-none ${isZero ? 'bb-shake text-[#E84040]' : 'text-[#E8B020]'}`}
            style={{ textShadow: isZero ? 'none' : '0 0 24px rgba(232,176,32,0.35)' }}
          >
            {formatCurrency(counted, locale)}
          </div>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full" style={{ background: 'rgba(248,243,232,0.12)' }}>
            <div
              className="h-full rounded-full transition-[width] duration-700 ease-out"
              style={{ width: `${pct}%`, background: barColor, boxShadow: `0 0 10px ${barColor}` }}
            />
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[rgba(248,243,232,0.5)]">
          <span>{locale === 'th' ? 'รายได้' : 'Income'}: {formatCurrency(income, locale)}/mo</span>
          <span>•</span>
          <span>{locale === 'th' ? 'ค่าคงที่' : 'Fixed'}: {formatCurrency(fixed, locale)}/mo</span>
          <span>•</span>
          <span>{locale === 'th' ? 'ออม' : 'Savings'}: {savings > 0 ? formatCurrency(savings, locale) : '0'}/mo</span>
        </div>

        {daysLeft !== null && (
          <div className="mt-3 flex items-center gap-2 text-sm text-[rgba(248,243,232,0.72)]">
            <span className="inline-block h-2 w-2 rounded-full bg-[#40C87A]" />
            {daysLeft} {locale === 'th' ? 'วันเหลือในเดือนนี้' : `days left in ${MONTHS[new Date().getMonth()]}`}
          </div>
        )}
      </div>
    </div>
  );
}
