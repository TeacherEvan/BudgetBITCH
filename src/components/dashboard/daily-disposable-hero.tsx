// components/dashboard/daily-disposable-hero.tsx
'use client';

import { useMemo, useState, useEffect } from 'react';
import { useWizardProfile, useExpenses } from '@/hooks/use-local-db';
import { useCurrency } from '@/hooks/use-currency';
import { reconcileBudgetWithExpenses } from '@/lib/utils/budget-calculator';
import { motion } from 'framer-motion';
import { AddIncomeModal } from './add-income-modal';

interface DailyDisposableHeroProps {
  locale: string;
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

function LiveClock() {
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
      const formatted = now.toLocaleDateString('en-US', options);
      setTime(formatted.toUpperCase());
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return <span className="text-[10px] md:text-[11px] font-bold text-[var(--text-muted)] tracking-wider">{time} LOCAL</span>;
}

export function DailyDisposableHero({ locale, onSetup }: DailyDisposableHeroProps) {
  const formatCurrency = useCurrency();
  const { profile } = useWizardProfile();
  const { expenses } = useExpenses();
  const [isAddIncomeOpen, setIsAddIncomeOpen] = useState(false);

  const calculation = useMemo(() => {
    if (!profile || !profile.completed) return null;
    return reconcileBudgetWithExpenses(profile, expenses);
  }, [profile, expenses]);

  const daysLeft = useMemo(() => {
    const today = new Date();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    return daysInMonth - today.getDate();
  }, []);

  const monthName = useMemo(() => {
    const today = new Date();
    return today.toLocaleDateString('en-US', { month: 'long' });
  }, []);

  if (!calculation) {
    return (
      <div className="relative rounded-2xl border border-[var(--warning)]/30 bg-gradient-to-br from-[var(--warning)]/5 to-[var(--bg-base)] p-6 md:p-8 text-center overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(232,160,32,0.1),transparent_70%)] pointer-events-none" />
        <div className="relative z-10 flex flex-col items-center">
          <div className="flex items-center justify-between w-full mb-6">
            <span className="text-[10px] md:text-[11px] font-bold text-[var(--warning)] uppercase tracking-widest">
              ⚠ {'Setup Required'}
            </span>
            <LiveClock />
          </div>

          <div className="text-4xl md:text-5xl font-bold font-mono text-[var(--warning)] mb-4 bb-shake">
            {formatCurrency(0, locale)}
          </div>

          <p className="max-w-md text-sm text-[var(--text-2)] mb-6">
            {'Complete the setup wizard to calculate your customized daily disposable budget.'}
          </p>

          <button
            onClick={onSetup}
            className="px-6 py-2.5 bg-[var(--gold-base)] hover:bg-[var(--gold-bright)] active:scale-[0.97] transition-all text-[var(--accent-ink)] font-bold text-xs uppercase tracking-widest cursor-pointer"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {'Complete Setup →'}
          </button>
        </div>
      </div>
    );
  }

  const { income, totalFixedExpenses, savingsTarget, spentThisMonth, remainingDisposable, dailyRemaining, spentPct, isOverBudget } = calculation;

  // spentPct already clamped 0..100 in the reconciler; drive bar + color from it.
  const usagePercentage = spentPct;

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
            {'Daily Budget'}
          </span>
          <LiveClock />
        </div>
        
        {/* Main large figure with CountUp — the LIVE daily figure after real spending */}
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-3 sm:gap-4 mb-5 sm:mb-6">
          <div
            className={`text-[2.5rem] leading-[1.05] sm:text-5xl md:text-7xl font-bold font-mono tracking-tight break-words max-w-full bb-mono ${
              dailyRemaining === 0 || isOverBudget ? "text-[var(--danger)] bb-shake" : "text-[var(--gold-bright)]"
            }`}
          >
            <CountUp value={dailyRemaining} formatter={(val) => formatCurrency(Math.round(val), locale)} />
          </div>

          <div className="flex flex-row sm:flex-col sm:items-end items-center justify-between gap-2 rounded-xl border border-[var(--gold-border-soft)] bg-black/30 px-3 py-2 shrink-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--gold-muted)]">
              {'Spent This Month'}
            </span>
            <span className="text-base sm:text-lg md:text-xl font-bold font-mono text-rose-400">
              {formatCurrency(spentThisMonth, locale)}
            </span>
          </div>
        </div>

        {/* Usage bar — % of planned disposable already used */}
        <div className="w-full flex items-center justify-between text-xs text-[var(--text-muted)] mb-2 font-mono">
          <span>{'Budget Used'}</span>
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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 border-t border-[var(--gold-border-soft)] pt-4 text-xs font-medium">
          <div>
            <span className="block text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-0.5">
              {'Left Today'}
            </span>
            <span className="text-emerald-400 font-semibold font-mono">
              {formatCurrency(dailyRemaining, locale)}
            </span>
          </div>
          <div>
            <div className="flex items-center gap-1 mb-0.5">
              <span className="block text-[10px] text-[var(--text-muted)] uppercase tracking-wider">
                {'Income'}
              </span>
              <button 
                onClick={() => setIsAddIncomeOpen(true)}
                className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 transition-colors px-1"
                title={'Add Income'}
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
              {'Fixed'}
            </span>
            <span className="text-[var(--text-1)] font-semibold font-mono">
              {formatCurrency(totalFixedExpenses, locale)}/mo
            </span>
          </div>
          <div>
            <span className="block text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-0.5">
              {'Savings'}
            </span>
            <span className="text-[var(--text-1)] font-semibold font-mono">
              {formatCurrency(savingsTarget, locale)}/mo
            </span>
          </div>
        </div>

        {/* Footer date anchor */}
        <div className="flex items-center gap-1.5 mt-4 text-[11px] text-[var(--text-muted)] font-medium">
          <span className={`w-1.5 h-1.5 rounded-full ${isOverBudget ? "bg-[var(--danger)] animate-pulse" : "bg-[var(--success)]"}`} />
          <span>
            {isOverBudget
              ? (`Over budget by ${formatCurrency(Math.abs(remainingDisposable), locale)}`)
              : (`${daysLeft} days left in ${monthName}`)}
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
