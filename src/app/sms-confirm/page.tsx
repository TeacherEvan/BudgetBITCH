// app/sms-confirm/page.tsx
'use client';

import { Suspense, useCallback, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useExpenses, useIncomes } from '@/hooks/use-local-db';
import { parseSMS, type TransactionCandidate } from '@/lib/sms-parser';
import { SmsConfirm } from '@/components/sms/sms-confirm';
import type { ExpenseCategory } from '@/lib/types/budget';

const EXPENSE_CATEGORIES = new Set<ExpenseCategory>([
  'housing', 'transport', 'food', 'utilities', 'phone_internet',
  'subscriptions', 'entertainment', 'healthcare', 'insurance', 'debt',
  'savings', 'other',
]);

function mapCategory(raw: string | undefined): ExpenseCategory {
  const c = (raw ?? '').toLowerCase();
  if (EXPENSE_CATEGORIES.has(c as ExpenseCategory)) return c as ExpenseCategory;
  return 'other';
}

function SmsConfirmInner() {
  const locale = useLocale() as 'th' | 'en';
  const router = useRouter();
  const params = useSearchParams();
  const text = params.get('text') ?? '';

  const { add: addExpense } = useExpenses();
  const { add: addIncome } = useIncomes();
  const [status, setStatus] = useState<'idle' | 'saving' | 'done'>('idle');

  const { candidates } = useMemo(
    () => parseSMS(text, 'share-target'),
    [text],
  );

  const handleSave = useCallback(async (toSave: TransactionCandidate[]) => {
    setStatus('saving');
    for (const c of toSave) {
      const date = c.date || new Date().toISOString().split('T')[0];
      if (c.type === 'income') {
        await addIncome({
          amount: c.amount,
          source: c.merchant || (locale === 'th' ? 'รายได้จาก SMS' : 'SMS Income'),
          category: 'other',
          frequency: 'one_time',
          date,
          note: c.rawText,
          entrySource: 'import',
        });
      } else {
        await addExpense({
          amount: c.amount,
          merchant: c.merchant || (locale === 'th' ? 'รายจ่ายจาก SMS' : 'SMS Expense'),
          category: mapCategory(c.merchant),
          date,
          note: c.rawText,
          source: 'import',
        });
      }
    }
    setStatus('done');
    setTimeout(() => router.push('/dashboard'), 900);
  }, [addExpense, addIncome, locale, router]);

  const handleDismiss = useCallback(() => router.push('/dashboard'), [router]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#0a0a0a] p-4">
      <SmsConfirm
        text={text}
        candidates={candidates}
        onSave={handleSave}
        onDismiss={handleDismiss}
        locale={locale}
        {...(status === 'done' ? {} : {})}
      />
    </main>
  );
}

export default function SmsConfirmPage() {
  return (
    <Suspense fallback={null}>
      <SmsConfirmInner />
    </Suspense>
  );
}
