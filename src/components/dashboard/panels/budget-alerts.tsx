// components/dashboard/panels/budget-alerts.tsx
'use client';

import { useMemo } from 'react';
import { AlertCircle, CheckCircle, AlertTriangle, Info, TrendingUp } from 'lucide-react';
import { useExpenses, useBudgets } from '@/hooks/use-local-db';
import { useWizardProfile } from '@/hooks/use-local-db';
import { generateBudgetAlerts, getBudgetSummary } from '@/lib/utils/budget-alerts';
import { useCurrency } from '@/hooks/use-currency';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { BudgetCategory, ExpenseEntry } from '@/lib/types/budget';

interface BudgetAlertsProps {
  locale?: 'th' | 'en';
}

const ICONS = {
  critical: AlertCircle,
  warning: AlertTriangle,
  info: Info,
  success: CheckCircle,
};

const COLORS = {
  critical: 'text-rose-400 bg-rose-400/10 border-rose-400/30',
  warning: 'text-amber-400 bg-amber-400/10 border-amber-400/30',
  info: 'text-blue-400 bg-blue-400/10 border-blue-400/30',
  success: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30',
};

export function BudgetAlerts({ locale = 'en' }: BudgetAlertsProps) {
  const formatCurrency = useCurrency();

  const { expenses: rawExpenses } = useExpenses();
  const { budgets: rawBudgets } = useBudgets();
  const { profile } = useWizardProfile();

  const expenses = rawExpenses as { category: ExpenseEntry['category']; amount: number }[];
  const budgets = rawBudgets as BudgetCategory[];

  const alerts = useMemo(() =>
    generateBudgetAlerts(budgets, expenses, locale),
    [budgets, expenses, locale]
  );

  const summary = useMemo(() =>
    getBudgetSummary(budgets, expenses),
    [budgets, expenses]
  );

  if (!profile?.completed) {
    return (
      <Card className="p-4 text-center">
        <p className="text-white/50">
          {locale === 'th' 
            ? '👋 สวัสดี! เพื่อดูสุขภาพงบประมาณ ให้ทำแบบสอบถามตั้งค่า 2 นาทีให้เสร็จก่อน → ไปที่ตั้งค่า'
            : '👋 Hey! To see your budget health, finish the quick 2-minute setup first → Go to Setup'}
        </p>
        <Button
          variant="secondary"
          size="sm"
          className="mt-3"
          onClick={() => { window.location.href = '/wizard'; }}
        >
          {locale === 'th' ? 'ไปตั้งค่า' : 'Go to Setup'}
        </Button>
      </Card>
    );
  }

  const counts = { critical: 0, warning: 0, success: 0 };
  for (const a of alerts) {
    if (a.type === 'critical') counts.critical++;
    else if (a.type === 'warning') counts.warning++;
    else if (a.type === 'success') counts.success++;
  }
  const { critical: criticalCount, warning: warningCount, success: successCount } = counts;

  return (
    <div className="space-y-4">
      {/* Header with Summary */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <TrendingUp className="text-amber-400" />
          {locale === 'th' ? 'การแจ้งเตือนงบประมาณ' : 'Budget Alerts'}
        </h3>
        <div className="flex items-center gap-2">
          {criticalCount > 0 && (
            <span className="px-2 py-0.5 text-xs rounded-full bg-rose-400/20 text-rose-400 border border-rose-400/30">{criticalCount}</span>
          )}
          {warningCount > 0 && (
            <span className="px-2 py-0.5 text-xs rounded-full bg-amber-400/20 text-amber-400 border border-amber-400/30">{warningCount}</span>
          )}
          {successCount > 0 && criticalCount === 0 && warningCount === 0 && (
            <span className="px-2 py-0.5 text-xs rounded-full bg-emerald-400/20 text-emerald-400 border border-emerald-400/30">{successCount}</span>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 @sm:grid-cols-3 gap-3 mb-4">
        <Card className="p-3 bg-amber-400/10 border-amber-400/30">
          <p className="text-xs text-amber-400">{locale === 'th' ? 'งบประมาณรวม' : 'Total Budget'}</p>
          <p className="font-mono text-lg text-white">{formatCurrency(summary.totalBudget, locale)}</p>
        </Card>
        <Card className="p-3 bg-rose-400/10 border-rose-400/30">
          <p className="text-xs text-rose-400">{locale === 'th' ? 'ใช้ไปแล้ว' : 'Spent'}</p>
          <p className="font-mono text-lg text-white">{formatCurrency(summary.totalSpent, locale)}</p>
        </Card>
        <Card className="p-3 bg-emerald-400/10 border-emerald-400/30">
          <p className="text-xs text-emerald-400">{locale === 'th' ? 'คงเหลือ' : 'Remaining'}</p>
          <p className="font-mono text-lg text-white">{formatCurrency(summary.totalRemaining, locale)}</p>
        </Card>
      </div>

      {/* Alerts List */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {alerts.length === 0 ? (
          <Card className="p-6 text-center">
            <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
            <p className="text-white/60">
              {locale === 'th' 
                ? 'ยังไม่มีการแจ้งเตือน งบประมาณดูดี'
                : 'No alerts yet. Budget looking good!'}
            </p>
          </Card>
        ) : (
          alerts.map((alert) => {
            const Icon = ICONS[alert.type];
            return (
              <Card 
                key={alert.id} 
                className={`p-3 border-l-4 ${COLORS[alert.type]}`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    <Icon className={`w-5 h-5 ${COLORS[alert.type].split(' ')[0]}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white text-sm">{alert.message}</p>
                    {alert.actionable && (
                      <p className="text-xs text-white/60 mt-1 flex items-center gap-1">
                        <span className="text-amber-400">💡</span>
                        {alert.actionable}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-xs text-white/50">
                      <span>{formatCurrency(alert.spent, locale)} / {formatCurrency(alert.limit, locale)}</span>
                      <span className={`px-2 py-0.5 rounded ${COLORS[alert.type].replace('border-', 'bg-').replace('/10', '/30')}`}>
                        {Math.round(alert.pct)}%
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 @sm:grid-cols-3 gap-2 text-center pt-2 border-t border-white/10">
        <div className={summary.categoriesOverBudget > 0 ? 'text-rose-400' : 'text-white/50'}>
          <p className="text-2xl font-bold">{summary.categoriesOverBudget}</p>
          <p className="text-xs">{locale === 'th' ? 'เกินงบ' : 'Over Budget'}</p>
        </div>
        <div className={summary.categoriesNearLimit > 0 ? 'text-amber-400' : 'text-white/50'}>
          <p className="text-2xl font-bold">{summary.categoriesNearLimit}</p>
          <p className="text-xs">{locale === 'th' ? 'ใกล้เต็ม' : 'Near Limit'}</p>
        </div>
        <div className="text-emerald-400">
          <p className="text-2xl font-bold">{summary.categoriesOnTrack}</p>
          <p className="text-xs">{locale === 'th' ? 'อยู่ในงบ' : 'On Track'}</p>
        </div>
      </div>
    </div>
  );
}