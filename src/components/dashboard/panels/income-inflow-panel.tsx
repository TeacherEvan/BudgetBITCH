'use client';

import { useState } from 'react';
import { useLocale } from 'next-intl';
import { motion } from 'framer-motion';
import { Plus, Trash2, ArrowUpRight, TrendingUp, DollarSign } from 'lucide-react';
import { useIncomes } from '@/hooks/use-local-db';
import { useCurrency } from '@/hooks/use-currency';
import { AddIncomeModal } from '../add-income-modal';
import { Card } from '@/components/ui/card';
import { EmptyState } from './empty-state';
import type { IncomeCategory } from '@/lib/types/budget';

interface IncomeInflowPanelProps {
  locale?: 'th' | 'en';
}

const CATEGORY_ICONS: Record<IncomeCategory, string> = {
  salary: '💵',
  freelance: '💻',
  business: '🏢',
  investments: '📈',
  gift: '🎁',
  refund: '🔄',
  other: '✨',
};

const CATEGORY_NAMES_TH: Record<IncomeCategory, string> = {
  salary: 'เงินเดือน',
  freelance: 'งานอิสระ',
  business: 'ธุรกิจ',
  investments: 'การลงทุน',
  gift: 'ของขวัญ',
  refund: 'คืนเงิน',
  other: 'อื่นๆ',
};

const CATEGORY_NAMES_EN: Record<IncomeCategory, string> = {
  salary: 'Salary',
  freelance: 'Freelance',
  business: 'Business',
  investments: 'Investments',
  gift: 'Gift',
  refund: 'Refund',
  other: 'Other',
};

export function IncomeInflowPanel({ locale: propLocale }: IncomeInflowPanelProps) {
  const contextLocale = useLocale() as 'th' | 'en';
  const locale = propLocale || contextLocale;
  const formatCurrency = useCurrency();
  const { incomes, remove: deleteIncome, loading } = useIncomes();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Group by category to show totals
  const categoryTotals = incomes.reduce((acc, inc) => {
    acc[inc.category] = (acc[inc.category] || 0) + inc.amount;
    return acc;
  }, {} as Record<IncomeCategory, number>);

  const totalInflow = incomes.reduce((sum, inc) => sum + inc.amount, 0);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
        <p className="text-white/60 text-xs">
          {locale === 'th' ? 'กำลังโหลดข้อมูลรายได้...' : 'Loading income entries...'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Summary stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card variant="default" className="p-4 flex items-center justify-between border-emerald-950 bg-emerald-950/5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <span className="block text-[10px] text-white/50 uppercase tracking-wider font-semibold">
                {locale === 'th' ? 'รวมรายรับทั้งหมด' : 'Total Inflow'}
              </span>
              <span className="text-2xl font-bold text-white font-mono">
                {formatCurrency(totalInflow, locale)}
              </span>
            </div>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1 bg-emerald-500 hover:bg-emerald-600 text-black px-3 py-1.5 rounded-xl text-xs font-semibold shadow-lg shadow-emerald-500/10 transition"
          >
            <Plus className="w-4 h-4" />
            {locale === 'th' ? 'เพิ่มรายได้' : 'Add Income'}
          </button>
        </Card>

        {/* Small distribution preview */}
        <Card variant="default" className="p-4 border-zinc-900/80 bg-zinc-950/20">
          <span className="block text-[10px] text-white/50 uppercase tracking-wider font-semibold mb-2">
            {locale === 'th' ? 'การกระจายประเภทรายรับ' : 'Category Distribution'}
          </span>
          <div className="flex flex-wrap gap-2">
            {Object.keys(categoryTotals).length === 0 ? (
              <span className="text-xs text-white/30 italic">
                {locale === 'th' ? 'ไม่มีข้อมูล' : 'No data'}
              </span>
            ) : (
              Object.entries(categoryTotals).map(([cat, amount]) => (
                <div
                  key={cat}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-[11px] font-mono"
                >
                  <span>{CATEGORY_ICONS[cat as IncomeCategory]}</span>
                  <span className="text-white/60">
                    {locale === 'th' ? CATEGORY_NAMES_TH[cat as IncomeCategory] : CATEGORY_NAMES_EN[cat as IncomeCategory]}
                  </span>
                  <span className="text-emerald-400 font-bold">
                    {formatCurrency(amount, locale)}
                  </span>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Income List */}
      <Card variant="default" className="p-4 border-zinc-900 bg-zinc-950/10">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <ArrowUpRight className="w-4 h-4 text-emerald-400" />
          {locale === 'th' ? 'รายการรายรับล่าสุด' : 'Recent Income Logs'}
        </h3>

        {incomes.length === 0 ? (
          <EmptyState
            title={locale === 'th' ? 'ยังไม่มีรายการรายรับ' : 'No Inflow Logged Yet'}
            description={locale === 'th' ? 'เพิ่มรายรับรายสัปดาห์หรือรายเดือนของคุณเพื่อคำนวณการใช้เงินที่แม่นยำขึ้น' : 'Log your freelance, side hustle, or salary income to see accurate disposables'}
            icon={<DollarSign className="w-8 h-8 text-white/20" />}
            onAction={() => setIsAddModalOpen(true)}
            actionLabel={locale === 'th' ? 'เพิ่มรายได้แรก' : 'Add First Income'}
          />
        ) : (
          <div className="divide-y divide-zinc-900 border-t border-zinc-900">
            {incomes.map((inc) => (
              <motion.div
                key={inc.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between py-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-lg select-none">
                    {CATEGORY_ICONS[inc.category]}
                  </div>
                  <div className="min-w-0">
                    <span className="block text-sm font-semibold text-white truncate">
                      {inc.source}
                    </span>
                    <div className="flex items-center gap-1.5 text-[10px] text-white/40">
                      <span>{inc.date}</span>
                      <span>•</span>
                      <span className="capitalize">
                        {locale === 'th' ? CATEGORY_NAMES_TH[inc.category] : CATEGORY_NAMES_EN[inc.category]}
                      </span>
                      <span>•</span>
                      <span>
                        {locale === 'th' 
                          ? (inc.frequency === 'one_time' ? 'ครั้งเดียว' : 'ประจำ') 
                          : (inc.frequency === 'one_time' ? 'One-time' : 'Recurring')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="block text-sm font-bold text-emerald-400 font-mono">
                      +{formatCurrency(inc.amount, locale)}
                    </span>
                    {inc.taxDeducted !== undefined && (
                      <span className="block text-[9px] text-rose-400/70 font-mono">
                        -{formatCurrency(inc.taxDeducted, locale)} tax
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => deleteIncome(inc.id)}
                    className="p-2 text-white/20 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </Card>

      <AddIncomeModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        locale={locale}
      />
    </div>
  );
}
