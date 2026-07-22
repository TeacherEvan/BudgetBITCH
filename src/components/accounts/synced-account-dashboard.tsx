// components/accounts/synced-account-dashboard.tsx
'use client';

import { useMemo } from 'react';
import { Users, TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import type { ExpenseEntry, IncomeEntry } from '@/lib/types/budget';
import { useCurrency } from '@/hooks/use-currency';

interface SyncedAccountDashboardProps {
  expenses: ExpenseEntry[];
  incomes: IncomeEntry[];
  locale: 'th' | 'en';
  membersCount?: number;
}

interface MemberSummary {
  name: string;
  totalIncome: number;
  totalExpense: number;
  netContribution: number;
  incomeSharePct: number;
  expenseSharePct: number;
}

export function SyncedAccountDashboard({
  expenses,
  incomes,
  locale,
  membersCount = 2,
}: SyncedAccountDashboardProps) {
  const formatCurrency = useCurrency();

  const t = (en: string, th: string) => (locale === 'th' ? th : en);
  const defaultName = t('Primary Member', 'สมาชิกหลัก');

  const { memberSummaries, totalIncomeAll, totalExpenseAll, netAccountBalance } = useMemo(() => {
    const totalInc = incomes.reduce((sum, i) => sum + i.amount, 0);
    const totalExp = expenses.reduce((sum, e) => sum + e.amount, 0);
    const netBal = totalInc - totalExp;

    const memberMap = new Map<string, { name: string; income: number; expense: number }>();

    // Default fallback bucket for unassigned records

    // Aggregate Incomes
    incomes.forEach((inc) => {
      const key = inc.createdByName || inc.createdBy || defaultName;
      const current = memberMap.get(key) || { name: key, income: 0, expense: 0 };
      current.income += inc.amount;
      memberMap.set(key, current);
    });

    // Aggregate Expenses
    expenses.forEach((exp) => {
      const key = exp.createdByName || exp.createdBy || defaultName;
      const current = memberMap.get(key) || { name: key, income: 0, expense: 0 };
      current.expense += exp.amount;
      memberMap.set(key, current);
    });

    if (memberMap.size === 0) {
      memberMap.set(defaultName, { name: defaultName, income: totalInc, expense: totalExp });
    }

    const summaries: MemberSummary[] = Array.from(memberMap.values()).map((m) => {
      const incomeSharePct = totalInc > 0 ? Math.round((m.income / totalInc) * 100) : 0;
      const expenseSharePct = totalExp > 0 ? Math.round((m.expense / totalExp) * 100) : 0;
      return {
        name: m.name,
        totalIncome: m.income,
        totalExpense: m.expense,
        netContribution: m.income - m.expense,
        incomeSharePct,
        expenseSharePct,
      };
    });

    return {
      memberSummaries: summaries,
      totalIncomeAll: totalInc,
      totalExpenseAll: totalExp,
      netAccountBalance: netBal,
    };
  }, [incomes, expenses, defaultName]);

  return (
    <div className="rounded-2xl border border-[var(--gold-border-strong)] bg-gradient-to-br from-[var(--bg-surface-2)] to-[var(--bg-surface-1)] p-5 md:p-6 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--gold-border-soft)] pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--gold-base)]/20 border border-[var(--gold-border-strong)] text-[var(--gold-bright)]">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              {t('Synced Account Dashboard', 'แดชบอร์ดสรุปยอดสมาชิกร่วม')}
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              {t('Who spent what & who provided the income', 'สรุปยอดผู้จ่ายค่าใช้จ่ายและผู้จัดหารายได้')}
            </p>
          </div>
        </div>
        <span className="rounded-full bg-sky-400/10 border border-sky-400/30 px-3 py-1 text-xs font-bold text-sky-400">
          {membersCount} {t('Members', 'สมาชิก')}
        </span>
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4">
          <div className="flex items-center justify-between text-xs text-emerald-400">
            <span>{t('Total Shared Income', 'รายได้รวมทั้งหมด')}</span>
            <ArrowUpRight className="h-4 w-4" />
          </div>
          <p className="mt-2 font-mono text-xl font-bold text-white">
            {formatCurrency(totalIncomeAll, locale)}
          </p>
        </div>

        <div className="rounded-xl border border-rose-500/30 bg-rose-950/20 p-4">
          <div className="flex items-center justify-between text-xs text-rose-400">
            <span>{t('Total Shared Expenses', 'ค่าใช้จ่ายรวมทั้งหมด')}</span>
            <ArrowDownRight className="h-4 w-4" />
          </div>
          <p className="mt-2 font-mono text-xl font-bold text-white">
            {formatCurrency(totalExpenseAll, locale)}
          </p>
        </div>

        <div className="rounded-xl border border-[var(--gold-border-strong)] bg-[var(--gold-base)]/10 p-4">
          <div className="flex items-center justify-between text-xs text-[var(--gold-bright)]">
            <span>{t('Net Shared Balance', 'ยอดคงเหลือสุทธิ')}</span>
            <Wallet className="h-4 w-4" />
          </div>
          <p className={`mt-2 font-mono text-xl font-bold ${netAccountBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {formatCurrency(netAccountBalance, locale)}
          </p>
        </div>
      </div>

      {/* Member Breakdowns: Who Provided Income & Who Spent What */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Income Contributors */}
        <div className="rounded-xl border border-[var(--gold-border-soft)] bg-black/40 p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4" />
              {t('Who Provided Income', 'ผู้จัดหารายได้')}
            </h3>
            <span className="text-xs text-white/50">{formatCurrency(totalIncomeAll, locale)}</span>
          </div>

          <div className="space-y-3">
            {memberSummaries.map((m) => (
              <div key={m.name} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-white truncate max-w-[140px]">{m.name}</span>
                  <span className="font-mono text-emerald-300 font-bold">
                    {formatCurrency(m.totalIncome, locale)} ({m.incomeSharePct}%)
                  </span>
                </div>
                <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, m.incomeSharePct)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Expense Spenders */}
        <div className="rounded-xl border border-[var(--gold-border-soft)] bg-black/40 p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
              <TrendingDown className="h-4 w-4" />
              {t('Who Spent What', 'ผู้จ่ายค่าใช้จ่าย')}
            </h3>
            <span className="text-xs text-white/50">{formatCurrency(totalExpenseAll, locale)}</span>
          </div>

          <div className="space-y-3">
            {memberSummaries.map((m) => (
              <div key={m.name} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-white truncate max-w-[140px]">{m.name}</span>
                  <span className="font-mono text-rose-300 font-bold">
                    {formatCurrency(m.totalExpense, locale)} ({m.expenseSharePct}%)
                  </span>
                </div>
                <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-rose-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, m.expenseSharePct)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Individual Net Contribution Cards */}
      <div className="space-y-3 pt-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--gold-muted)]">
          {t('Member Net Contribution Summary', 'สรุปยอดสุทธิรายบุคคล')}
        </h3>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {memberSummaries.map((m) => (
            <div
              key={m.name}
              className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3 text-xs"
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--gold-base)]/20 font-bold text-[var(--gold-bright)]">
                  {m.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-white">{m.name}</p>
                  <p className="text-[10px] text-white/50">
                    +{formatCurrency(m.totalIncome, locale)} / -{formatCurrency(m.totalExpense, locale)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="block text-[10px] text-white/50 uppercase">{t('Net', 'สุทธิ')}</span>
                <span className={`font-mono font-bold text-sm ${m.netContribution >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {m.netContribution >= 0 ? '+' : ''}{formatCurrency(m.netContribution, locale)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
