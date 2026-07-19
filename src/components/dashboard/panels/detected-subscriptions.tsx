// components/dashboard/panels/detected-subscriptions.tsx
'use client';

import { useMemo } from 'react';
import { Sparkles, Plus } from 'lucide-react';
import { useExpenses } from '@/hooks/use-local-db';
import { useSubscriptions } from '@/hooks/use-local-db';
import { addExpense, generateId } from '@/lib/db/local-db';
import type { ExpenseEntry } from '@/lib/types/budget';
import { detectRecurringSubscriptions, type DetectedSubscription } from '@/modules/budgeting/detect-recurring';
import { useCurrency } from '@/hooks/use-currency';

interface DetectedSubscriptionsProps {
  locale?: 'th' | 'en';
}

const COPY = {
  en: {
    title: 'Detected from your history',
    desc: 'We found these recurring charges. Add them to track your subscriptions.',
    add: 'Add',
    added: 'Added',
    monthly: 'monthly',
    yearly: 'yearly',
    none: 'No recurring charges detected yet. Import a statement to find them.',
    occurrences: (n: number) => `${n} charges`,
  },
  th: {
    title: 'ตรวจพบจากประวัติของคุณ',
    desc: 'เราพบการตัดเงินที่เป็นประจำ นำเข้าเพื่อติดตามการสมัครสมาชิก',
    add: 'เพิ่ม',
    added: 'เพิ่มแล้ว',
    monthly: 'รายเดือน',
    yearly: 'รายปี',
    none: 'ยังไม่พบการตัดเงินที่เป็นประจำ นำเข้าสเตตเมนต์เพื่อค้นหา',
    occurrences: (n: number) => `ตัดเงิน ${n} ครั้ง`,
  },
};

/**
 * Scans local expense history for recurring merchants and lets the user
 * promote them into tracked subscriptions with one tap. Pure local logic —
 * no network, no third-party services.
 */
export function DetectedSubscriptions({ locale = 'en' }: DetectedSubscriptionsProps) {
  const t = COPY[locale];
  const formatCurrency = useCurrency();
  const { expenses, loading: expensesLoading } = useExpenses();
  const { subscriptions, add: addSubscription, loading: subsLoading } = useSubscriptions();

  const detected = useMemo<DetectedSubscription[]>(
    () => detectRecurringSubscriptions(expenses),
    [expenses],
  );

  const knownMerchants = useMemo(
    () => new Set(subscriptions.map((s) => s.merchant.trim().toLowerCase())),
    [subscriptions],
  );

  const handleAdd = async (sub: DetectedSubscription) => {
    const entry: ExpenseEntry = {
      id: generateId(),
      date: new Date().toISOString().split('T')[0],
      category: 'subscriptions',
      merchant: sub.merchant,
      amount: sub.typicalAmount,
      isRecurring: true,
      cycle: sub.cycle,
      source: 'import',
      note: `auto-detected (${sub.occurrences} charges)`,
    } as ExpenseEntry;
    // Persist as a real recurring expense entry (matches subscription model).
    await addExpense(entry);
    // Also register in the subscription list view.
    await addSubscription({
      date: entry.date,
      category: 'subscriptions',
      merchant: entry.merchant,
      amount: entry.amount,
      isRecurring: true,
      cycle: sub.cycle,
      source: 'import',
      note: entry.note,
    } as Omit<ExpenseEntry, 'id'>);
  };

  if (expensesLoading || subsLoading) return null;
  if (detected.length === 0) {
    return (
      <p className="px-1 py-2 text-xs text-white/50">{t.none}</p>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-amber-400" aria-hidden="true" />
        <h4 className="text-sm font-semibold text-white">{t.title}</h4>
      </div>
      <p className="text-xs text-white/60">{t.desc}</p>
      <ul className="space-y-2" role="list">
        {detected.map((sub) => {
          const alreadyAdded = knownMerchants.has(sub.merchant.trim().toLowerCase());
          return (
            <li
              key={sub.merchant}
              className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3"
              role="listitem"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-white">{sub.merchant}</p>
                <p className="text-xs text-white/60">
                  {formatCurrency(sub.typicalAmount, locale)} · {t[sub.cycle]} · {t.occurrences(sub.occurrences)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleAdd(sub)}
                disabled={alreadyAdded}
                data-testid={`add-detected-${sub.merchant}`}
                className="flex items-center gap-1 rounded-lg bg-amber-400/20 px-3 py-1.5 text-xs font-medium text-amber-300 transition-colors hover:bg-amber-400/30 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Plus className="h-3.5 w-3.5" />
                {alreadyAdded ? t.added : t.add}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
