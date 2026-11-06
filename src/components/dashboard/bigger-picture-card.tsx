// src/components/dashboard/bigger-picture-card.tsx
'use client';

import { useState, useMemo } from 'react';
import {
  Compass,
  TrendingUp,
  ShieldCheck,
  Zap,
  Sliders,
  Sparkles,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useCurrency } from '@/hooks/use-currency';
import {
  calculateRunway,
  calculateWealthVelocity,
  calculateFinancialHealthIndex,
  simulateHorizonAdjustments,
} from '@/modules/psychology/runway-calculator';
import type { WizardProfile, Bill, SavingsGoal, Debt } from '@/lib/types/budget';

interface BiggerPictureCardProps {
  locale?: string;
  profile: WizardProfile | null;
  bills: Bill[];
  savingsGoals: SavingsGoal[];
  debts: Debt[];
  emergencyFundAmount?: number;
}

export function BiggerPictureCard({
  locale: _locale = 'en',
  profile,
  bills,
  savingsGoals,
  debts,
  emergencyFundAmount = 0,
}: BiggerPictureCardProps) {
  const formatCurrency = useCurrency();

  // 1. Calculate aggregate numbers from real user data
  const monthlyIncome = profile?.answers?.income ?? 0;

  // Monthly fixed burn = sum of active bills + debt minimum payments
  const activeBillsSum = bills
    .filter((b) => b.isActive)
    .reduce((sum, b) => sum + (b.amount || 0), 0);

  const monthlyDebtPayments = debts.reduce(
    (sum, d) => sum + (d.minimumPayment || 0),
    0
  );

  const totalDebtBalance = debts.reduce((sum, d) => sum + (d.balance || 0), 0);

  const monthlyFixedBurn = activeBillsSum + monthlyDebtPayments;

  // Total liquid reserves = emergency fund + liquid savings goals
  const liquidSavings =
    emergencyFundAmount +
    savingsGoals.reduce((sum, g) => sum + (g.currentAmount || 0), 0);

  // Monthly savings contributions
  const monthlySavings = savingsGoals.reduce(
    (sum, g) => sum + (g.autoAllocate || 0),
    0
  );

  // 2. Pure domain analytics
  const runway = useMemo(
    () => calculateRunway(liquidSavings, monthlyFixedBurn),
    [liquidSavings, monthlyFixedBurn]
  );

  const velocity = useMemo(
    () => calculateWealthVelocity(monthlyIncome, monthlySavings, monthlyDebtPayments),
    [monthlyIncome, monthlySavings, monthlyDebtPayments]
  );

  const healthIndex = useMemo(
    () =>
      calculateFinancialHealthIndex({
        monthlyIncome,
        monthlyFixedBurn,
        liquidSavings,
        monthlyDiscretionarySpend: Math.max(0, monthlyIncome - monthlyFixedBurn - monthlySavings),
        monthlyDebtPayment: monthlyDebtPayments,
        totalDebtBalance,
        monthlySavingsContribution: monthlySavings,
      }),
    [monthlyIncome, monthlyFixedBurn, liquidSavings, monthlyDebtPayments, totalDebtBalance, monthlySavings]
  );

  // 3. Horizon Simulator interactive sliders
  const [extraMonthlySavings, setExtraMonthlySavings] = useState(50);
  const [fixedCostTrimming, setFixedCostTrimming] = useState(30);

  const simulation = useMemo(
    () =>
      simulateHorizonAdjustments(
        liquidSavings,
        monthlyFixedBurn,
        extraMonthlySavings,
        fixedCostTrimming
      ),
    [liquidSavings, monthlyFixedBurn, extraMonthlySavings, fixedCostTrimming]
  );

  const runwayStatusColors = {
    critical: 'text-rose-400 border-rose-500/30 bg-rose-500/10',
    vulnerable: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
    secure: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
    abundant: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10',
  }[runway.status];

  return (
    <div className="space-y-6 text-left" data-testid="bigger-picture-card">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-amber-400/20 bg-gradient-to-br from-neutral-900 via-black to-neutral-950 p-6 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-6 -mr-6 h-32 w-32 rounded-full bg-amber-400/10 blur-3xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-400/20 text-amber-400 border border-amber-400/30">
                <Compass className="h-4 w-4" />
              </span>
              <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
                Macro-Financial Perspective
              </span>
            </div>
            <h2 className="mt-2 text-xl sm:text-2xl font-black text-white tracking-tight">
              The Bigger Picture
            </h2>
            <p className="mt-1 text-xs text-white/60 max-w-xl leading-relaxed">
              Step out of day-to-day transaction anxiety. See your true financial runway, wealth creation speed, and how small levers compound into months of life autonomy.
            </p>
          </div>

          {/* CFPB Score Badge */}
          <div className="flex flex-col items-start sm:items-end bg-white/5 border border-white/10 rounded-2xl p-4 shrink-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/50">
              Financial Health Index
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-3xl font-black text-amber-400">
                {healthIndex.overallScore}
              </span>
              <span className="text-xs text-white/40">/100</span>
            </div>
            <span className="mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase bg-amber-400/20 text-amber-300">
              <Sparkles className="h-2.5 w-2.5" />
              {healthIndex.tier}
            </span>
          </div>
        </div>
      </div>

      {/* Grid: 3 Core Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Pillar 1: Financial Runway */}
        <Card className="p-5 bg-neutral-900/90 border-white/10 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-white/50 flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-amber-400" />
                Liquid Runway
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${runwayStatusColors}`}>
                {runway.status}
              </span>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-4xl font-black text-white">
                {runway.months === 999 ? '∞' : runway.months}
              </span>
              <span className="text-sm text-white/60 font-semibold">Months of Freedom</span>
            </div>
            <p className="mt-2 text-xs text-white/70 leading-relaxed">
              {runway.advice}
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-white/5 flex justify-between text-[11px] text-white/50">
            <span>Liquid Cash: {formatCurrency(liquidSavings)}</span>
            <span>Fixed Burn: {formatCurrency(monthlyFixedBurn)}/mo</span>
          </div>
        </Card>

        {/* Pillar 2: Wealth Velocity */}
        <Card className="p-5 bg-neutral-900/90 border-white/10 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-white/50 flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
                Wealth Velocity
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                {velocity.tier}
              </span>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-4xl font-black text-emerald-400">
                {velocity.velocityPercent}%
              </span>
              <span className="text-sm text-white/60 font-semibold">Retained as Equity</span>
            </div>
            <p className="mt-2 text-xs text-white/70 leading-relaxed">
              {velocity.description}
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-white/5 flex justify-between text-[11px] text-white/50">
            <span>Savings: {formatCurrency(monthlySavings)}/mo</span>
            <span>Debt Equity: {formatCurrency(monthlyDebtPayments)}/mo</span>
          </div>
        </Card>

        {/* Pillar 3: Debt Load Horizon */}
        <Card className="p-5 bg-neutral-900/90 border-white/10 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-white/50 flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5 text-cyan-400" />
                Debt Burden
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border border-cyan-500/30 bg-cyan-500/10 text-cyan-400">
                {totalDebtBalance > 0 ? `${debts.length} active` : 'Debt-Free'}
              </span>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-black text-white">
                {formatCurrency(totalDebtBalance)}
              </span>
            </div>
            <p className="mt-2 text-xs text-white/70 leading-relaxed">
              {totalDebtBalance > 0
                ? `Paying ${formatCurrency(monthlyDebtPayments)}/month minimums. Fast-tracking the lowest balance builds psychological momentum.`
                : 'Zero debt drag! 100% of your free cash flow can be allocated directly to wealth accumulation.'}
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-white/5 flex justify-between text-[11px] text-white/50">
            <span>DTI Ratio: {monthlyIncome > 0 ? `${Math.round((monthlyDebtPayments / monthlyIncome) * 100)}%` : '0%'}</span>
            <span>Score: {healthIndex.subScores.debtHealth}/25</span>
          </div>
        </Card>
      </div>

      {/* Interactive Horizon Simulator */}
      <Card className="p-6 bg-gradient-to-br from-neutral-900 to-black border-amber-400/20">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-400/20 text-amber-400">
              <Sliders className="h-4 w-4" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-white">
                Interactive Horizon Simulator
              </h3>
              <p className="text-[11px] text-white/60">
                Test how micro-actions compound into extended life autonomy over 12 months.
              </p>
            </div>
          </div>

          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-amber-400 font-semibold bg-amber-400/10 px-2.5 py-1 rounded-lg">
            <Sparkles className="h-3 w-3" />
            Real-Time Projection
          </span>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Sliders */}
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-white/80">Extra Monthly Savings:</span>
                <span className="text-amber-400">+{formatCurrency(extraMonthlySavings)}/mo</span>
              </div>
              <input
                type="range"
                min="0"
                max="500"
                step="25"
                value={extraMonthlySavings}
                onChange={(e) => setExtraMonthlySavings(Number(e.target.value))}
                className="w-full accent-amber-400 bg-white/10 rounded-lg cursor-pointer h-2"
              />
              <div className="flex justify-between text-[10px] text-white/40 mt-0.5">
                <span>$0</span>
                <span>$250</span>
                <span>$500</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-white/80">Fixed Cost & Subscription Trimming:</span>
                <span className="text-emerald-400">-{formatCurrency(fixedCostTrimming)}/mo</span>
              </div>
              <input
                type="range"
                min="0"
                max="300"
                step="15"
                value={fixedCostTrimming}
                onChange={(e) => setFixedCostTrimming(Number(e.target.value))}
                className="w-full accent-emerald-400 bg-white/10 rounded-lg cursor-pointer h-2"
              />
              <div className="flex justify-between text-[10px] text-white/40 mt-0.5">
                <span>$0</span>
                <span>$150</span>
                <span>$300</span>
              </div>
            </div>
          </div>

          {/* Outcome Visual Box */}
          <div className="flex flex-col justify-center rounded-2xl bg-white/5 border border-white/10 p-5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/50">
              Projected 12-Month Compound Impact
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-black text-amber-400">
                +{simulation.monthsGained} Months
              </span>
              <span className="text-xs text-white/60">of Added Runway</span>
            </div>
            <p className="mt-2 text-xs text-white/80 leading-relaxed">
              In 1 year, these simple adjustments will bank an additional{' '}
              <strong className="text-emerald-300 font-bold">
                {formatCurrency(simulation.annualWealthDelta)}
              </strong>{' '}
              in liquid wealth and lower your annual survival burn by{' '}
              <strong className="text-emerald-300 font-bold">
                {formatCurrency(fixedCostTrimming * 12)}
              </strong>.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
