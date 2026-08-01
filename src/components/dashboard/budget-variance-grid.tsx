// src/components/dashboard/budget-variance-grid.tsx
'use client';

import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { formatMoney, type CurrencyCode } from '@/lib/utils/currency';
import type { ExpenseEntry, ExpenseCategory } from '@/lib/types/budget';
import { useExpenses } from '@/hooks/use-local-db';
import {
  ArrowUpDown,
  Sparkles,
  Receipt,
  MessageSquare,
  PenTool,
  Mic,
  Calendar,
  Tag,
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
  expenses: propExpenses,
  currency = 'USD',
  locale = 'en',
}: BudgetVarianceGridProps) {
  const { expenses: hookExpenses } = useExpenses();
  const activeExpenses = propExpenses && propExpenses.length > 0 ? propExpenses : hookExpenses;

  const [sortField, setSortField] = useState<SortField>('variance');
  const [sortAsc, setSortAsc] = useState(true);

  const gridData = useMemo(() => {
    const actualMap: Record<string, number> = {};
    activeExpenses.forEach(e => {
      actualMap[e.category] = (actualMap[e.category] || 0) + e.amount;
    });

    const rows: CategoryBudgetConfig[] = (Object.keys(DEFAULT_BUDGETS) as ExpenseCategory[]).map(cat => ({
      category: cat,
      nameEn: CATEGORY_NAMES[cat]?.en ?? cat,
      budgeted: DEFAULT_BUDGETS[cat],
      actual: actualMap[cat] || 0,
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
  }, [activeExpenses, sortField, sortAsc]);

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

  const sortedRecentExpenses = useMemo(() => {
    return [...activeExpenses].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [activeExpenses]);

  return (
    <Card className="p-5 border-white/10 bg-neutral-900/90 backdrop-blur-xl relative space-y-6" data-testid="budget-variance-grid">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-400/10 text-emerald-400 border border-emerald-400/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-white text-base">
              {'Excel Variance Grid & Spent Ledger'}
            </h3>
            <p className="text-xs text-white/50">
              {'Budgeted vs. Actual with spent details & ingestion source tracking'}
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

      {/* Excel Spent Ledger Section */}
      <div className="border-t border-white/10 pt-5">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
            <span>📑</span>
            {'Recent Spent Items (Excel Ledger)'}
          </h4>
          <span className="text-[10px] text-white/40 font-mono">
            {sortedRecentExpenses.length} {'entries recorded'}
          </span>
        </div>

        {sortedRecentExpenses.length === 0 ? (
          <div className="p-6 text-center text-xs text-white/40 bg-white/5 rounded-2xl border border-white/5">
            {'No expenses recorded yet. Tap Quick Add (+) to capture via Photo or SMS/Email inbox!'}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-black/40">
            <table className="w-full text-left text-xs border-collapse" data-testid="spent-ledger-table">
              <thead>
                <tr className="border-b border-white/10 text-white/40 uppercase text-[10px] bg-white/5">
                  <th className="py-2.5 px-3">{'Date'}</th>
                  <th className="py-2.5 px-3">{'Merchant / Item'}</th>
                  <th className="py-2.5 px-3">{'Category'}</th>
                  <th className="py-2.5 px-3">{'Ingestion Source'}</th>
                  <th className="py-2.5 px-3 text-right">{'Amount'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {sortedRecentExpenses.slice(0, 15).map(expense => {
                  const catName = CATEGORY_NAMES[expense.category]?.en ?? expense.category;
                  let sourceBadge = (
                    <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/70">
                      <PenTool className="w-3 h-3 text-white/50" /> Manual
                    </span>
                  );
                  if (expense.source === 'receipt') {
                    sourceBadge = (
                      <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-semibold">
                        <Receipt className="w-3 h-3 text-amber-400" /> 📸 Photo Receipt
                      </span>
                    );
                  } else if (expense.source === 'import') {
                    sourceBadge = (
                      <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-sky-400/20 text-sky-300 font-semibold">
                        <MessageSquare className="w-3 h-3 text-sky-400" /> 📱 SMS/Email Inbox
                      </span>
                    );
                  } else if (expense.source === 'voice') {
                    sourceBadge = (
                      <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-purple-400/20 text-purple-300 font-semibold">
                        <Mic className="w-3 h-3 text-purple-400" /> 🎤 Voice
                      </span>
                    );
                  }

                  return (
                    <tr key={expense.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-2.5 px-3 text-white/60 font-mono text-[11px]">
                        {expense.date}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-white">
                        {expense.merchant}
                        {expense.note && <span className="text-[11px] text-white/40 block font-normal">{expense.note}</span>}
                      </td>
                      <td className="py-2.5 px-3 text-white/70">
                        {catName}
                      </td>
                      <td className="py-2.5 px-3">
                        {sourceBadge}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-400">
                        {formatMoney(expense.amount, currency, locale)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Card>
  );
}
