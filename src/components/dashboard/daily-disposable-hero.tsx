// components/dashboard/daily-disposable-hero.tsx
'use client';

import { useMemo, useState, useEffect } from 'react';
import { useWizardProfile } from '@/hooks/use-local-db';
import { useCurrency } from '@/hooks/use-currency';
import { calculateBudgetFromWizard } from '@/lib/utils/budget-calculator';
import { motion } from 'framer-motion';
import { AddIncomeModal } from './add-income-modal';

interface DailyDisposableHeroProps {
  locale: 'th' | 'en';
  onSetup?: () => void;
}

function CountUp({ value, duration = 800, formatter }: { value: number; duration?: number; formatter: (val: number) => string }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    let animationFrameId: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      setDisplayValue(progress * value);
      if (progress < 1) {
        animationFrameId = window.requestAnimationFrame(step);
      }
    };
    animationFrameId = window.requestAnimationFrame(step);

    return () => {
      if (animationFrameId) {
        window.cancelAnimationFrame(animationFrameId);
      }
    };
  }, [value, duration]);

  return <span>{formatter(displayValue)}</span>;
}

function LiveClock({ locale }: { locale: 'th' | 'en' }) {
  const [time, setTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      };
      const formatted = now.toLocaleDateString(locale === 'th' ? 'th-TH' : 'en-US', options);
      setTime(formatted.toUpperCase());
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [locale]);

  return <span className="text-[10px] md:text-[11px] font-bold text-[var(--text-muted)] tracking-wider">{time} LOCAL</span>;
}

export function DailyDisposableHero({ locale, onSetup }: DailyDisposableHeroProps) {
  const formatCurrency = useCurrency();
  const { profile } = useWizardProfile();
  const [isAddIncomeOpen, setIsAddIncomeOpen] = useState(false);

  const calculation = useMemo(() => {
    if (!profile || !profile.completed) return null;
    return calculateBudgetFromWizard(profile);
  }, [profile]);

  const daysLeft = useMemo(() => {
    const today = new Date();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    return daysInMonth - today.getDate();
  }, []);

  const monthName = useMemo(() => {
    const today = new Date();
    return today.toLocaleDateString(locale === 'th' ? 'th-TH' : 'en-US', { month: 'long' });
  }, [locale]);

  if (!calculation) {
    return (
      <div className="relative rounded-2xl border border-[var(--warning)]/30 bg-gradient-to-br from-[var(--warning)]/5 to-[var(--bg-base)] p-6 md:p-8 text-center overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(232,160,32,0.1),transparent_70%)] pointer-events-none" />
        <div className="relative z-10 flex flex-col items-center">
          <div className="flex items-center justify-between w-full mb-6">
            <span className="text-[10px] md:text-[11px] font-bold text-[var(--warning)] uppercase tracking-widest">
              ⚠ {locale === 'th' ? 'ต้องทำการตั้งค่า' : 'Setup Required'}
            </span>
            <LiveClock locale={locale} />
          </div>

          <div className="text-4xl md:text-5xl font-bold font-mono text-[var(--warning)] mb-4 bb-shake">
            {formatCurrency(0, locale)}
          </div>

          <p className="max-w-md text-sm text-[var(--text-2)] mb-6">
            {locale === 'th'
              ? 'โปรดทำแบบสอบถามตั้งค่าให้เสร็จสิ้นเพื่อคำนวณงบประมาณรายวันของคุณ'
              : 'Complete the setup wizard to calculate your customized daily disposable budget.'}
          </p>

          <button
            onClick={onSetup}
            className="px-6 py-2.5 bg-[var(--gold-base)] hover:bg-[var(--gold-bright)] active:scale-[0.97] transition-all text-[var(--accent-ink)] font-bold text-xs uppercase tracking-widest cursor-pointer"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {locale === 'th' ? 'เริ่มตั้งค่าเลย →' : 'Complete Setup →'}
          </button>
        </div>
      </div>
    );
  }

  const { dailyDisposable, income, totalFixedExpenses, savingsTarget, remainingDisposable } = calculation;

  const usagePercentage = income > 0 ? Math.max(0, Math.min(100, Math.round(((income - remainingDisposable) / income) * 100))) : 0;
  
  // Decide usage bar color class based on percent
  let barColorClass = "bg-[var(--gold-bright)]";
  if (usagePercentage >= 95) {
    barColorClass = "bg-[var(--danger)]";
  } else if (usagePercentage >= 80) {
    barColorClass = "bg-[var(--warning)]";
  }

  return (
    <div className="relative rounded-2xl border border-[var(--gold-border-strong)] bg-gradient-to-br from-[var(--bg-surface-2)] to-[var(--bg-surface-1)] p-6 md:p-8 overflow-hidden">
      {/* Glow effect based on spending pressure */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          background: usagePercentage >= 95 
            ? "radial-gradient(circle at center, rgba(232,64,64,0.12) 0%, transparent 70%)"
            : usagePercentage >= 80
            ? "radial-gradient(circle at center, rgba(232,160,32,0.12) 0%, transparent 70%)"
            : "radial-gradient(circle at center, rgba(201,150,12,0.12) 0%, transparent 70%)",
        }}
      />
      
      <div className="relative z-10 flex flex-col">
        {/* Header strip */}
        <div className="flex items-center justify-between w-full mb-4">
          <span className="text-[10px] md:text-[11px] font-bold text-[var(--gold-muted)] uppercase tracking-wider">
            {locale === 'th' ? 'งบประมาณรายวัน' : 'Daily Budget'}
          </span>
          <LiveClock locale={locale} />
        </div>
        
        {/* Main large figure with CountUp */}
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 mb-6">
          <div 
            className={`text-3xl sm:text-5xl md:text-7xl font-bold font-mono tracking-tight leading-none break-all max-w-full overflow-hidden text-ellipsis bb-mono ${
              dailyDisposable === 0 ? "text-[var(--danger)] bb-shake" : "text-[var(--gold-bright)]"
            }`}
          >
            <CountUp value={dailyDisposable} formatter={(val) => formatCurrency(Math.round(val), locale)} />
          </div>

          <div className="flex flex-col sm:items-end rounded-xl border border-[var(--gold-border-soft)] bg-black/30 px-3 py-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--gold-muted)]">
              {locale === 'th' ? 'เงินคงเหลือใช้ได้' : 'Funds Available'}
            </span>
            <span className="text-base sm:text-lg md:text-xl font-bold font-mono text-emerald-400">
              {formatCurrency(remainingDisposable, locale)}
            </span>
          </div>
        </div>

        {/* Usage bar */}
        <div className="w-full flex items-center justify-between text-xs text-[var(--text-muted)] mb-2 font-mono">
          <span>{locale === 'th' ? 'การจัดสรรงบประมาณ' : 'Budget Allocation'}</span>
          <span className={`${usagePercentage >= 95 ? "text-[var(--danger)]" : usagePercentage >= 80 ? "text-[var(--warning)]" : "text-[var(--gold-bright)]"}`}>
            ({usagePercentage}%)
          </span>
        </div>
        <div className="w-full h-[6px] bg-white/12 rounded-full overflow-hidden mb-6">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${usagePercentage}%` }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className={`h-full ${barColorClass} rounded-full`}
            style={{
              boxShadow: usagePercentage >= 95 
                ? "0 0 10px rgba(232,64,64,0.4)"
                : usagePercentage >= 80
                ? "0 0 10px rgba(232,160,32,0.4)"
                : "0 0 10px rgba(201,150,12,0.4)"
            }}
          />
        </div>

        {/* Supporting metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-[var(--gold-border-soft)] pt-4 text-xs font-medium">
          <div>
            <span className="block text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-0.5">
              {locale === 'th' ? 'ใช้ได้ทั้งหมด' : 'Funds Avail.'}
            </span>
            <span className="text-emerald-400 font-semibold font-mono">
              {formatCurrency(remainingDisposable, locale)}
            </span>
          </div>
          <div>
            <div className="flex items-center gap-1 mb-0.5">
              <span className="block text-[10px] text-[var(--text-muted)] uppercase tracking-wider">
                {locale === 'th' ? 'รายได้' : 'Income'}
              </span>
              <button 
                onClick={() => setIsAddIncomeOpen(true)}
                className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 transition-colors px-1"
                title={locale === 'th' ? 'เพิ่มรายได้' : 'Add Income'}
              >
                +
              </button>
            </div>
            <span className="text-[var(--text-1)] font-semibold font-mono">
              {formatCurrency(income, locale)}/mo
            </span>
          </div>
          <div>
            <span className="block text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-0.5">
              {locale === 'th' ? 'คงที่' : 'Fixed'}
            </span>
            <span className="text-[var(--text-1)] font-semibold font-mono">
              {formatCurrency(totalFixedExpenses, locale)}/mo
            </span>
          </div>
          <div>
            <span className="block text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-0.5">
              {locale === 'th' ? 'การออม' : 'Savings'}
            </span>
            <span className="text-[var(--text-1)] font-semibold font-mono">
              {formatCurrency(savingsTarget, locale)}/mo
            </span>
          </div>
        </div>

        {/* Footer date anchor */}
        <div className="flex items-center gap-1.5 mt-4 text-[11px] text-[var(--text-muted)] font-medium">
          <span className={`w-1.5 h-1.5 rounded-full ${dailyDisposable === 0 ? "bg-[var(--danger)] animate-pulse" : "bg-[var(--success)]"}`} />
          <span>
            {locale === 'th'
              ? `เหลืออีก ${daysLeft} วันในเดือน${monthName}`
              : `${daysLeft} days left in ${monthName}`}
          </span>
        </div>
      </div>
      <AddIncomeModal
        isOpen={isAddIncomeOpen}
        onClose={() => setIsAddIncomeOpen(false)}
        locale={locale}
      />
    </div>
  );
}
