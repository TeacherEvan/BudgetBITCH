// components/dashboard/panels/cash-flow-forecast.tsx
'use client';

import { useMemo } from 'react';
import { Info } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useCurrency } from '@/hooks/use-currency';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { useBills, useDebtPayoff } from '@/hooks/use-local-db';

interface CashFlowForecastProps {
  locale?: 'th' | 'en';
}

// Next `count` due dates for a monthly bill (dueDay is day-of-month, 1-31).
function nextDueDates(dueDay: number, count: number): Date[] {
  const today = new Date();
  const dates: Date[] = [];
  let month = today.getMonth();
  let year = today.getFullYear();
  // Find the first occurrence on/after today.
  let candidate = new Date(year, month, dueDay);
  if (candidate < today) {
    month += 1;
    if (month > 11) { month = 0; year += 1; }
    candidate = new Date(year, month, dueDay);
  }
  for (let i = 0; i < count; i++) {
    dates.push(new Date(candidate));
    month = candidate.getMonth() + 1;
    year = candidate.getFullYear() + Math.floor(month / 12);
    month = month % 12;
    candidate = new Date(year, month, dueDay);
  }
  return dates;
}

export function CashFlowForecast({ locale = 'en' }: CashFlowForecastProps) {
  const formatCurrency = useCurrency();

  const { bills, loading: billsLoading } = useBills();
  const { debts, loading: debtsLoading } = useDebtPayoff();

  const loading = billsLoading || debtsLoading;

  // Combine real bills + debt minimum payments into upcoming payments.
  const upcoming = useMemo(() => {
    const items: { name: string; amount: number; date: Date; type: 'bill' | 'debt' }[] = [];

    bills
      .filter(b => b.isActive)
      .forEach(b => {
        const [next] = nextDueDates(b.dueDay, 1);
        if (next) items.push({ name: b.name, amount: b.amount, date: next, type: 'bill' });
      });

    debts.forEach(d => {
      // Spread debt payments across the next 30 days using a simple cadence.
      const [next] = nextDueDates(new Date().getDate() + 1, 1);
      if (next) items.push({
        name: d.name,
        amount: d.minimumPayment || 0,
        date: next,
        type: 'debt',
      });
    });

    return items
      .filter(i => i.amount > 0)
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(0, 6);
  }, [bills, debts]);

  const totalUpcoming = upcoming.reduce((sum, i) => sum + i.amount, 0);

  // Monthly fixed outflow (bills + debt minimums).
  const monthlyOutflow =
    bills.filter(b => b.isActive).reduce((sum, b) => sum + b.amount, 0) +
    debts.reduce((sum, d) => sum + (d.minimumPayment || 0), 0);

  if (loading) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">🔮 {locale === 'th' ? 'พยากรณ์กระแสเงินสด' : 'Cash Flow Forecast'}</h3>
        <div className="h-24 bg-white/5 rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">🔮 {locale === 'th' ? 'พยากรณ์กระแสเงินสด' : 'Cash Flow Forecast'}</h3>
      </div>

      {upcoming.length === 0 ? (
        <Card className="p-6 text-center">
          <Info className="w-10 h-10 text-amber-400 mx-auto mb-3" />
          <p className="text-white/70 font-medium">
            {locale === 'th' ? 'ยังไม่มีบิลหรือหนี้ในระบบ' : 'No bills or debts yet'}
          </p>
          <p className="text-sm text-white/50 mt-1">
            {locale === 'th'
              ? 'เพิ่มบิลหรือหนี้สินในแผง Bills / Debt ด้านล่าง แล้วกราฟนี้จะแสดงวันครบกำหนดจ่ายจริง'
              : 'Add your bills or debts in the Bills / Debt panels below — this view will then show your real upcoming due dates.'}
          </p>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3 mb-6">
            {[
              { label: locale === 'th' ? 'จ่ายใน 30 วัน' : 'Due (30 Days)', value: totalUpcoming, color: 'rose' },
              { label: locale === 'th' ? 'จ่ายคงที่/เดือน' : 'Fixed / Month', value: monthlyOutflow, color: 'amber' },
              { label: locale === 'th' ? 'รายการที่ต้องจ่าย' : 'Items Due', value: upcoming.length, color: 'emerald', raw: true },
            ].map((item) => (
              <div key={item.label} className={`bg-${item.color}-400/10 border border-${item.color}-400/30 rounded-xl p-4`}>
                <p className={`text-sm text-${item.color}-400`}>{item.label}</p>
                <p className="text-2xl font-bold font-mono text-white">
                  {item.raw ? item.value : formatCurrency(item.value, locale)}
                </p>
              </div>
            ))}
          </div>

          <Card className="p-4">
            <h4 className="font-semibold text-white mb-4">{locale === 'th' ? 'การชำระหนี้สิน/บิลในเร็วๆ นี้' : 'Upcoming Payments'}</h4>
            <div className="space-y-2">
              {upcoming.map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-black/30 border border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-400/20 flex items-center justify-center">
                      <span className="text-amber-400">{item.type === 'bill' ? '📄' : '💳'}</span>
                    </div>
                    <div>
                      <p className="font-medium text-white">{item.name}</p>
                      <p className="text-xs text-white/60">{format(item.date, locale === 'th' ? 'd MMM yyyy' : 'MMM d, yyyy', { locale: locale === 'th' ? th : undefined })}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-rose-400">-{formatCurrency(item.amount, locale)}</p>
                    <p className="text-xs text-white/50">{locale === 'th' ? 'ครบกำหนด' : 'Due'}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
