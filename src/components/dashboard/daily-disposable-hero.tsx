// components/dashboard/daily-disposable-hero.tsx
'use client';

import { useMemo } from 'react';
import { useWizardProfile, useBudgets } from '@/hooks/use-local-db';
import { formatCurrency } from '@/lib/utils/currency';

interface DailyDisposableHeroProps {
  locale: 'th' | 'en';
}

export function DailyDisposableHero({ locale }: DailyDisposableHeroProps) {
  const { profile } = useWizardProfile();
  const { budgets } = useBudgets();

  const dailyDisposable = useMemo(() => {
    if (!profile) return 0;
    
    const income = profile.answers.income || 0;
    const fixedExpenses = [
      'rent', 'transport', 'phoneInternet', 'subscriptions', 
      'healthcare'
    ].reduce((sum, key) => sum + (profile.answers[key as keyof typeof profile.answers] as number || 0), 0);
    
    const savingsAmount = income * ((profile.answers.savingsRatePct || 0) / 100);
    
    const disposableMonthly = income - fixedExpenses - savingsAmount;
    const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
    
    return Math.max(0, disposableMonthly / daysInMonth);
  }, [profile]);

  const formatted = formatCurrency(dailyDisposable, locale);

  return (
    <div className="relative rounded-2xl border border-amber-400/30 bg-gradient-to-br from-amber-400/10 to-amber-900/5 p-6 md:p-8 text-center">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(251,191,36,0.15),transparent_70%)]" />
      
      <div className="relative z-10">
        <div className="flex items-center justify-center gap-2 mb-4">
          <span className="text-2xl">💵</span>
          <span className="text-sm font-medium text-amber-400 uppercase tracking-wider">
            {locale === 'th' ? 'เงินใช้จ่ายต่อวัน' : 'Daily Disposable'}
          </span>
        </div>
        
        <div className="text-5xl md:text-7xl xl:text-8xl font-bold font-mono text-amber-400 leading-none">
          {formatted}
        </div>
        
        <p className="mt-2 text-white/60 text-sm">
          {locale === 'th' 
            ? `เหลือใช้วันละ ${formatted} หลังหักค่าคงที่และออม`
            : `${formatted}/day after fixed costs & savings`}
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-white/50">
          <span>Income: {formatCurrency(profile?.answers.income || 0, locale)}/mo</span>
          <span>•</span>
          <span>Fixed: {formatCurrency(
            ['rent', 'transport', 'phoneInternet', 'subscriptions', 'healthcare']
              .reduce((sum, key) => sum + (profile?.answers[key as keyof typeof profile.answers] as number || 0), 0)
            , locale)}/mo</span>
          <span>•</span>
          <span>Savings: {(profile?.answers.savingsRatePct || 0)}%</span>
        </div>
      </div>
    </div>
  );
}