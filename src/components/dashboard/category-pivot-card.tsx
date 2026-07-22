// src/components/dashboard/category-pivot-card.tsx
'use client';

import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { formatMoney, type CurrencyCode } from '@/lib/utils/currency';
import type { ExpenseEntry, WizardProfile } from '@/lib/types/budget';
import { PieChart, Layers, Users } from 'lucide-react';

interface CategoryPivotCardProps {
  expenses?: ExpenseEntry[];
  profile?: WizardProfile | null;
  currency?: CurrencyCode | null;
  locale?: 'th' | 'en';
}

type PivotMode = '50-30-20' | 'personal-vs-shared';

export function CategoryPivotCard({
  expenses = [],
  profile,
  currency = 'THB',
  locale = 'en',
}: CategoryPivotCardProps) {
  const isTh = locale === 'th';
  const [pivotMode, setPivotMode] = useState<PivotMode>('50-30-20');

  const income = profile?.answers?.income ?? 45000;

  // 50/30/20 Calculations
  const breakdown503020 = useMemo(() => {
    const needsCategories = ['housing', 'debt', 'groceries', 'utilities', 'phone_internet', 'transport', 'insurance', 'healthcare'];
    const wantsCategories = ['food', 'entertainment', 'subscriptions', 'other'];

    let totalNeeds = 0;
    let totalWants = 0;
    let totalSavings = 0;

    expenses.forEach(e => {
      if (needsCategories.includes(e.category)) {
        totalNeeds += e.amount;
      } else if (wantsCategories.includes(e.category)) {
        totalWants += e.amount;
      } else {
        totalSavings += e.amount;
      }
    });

    if (expenses.length === 0) {
      totalNeeds = income * 0.48;
      totalWants = income * 0.28;
      totalSavings = income * 0.24;
    }

    const totalSpent = totalNeeds + totalWants + totalSavings;

    return {
      needs: {
        actual: totalNeeds,
        target: income * 0.5,
        pctActual: income > 0 ? (totalNeeds / income) * 100 : 0,
        targetPct: 50,
      },
      wants: {
        actual: totalWants,
        target: income * 0.3,
        pctActual: income > 0 ? (totalWants / income) * 100 : 0,
        targetPct: 30,
      },
      savings: {
        actual: totalSavings,
        target: income * 0.2,
        pctActual: income > 0 ? (totalSavings / income) * 100 : 0,
        targetPct: 20,
      },
      totalSpent,
    };
  }, [expenses, income]);

  // Personal vs Shared Breakdown
  const partnerBreakdown = useMemo(() => {
    let personalSum = 0;
    let sharedSum = 0;

    expenses.forEach(e => {
      if (e.category === 'housing' || e.category === 'utilities' || e.category === 'insurance') {
        sharedSum += e.amount;
      } else {
        personalSum += e.amount;
      }
    });

    if (expenses.length === 0) {
      personalSum = income * 0.35;
      sharedSum = income * 0.45;
    }

    return {
      personal: personalSum,
      shared: sharedSum,
      personalPct: (personalSum / (personalSum + sharedSum || 1)) * 100,
      sharedPct: (sharedSum / (personalSum + sharedSum || 1)) * 100,
    };
  }, [expenses, income]);

  return (
    <Card className="p-5 border-white/10 bg-neutral-900/90 backdrop-blur-xl relative">
      {/* Header & Controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-cyan-400/10 text-cyan-400 border border-cyan-400/20">
            <PieChart className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-white text-base">
              {isTh ? 'สถิติตามหมวดหมู่ (Excel Pivot Matrix)' : 'Category Pivot Matrix'}
            </h3>
            <p className="text-xs text-white/50">
              {isTh ? 'วิเคราะห์งบประมาณตามสูตร 50/30/20 และบัญชีคู่' : 'Multi-dimensional spending breakdown'}
            </p>
          </div>
        </div>

        {/* Pivot Mode Tabs */}
        <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 text-xs">
          <button
            type="button"
            onClick={() => setPivotMode('50-30-20')}
            className={`px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 ${
              pivotMode === '50-30-20' ? 'bg-cyan-400 text-black font-semibold' : 'text-white/60 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            50/30/20
          </button>
          <button
            type="button"
            onClick={() => setPivotMode('personal-vs-shared')}
            className={`px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 ${
              pivotMode === 'personal-vs-shared'
                ? 'bg-cyan-400 text-black font-semibold'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            {isTh ? 'ส่วนตัว/บัญชีคู่' : 'Personal/Shared'}
          </button>
        </div>
      </div>

      {/* Pivot Mode Views */}
      {pivotMode === '50-30-20' ? (
        <div className="space-y-3">
          {/* Needs Bar */}
          <div className="p-3 bg-white/5 border border-white/10 rounded-2xl">
            <div className="flex justify-between items-center text-xs mb-1.5">
              <span className="font-bold text-rose-400 flex items-center gap-1.5">
                🏠 Needs (รายจ่ายจำเป็น 50%)
              </span>
              <span className="text-white font-semibold">
                {formatMoney(breakdown503020.needs.actual, currency, locale)} / Target{' '}
                {formatMoney(breakdown503020.needs.target, currency, locale)} ({breakdown503020.needs.pctActual.toFixed(1)}%)
              </span>
            </div>
            <div className="w-full bg-white/10 h-2.5 rounded-full overflow-hidden">
              <div
                style={{ width: `${Math.min(100, breakdown503020.needs.pctActual)}%` }}
                className={`h-full rounded-full transition-all ${
                  breakdown503020.needs.pctActual > 50 ? 'bg-rose-500' : 'bg-rose-400'
                }`}
              />
            </div>
          </div>

          {/* Wants Bar */}
          <div className="p-3 bg-white/5 border border-white/10 rounded-2xl">
            <div className="flex justify-between items-center text-xs mb-1.5">
              <span className="font-bold text-amber-400 flex items-center gap-1.5">
                🎉 Wants (รายจ่ายความสุข 30%)
              </span>
              <span className="text-white font-semibold">
                {formatMoney(breakdown503020.wants.actual, currency, locale)} / Target{' '}
                {formatMoney(breakdown503020.wants.target, currency, locale)} ({breakdown503020.wants.pctActual.toFixed(1)}%)
              </span>
            </div>
            <div className="w-full bg-white/10 h-2.5 rounded-full overflow-hidden">
              <div
                style={{ width: `${Math.min(100, breakdown503020.wants.pctActual)}%` }}
                className={`h-full rounded-full transition-all ${
                  breakdown503020.wants.pctActual > 30 ? 'bg-amber-500' : 'bg-amber-400'
                }`}
              />
            </div>
          </div>

          {/* Savings Bar */}
          <div className="p-3 bg-white/5 border border-white/10 rounded-2xl">
            <div className="flex justify-between items-center text-xs mb-1.5">
              <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                💰 Savings / Debt (เงินออม/การลงทุน 20%)
              </span>
              <span className="text-white font-semibold">
                {formatMoney(breakdown503020.savings.actual, currency, locale)} / Target{' '}
                {formatMoney(breakdown503020.savings.target, currency, locale)} ({breakdown503020.savings.pctActual.toFixed(1)}%)
              </span>
            </div>
            <div className="w-full bg-white/10 h-2.5 rounded-full overflow-hidden">
              <div
                style={{ width: `${Math.min(100, breakdown503020.savings.pctActual)}%` }}
                className="h-full rounded-full bg-emerald-400 transition-all"
              />
            </div>
          </div>
        </div>
      ) : (
        /* Personal vs Shared Breakdown View */
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
              <p className="text-xs text-white/50">{isTh ? 'รายจ่ายส่วนตัว' : 'Personal Expenses'}</p>
              <p className="text-lg font-bold text-cyan-400 mt-1">
                {formatMoney(partnerBreakdown.personal, currency, locale)}
              </p>
              <span className="text-[10px] text-white/40">{partnerBreakdown.personalPct.toFixed(1)}% of total</span>
            </div>

            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
              <p className="text-xs text-white/50">{isTh ? 'รายจ่ายบอร์ดคู่/แชร์' : 'Shared Partner Expenses'}</p>
              <p className="text-lg font-bold text-purple-400 mt-1">
                {formatMoney(partnerBreakdown.shared, currency, locale)}
              </p>
              <span className="text-[10px] text-white/40">{partnerBreakdown.sharedPct.toFixed(1)}% of total</span>
            </div>
          </div>

          {/* Stacked Split Bar */}
          <div className="p-3 bg-black/40 rounded-xl border border-white/10">
            <div className="flex justify-between text-xs text-white/70 mb-1.5">
              <span>Personal ({partnerBreakdown.personalPct.toFixed(0)}%)</span>
              <span>Shared ({partnerBreakdown.sharedPct.toFixed(0)}%)</span>
            </div>
            <div className="w-full h-3 bg-white/10 rounded-full flex overflow-hidden">
              <div style={{ width: `${partnerBreakdown.personalPct}%` }} className="bg-cyan-400 h-full" />
              <div style={{ width: `${partnerBreakdown.sharedPct}%` }} className="bg-purple-400 h-full" />
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
