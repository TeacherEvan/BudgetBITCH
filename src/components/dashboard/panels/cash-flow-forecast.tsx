// components/dashboard/panels/cash-flow-forecast.tsx
'use client';

import { Calendar, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { useCashFlowForecast } from '@/hooks/use-local-db';
import { Card } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils/currency';
import { format, addDays, addMonths, startOfMonth, endOfMonth } from 'date-fns';
import { th } from 'date-fns/locale';

interface CashFlowForecastProps {
  locale?: 'th' | 'en';
}

export function CashFlowForecast({ locale = 'en' }: CashFlowForecastProps) {
  const { forecast, loading } = useCashFlowForecast();

  // Generate forecast data
  const forecastData = [
    { period: '30 days', days: 30, amount: forecast.thirtyDays },
    { period: '60 days', days: 60, amount: forecast.sixtyDays },
    { period: '90 days', days: 90, amount: forecast.ninetyDays },
  ];

  const startOfThisMonth = startOfMonth(new Date());
  const endOfThisMonth = endOfMonth(new Date());
  const daysInMonth = endOfThisMonth.getDate();
  const today = new Date();
  const dayOfMonth = today.getDate();
  const daysRemaining = daysInMonth - dayOfMonth;

  // Generate daily cash flow
  const dailyFlow = Array.from({ length: 30 }, (_, i) => {
    const date = addDays(new Date(), i + 1);
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const baseFlow = -1000 + Math.random() * 2000; // Random daily flow
    return {
      date,
      flow: baseFlow,
      cumulative: baseFlow * (i + 1),
    };
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">🔮 Cash Flow Forecast</h3>
        <div className="flex items-center gap-2 text-sm text-white/60">
          <span className="px-2 py-1 rounded-full bg-emerald-400/20 text-emerald-400">
            📈 {locale === 'th' ? 'รับเข้า' : 'Inflow'}
          </span>
          <span className="px-2 py-1 rounded-full bg-rose-400/20 text-rose-400">
            📉 {locale === 'th' ? 'จ่ายออก' : 'Outflow'}
          </span>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        {[
          { label: '30 Days', value: 10000, icon: TrendingUp, color: 'emerald' },
          { label: '60 Days', value: 18000, icon: TrendingUp, color: 'emerald' },
          { label: '90 Days', value: 25000, icon: TrendingUp, color: 'emerald' },
        ].map((item) => (
          <div key={item.label} className={`bg-${item.color}-400/10 border border-${item.color}-400/30 rounded-xl p-4`}>
            <p className="text-sm text-${item.color}-400">{item.label}</p>
            <p className="text-2xl font-bold font-mono text-white">{formatCurrency(item.value, 'en')}</p>
          </div>
        ))}
      </div>

      <Card className="p-4 mb-4">
        <h4 className="font-semibold text-white mb-4">{locale === 'th' ? 'กระแสเงินสดรายวัน (30 วัน)' : 'Daily Cash Flow (30 Days)'}</h4>
        <div className="h-48 flex items-end gap-1">
          {dailyFlow.map((day, i) => {
            const height = Math.max(4, Math.min(100, (day.flow + 3000) / 6000 * 100));
            const isNegative = day.flow < 0;
            return (
              <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1">
                <div 
                  className={`w-full rounded-t transition-all duration-200 ${isNegative ? 'bg-rose-400' : 'bg-emerald-400'}`}
                  style={{ height: `${height}%` }}
                />
                <span className="text-[10px] text-white/50">{format(day.date, 'd')}</span>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="p-4 mb-4">
        <h4 className="font-semibold text-white mb-4">{locale === 'th' ? 'การชำระหนี้สิน/บิลใน 30 วันข้างหน้า' : 'Upcoming Payments (30 Days)'}</h4>
        <div className="space-y-2">
          {[
            { name: 'Electric Bill', amount: 1800, date: addDays(new Date(), 5), type: 'bill' },
            { name: 'Credit Card', amount: 12000, date: addDays(new Date(), 12), type: 'debt' },
            { name: 'Internet', amount: 799, date: addDays(new Date(), 20), type: 'bill' },
            { name: 'Car Loan', amount: 8500, date: addDays(new Date(), 28), type: 'debt' },
          ].map((item, i) => (
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
                <p className="font-mono text-rose-400">-{formatCurrency(item.amount, 'en')}</p>
                <p className="text-xs text-white/50">{locale === 'th' ? 'ครบกำหนด' : 'Due'}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-4">
        <h4 className="font-semibold text-white mb-4">{locale === 'th' ? 'สรุปกระแสเงินสด' : 'Cash Flow Summary'}</h4>
        <div className="grid gap-3 sm:grid-cols-4">
          <div className="bg-emerald-400/10 border border-emerald-400/30 rounded-xl p-4">
            <p className="text-sm text-emerald-400">{locale === 'th' ? 'รับเข้า (30 วัน)' : 'Inflow (30d)'}</p>
            <p className="text-2xl font-bold font-mono text-white">{formatCurrency(45000, 'en')}</p>
          </div>
          <div className="bg-rose-400/10 border border-rose-400/30 rounded-xl p-4">
            <p className="text-sm text-rose-400">{locale === 'th' ? 'จ่ายออก (30 วัน)' : 'Outflow (30d)'}</p>
            <p className="text-2xl font-bold font-mono text-white">{formatCurrency(-38000, 'en')}</p>
          </div>
          <div className="bg-amber-400/10 border border-amber-400/30 rounded-xl p-4">
            <p className="text-sm text-amber-400">{locale === 'th' ? 'สุทธิ (30 วัน)' : 'Net (30d)'}</p>
            <p className="text-2xl font-bold font-mono text-emerald-400">{formatCurrency(7000, 'en')}</p>
          </div>
          <div className="bg-blue-400/10 border border-blue-400/30 rounded-xl p-4">
            <p className="text-sm text-blue-400">{locale === 'th' ? 'วันเหลือในเดือนนี้' : 'Days Left in Month'}</p>
            <p className="text-2xl font-bold font-mono text-white">{daysRemaining}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}