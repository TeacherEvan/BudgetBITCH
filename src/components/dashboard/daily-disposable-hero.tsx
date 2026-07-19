// components/dashboard/daily-disposable-hero.tsx
'use client';

import { useMemo } from 'react';
import { useWizardProfile } from '@/hooks/use-local-db';
import { useCurrency } from '@/hooks/use-currency';
import { calculateBudgetFromWizard } from '@/lib/utils/budget-calculator';

interface DailyDisposableHeroProps {
  locale: 'th' | 'en';
}

export function DailyDisposableHero({ locale }: DailyDisposableHeroProps) {
  const formatCurrency = useCurrency();

  const { profile } = useWizardProfile();

  const calculation = useMemo(() => {
    if (!profile) return null;
    return calculateBudgetFromWizard(profile);
  }, [profile]);

  const formatted = formatCurrency(calculation?.dailyDisposable || 0, locale);
  const incomeFormatted = formatCurrency(calculation?.income || 0, locale);
  const fixedFormatted = formatCurrency(calculation?.totalFixedExpenses || 0, locale);

  if (!calculation) {
    return (
      <div className="relative rounded-2xl border border-amber-400/30 bg-gradient-to-br from-amber-400/10 to-amber-900/5 p-6 md:p-8 text-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(251,191,36,0.15),transparent_70%)]" />
        <div className="relative z-10">
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-2xl">💵</span>
            <span className="text-sm font-medium text-amber-400 uppercase tracking-wider">
              {locale === 'th' ? 'เงินใช้จ่ายได้วันละ' : 'Daily Spending Money 💵'}
            </span>
          </div>
          <div className="text-5xl md:text-7xl xl:text-8xl font-bold font-mono text-amber-400 leading-none">
            {formatCurrency(0, locale)}
          </div>
          <p className="mt-2 text-white/60 text-sm">
            {locale === 'th' ? 'โปรดทำแบบสอบถามตั้งค่าให้เสร็จสิ้น' : 'Complete setup wizard to see daily budget'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative rounded-2xl border border-amber-400/30 bg-gradient-to-br from-amber-400/10 to-amber-900/5 p-6 md:p-8 text-center">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(251,191,36,0.15),transparent_70%)]" />
      
      <div className="relative z-10">
        <div className="flex items-center justify-center gap-2 mb-4">
          <span className="text-2xl">💵</span>
          <span className="text-sm font-medium text-amber-400 uppercase tracking-wider">
            {locale === 'th' ? 'เงินใช้จ่ายได้วันละ' : 'Daily Spending Money 💵'}
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
          <span>Income: {incomeFormatted}/mo</span>
          <span>•</span>
          <span>Fixed: {fixedFormatted}/mo</span>
          <span>•</span>
          <span>Savings: {calculation.savingsTarget > 0 ? formatCurrency(calculation.savingsTarget, locale) : '0'}/mo</span>
        </div>
      </div>
    </div>
  );
}