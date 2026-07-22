// src/components/dashboard/cash-flow-projection-card.tsx
'use client';

import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { formatMoney, type CurrencyCode } from '@/lib/utils/currency';
import { CRITICAL_EXPENSES, type CriticalExpenseCommitment } from '@/lib/types/budget';
import {
  CalendarDays,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { addDays, format } from 'date-fns';

interface CashFlowProjectionCardProps {
  currentCashBalance?: number;
  monthlyIncome?: number;
  commitment?: CriticalExpenseCommitment | null;
  currency?: CurrencyCode | null;
  locale?: 'th' | 'en';
}

export function CashFlowProjectionCard({
  currentCashBalance = 35000,
  monthlyIncome = 45000,
  commitment,
  currency = 'THB',
  locale = 'en',
}: CashFlowProjectionCardProps) {
  const isTh = locale === 'th';
  const [viewMode, setViewMode] = useState<'timeline' | 'schedule'>('timeline');

  // Generate 30-day projection dataset
  const projection = useMemo(() => {
    const today = new Date();
    let balance = currentCashBalance;
    const dailyData: { date: Date; dateStr: string; balance: number; event?: string; amount?: number }[] = [];

    // Mock scheduled events across the next 30 days
    const events: Record<number, { title: string; amount: number; isIncome?: boolean }> = {
      5: { title: isTh ? 'ค่าน้ำ/ค่าไฟ' : 'Utilities & Water', amount: -2800 },
      10: { title: isTh ? 'ค่าเช่า/ผ่อนบ้าน' : 'Rent / Housing', amount: -12500 },
      15: { title: isTh ? 'เงินเดือน / Income Payday' : 'Mid-Month Salary', amount: Math.round(monthlyIncome * 0.5), isIncome: true },
      20: { title: isTh ? 'ค่าบัตรเครดิต' : 'Credit Card Statement', amount: -6400 },
      25: { title: isTh ? 'ค่าประกันภัย / Subscriptions' : 'Subscriptions & Insurance', amount: -1800 },
      30: { title: isTh ? 'เงินเดือนสิ้นเดือน' : 'End-Month Salary', amount: Math.round(monthlyIncome * 0.5), isIncome: true },
    };

    if (commitment) {
      const label = CRITICAL_EXPENSES[commitment.expenseKey]?.[isTh ? 'labelTh' : 'labelEn'] ?? commitment.expenseKey;
      events[12] = {
        title: label,
        amount: -commitment.estimatedMonthlyCost,
      };
    }

    for (let day = 0; day < 30; day++) {
      const date = addDays(today, day);
      const dayNum = day + 1;
      const event = events[dayNum];

      if (event) {
        balance += event.amount;
      }

      dailyData.push({
        date,
        dateStr: format(date, 'MMM d'),
        balance,
        event: event?.title,
        amount: event?.amount,
      });
    }

    return dailyData;
  }, [currentCashBalance, monthlyIncome, commitment, isTh]);

  const minBalance = useMemo(() => Math.min(...projection.map(p => p.balance)), [projection]);
  const lowBalanceDays = useMemo(() => projection.filter(p => p.balance < 5000), [projection]);
  const maxBalance = useMemo(() => Math.max(...projection.map(p => p.balance)), [projection]);

  return (
    <Card className="p-5 border-white/10 bg-neutral-900/90 backdrop-blur-xl relative overflow-hidden">
      {/* Background Accent Mesh */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-400/10 text-amber-400 border border-amber-400/20">
            <CalendarDays className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-white text-base">
              {isTh ? 'ประมาณการกระแสเงินสด 30 วัน' : '30-Day Cash Flow Schedule'}
            </h3>
            <p className="text-xs text-white/50">
              {isTh ? 'คำนวณเงินคงเหลือตามกำหนดชำระรายจ่าย' : 'Excel-grade daily balance roll-forward & overdraft guard'}
            </p>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 text-xs">
          <button
            type="button"
            onClick={() => setViewMode('timeline')}
            className={`px-2.5 py-1 rounded-lg transition-colors ${
              viewMode === 'timeline' ? 'bg-amber-400 text-black font-semibold' : 'text-white/60 hover:text-white'
            }`}
          >
            {isTh ? 'กราฟ' : 'Graph'}
          </button>
          <button
            type="button"
            onClick={() => setViewMode('schedule')}
            className={`px-2.5 py-1 rounded-lg transition-colors ${
              viewMode === 'schedule' ? 'bg-amber-400 text-black font-semibold' : 'text-white/60 hover:text-white'
            }`}
          >
            {isTh ? 'รายการ' : 'List'}
          </button>
        </div>
      </div>

      {/* Low Balance Warning Badge */}
      {minBalance < 5000 && (
        <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center justify-between text-rose-400 text-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>
              {isTh
                ? `เตือน: มีวันเงินเหลือต่ำกว่า 5,000 ${currency} (${lowBalanceDays.length} วัน)`
                : `Low Water Mark Warning: Balance drops below 5,000 ${currency} on ${lowBalanceDays.length} days.`}
            </span>
          </div>
          <span className="font-bold text-rose-300">Min: {formatMoney(minBalance, currency, locale)}</span>
        </div>
      )}

      {/* Main Content View */}
      {viewMode === 'timeline' ? (
        <div className="space-y-4">
          {/* Sparkline Graph */}
          <div className="h-32 pt-4 px-2 bg-black/40 rounded-2xl border border-white/10 flex items-end gap-1 relative overflow-hidden">
            {/* Safety Line at 5000 */}
            <div
              style={{ bottom: `${Math.max(5, (5000 / maxBalance) * 100)}%` }}
              className="absolute left-0 right-0 border-b border-dashed border-rose-500/40 z-10 pointer-events-none"
            >
              <span className="absolute right-2 -top-2.5 text-[9px] text-rose-400 bg-black/80 px-1 rounded">
                Buffer Threshold
              </span>
            </div>

            {projection.map((p, index) => {
              const heightPct = Math.max(8, Math.round((p.balance / maxBalance) * 100));
              const isLow = p.balance < 5000;
              const hasEvent = !!p.event;

              return (
                <div
                  key={index}
                  className="flex-1 flex flex-col items-center gap-1 group relative h-full justify-end"
                  title={`${p.dateStr}: ${formatMoney(p.balance, currency, locale)} ${p.event ? `(${p.event})` : ''}`}
                >
                  {/* Event Marker Dot */}
                  {hasEvent && (
                    <div
                      className={`w-2 h-2 rounded-full absolute -top-1 z-20 ${
                        (p.amount ?? 0) > 0 ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'
                      }`}
                    />
                  )}

                  <div
                    style={{ height: `${heightPct}%` }}
                    className={`w-full rounded-t transition-all ${
                      isLow
                        ? 'bg-rose-500'
                        : hasEvent && (p.amount ?? 0) > 0
                        ? 'bg-emerald-400'
                        : 'bg-amber-400/80 group-hover:bg-amber-300'
                    }`}
                  />
                </div>
              );
            })}
          </div>

          {/* Key Summary Stats */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-2.5 bg-white/5 rounded-xl border border-white/10">
              <p className="text-[10px] text-white/50">{isTh ? 'ยอดปัจจุบัน' : 'Start Balance'}</p>
              <p className="text-xs font-bold text-white mt-0.5">{formatMoney(currentCashBalance, currency, locale)}</p>
            </div>
            <div className="p-2.5 bg-white/5 rounded-xl border border-white/10">
              <p className="text-[10px] text-white/50">{isTh ? 'จุดต่ำสุดใน 30 วัน' : 'Lowest 30D Balance'}</p>
              <p className={`text-xs font-bold mt-0.5 ${minBalance < 5000 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {formatMoney(minBalance, currency, locale)}
              </p>
            </div>
            <div className="p-2.5 bg-white/5 rounded-xl border border-white/10">
              <p className="text-[10px] text-white/50">{isTh ? 'ยอดคาดการณ์สิ้นเดือน' : 'Projected End Balance'}</p>
              <p className="text-xs font-bold text-amber-400 mt-0.5">
                {formatMoney(projection[projection.length - 1].balance, currency, locale)}
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* Schedule Detail List View */
        <div className="space-y-2 max-h-64 overflow-y-auto pr-1 scrollbar-thin">
          {projection
            .filter(p => p.event)
            .map((p, idx) => {
              const isIncome = (p.amount ?? 0) > 0;
              return (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`p-1.5 rounded-lg ${
                        isIncome ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                      }`}
                    >
                      {isIncome ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                    </div>
                    <div>
                      <p className="font-semibold text-white">{p.event}</p>
                      <p className="text-[10px] text-white/50">{p.dateStr}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className={`font-bold ${isIncome ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {isIncome ? '+' : ''}
                      {formatMoney(p.amount ?? 0, currency, locale)}
                    </p>
                    <p className="text-[10px] text-white/50">
                      {isTh ? 'คงเหลือ: ' : 'After: '}
                      {formatMoney(p.balance, currency, locale)}
                    </p>
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </Card>
  );
}
