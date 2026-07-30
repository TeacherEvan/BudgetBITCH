// src/components/dashboard/budget-variance-grid.tsx
'use client';

import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { formatMoney, type CurrencyCode } from '@/lib/utils/currency';
import type { ExpenseEntry, ExpenseCategory } from '@/lib/types/budget';
import {
  ArrowUpDown,
  Sparkles,
} from 'lucide-react';

interface CategoryBudgetConfig {
  category: ExpenseCategory;
  nameEn: string;
  budgeted: number;
  actual: number;
}

interface BudgetVarianceGridProps {
  expenses?: ExpenseEntry[];
  currency?: CurrencyCode | null;
  locale?: string;
}

const CATEGORY_NAMES: Record<ExpenseCategory, { en: string }> = {
  housing: { en: 'Housing & Rent' },
  debt: { en: 'Debt Payment' },
  food: { en: 'Dining & Food' },
  entertainment: { en: 'Entertainment' },
  utilities: { en: 'Utilities' },
  phone_internet: { en: 'Phone & Internet' },
  transport: { en: 'Transport & Fuel' },
  subscriptions: { en: 'Subscriptions' },
  healthcare: { en: 'Healthcare' },
  insurance: { en: 'Insurance' },
  savings: { en: 'Savings' },
  other: { en: 'Other' },
};

const DEFAULT_BUDGETS: Record<ExpenseCategory, number> = {
  housing: 12000,
  debt: 5000,
  food: 8000,
  entertainment: 3500,
  utilities: 3000,
  phone_internet: 1200,
  transport: 3500,
  subscriptions: 1500,
  healthcare: 2000,
  insurance: 2500,
  savings: 5000,
  other: 2000,
};

type SortField = 'category' | 'budgeted' | 'actual' | 'variance';

export function BudgetVarianceGrid({
  expenses = [],
  currency = 'USD',
  locale = 'en',
}: BudgetVarianceGridProps) {
  const [sortField, setSortField] = useState<SortField>('variance');
  const [sortAsc, setSortAsc] = useState(true);

  const gridData = useMemo(() => {
    const actualMap: Record<string, number> = {};
    expenses.forEach(e => {
      actualMap[e.category] = (actualMap[e.category] || 0) + e.amount;
    });

    const rows: CategoryBudgetConfig[] = (Object.keys(DEFAULT_BUDGETS) as ExpenseCategory[]).map(cat => ({
      category: cat,
      nameEn: CATEGORY_NAMES[cat]?.en ?? cat,
      budgeted: DEFAULT_BUDGETS[cat],
      actual: actualMap[cat] || (DEFAULT_BUDGETS[cat] * (cat === 'housing' ? 1.0 : cat === 'food' ? 0.85 : 0.4)),
    }));

    return rows.sort((a, b) => {
      const diffA = a.budgeted - a.actual;
      const diffB = b.budgeted - b.actual;

      let result = 0;
      if (sortField === 'category') result = a.nameEn.localeCompare(b.nameEn);
      else if (sortField === 'budgeted') result = a.budgeted - b.budgeted;
      else if (sortField === 'actual') result = a.actual - b.actual;
      else if (sortField === 'variance') result = diffA - diffB;

      return sortAsc ? result : -result;
    });
  }, [expenses, sortField, sortAsc]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const totalBudgeted = gridData.reduce((sum, r) => sum + r.budgeted, 0);
  const totalActual = gridData.reduce((sum, r) => sum + r.actual, 0);
  const totalVariance = totalBudgeted - totalActual;

  return (
    <Card className="p-5 border-white/10 bg-neutral-900/90 backdrop-blur-xl relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-400/10 text-emerald-400 border border-emerald-400/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-white text-base">
              {'Budget Variance & Health Data Bars'}
            </h3>
            <p className="text-xs text-white/50">
              {'Budgeted vs. Actual with in-cell data bars & dynamic thresholds'}
            </p>
          </div>
        </div>

        {/* Total Variance Pill */}
        <div
          className={`px-3 py-1.5 rounded-xl border text-xs font-bold ${
            totalVariance >= 0
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
          }`}
        >
          {totalVariance >= 0 ? '+' : ''}
          {formatMoney(totalVariance, currency, locale)} {'Variance'}
        </div>
      </div>

      {/* Grid Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-white/10 text-white/50 uppercase tracking-wider text-[10px]">
              <th className="py-2.5 px-3">
                <button type="button" onClick={() => toggleSort('category')} className="flex items-center gap-1 hover:text-white">
                  {'Category'}
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="py-2.5 px-3 text-right">
                <button type="button" onClick={() => toggleSort('budgeted')} className="flex items-center gap-1 justify-end hover:text-white">
                  {'Budgeted'}
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="py-2.5 px-3 text-right">
                <button type="button" onClick={() => toggleSort('actual')} className="flex items-center gap-1 justify-end hover:text-white">
                  {'Actual'}
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="py-2.5 px-3 text-right">
                <button type="button" onClick={() => toggleSort('variance')} className="flex items-center gap-1 justify-end hover:text-white">
                  {'Variance (+/-)'}
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="py-2.5 px-3 text-center">{'Status & Data Bar'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {gridData.map(row => {
              const pctUsed = row.budgeted > 0 ? (row.actual / row.budgeted) * 100 : 0;
              const variance = row.budgeted - row.actual;
              const isOver = variance < 0;

              let badgeColor = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
              let barColor = 'bg-emerald-400';
              let statusLabel = 'Safe';

              if (pctUsed > 100) {
                badgeColor = 'bg-rose-500/20 text-rose-400 border-rose-500/30 animate-pulse';
                barColor = 'bg-rose-500';
                statusLabel = 'OVER!';
              } else if (pctUsed >= 85) {
                badgeColor = 'bg-amber-500/20 text-amber-400 border-amber-500/30';
                barColor = 'bg-amber-400';
                statusLabel = 'Watch';
              }

              return (
                <tr key={row.category} className="hover:bg-white/5 transition-colors">
                  <td className="py-2.5 px-3 font-semibold text-white">
                    {row.nameEn}
                  </td>
                  <td className="py-2.5 px-3 text-right text-white/70">
                    {formatMoney(row.budgeted, currency, locale)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-bold text-white">
                    {formatMoney(row.actual, currency, locale)}
                  </td>
                  <td className={`py-2.5 px-3 text-right font-bold ${isOver ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {variance >= 0 ? '+' : ''}
                    {formatMoney(variance, currency, locale)}
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-2">
                      {/* Excel-style in-cell Data Bar */}
                      <div className="flex-1 bg-white/10 h-2 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${Math.min(100, pctUsed)}%` }}
                          className={`h-full rounded-full transition-all ${barColor}`}
                        />
                      </div>
                      <span className={`px-2 py-0.5 rounded-md border text-[10px] font-bold ${badgeColor}`}>
                        {statusLabel} ({pctUsed.toFixed(0)}%)
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
