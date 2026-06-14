// components/dashboard/panels/net-worth-header.tsx
'use client';

import { motion } from 'framer-motion';
import { formatCurrency } from '@/lib/utils/currency';

interface NetWorthHeaderProps {
  locale: 'th' | 'en';
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  isPositive: boolean;
}

export function NetWorthHeader({ locale, totalAssets, totalLiabilities, netWorth, isPositive }: NetWorthHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid gap-4 sm:grid-cols-3 mb-6"
    >
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-4"
      >
        <p className="text-sm text-emerald-400">{locale === 'th' ? 'รวมทรัพย์สิน' : 'Total Assets'}</p>
        <p className="text-2xl font-bold font-mono text-white">{formatCurrency(totalAssets, locale)}</p>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-xl border border-rose-400/30 bg-rose-400/10 p-4"
      >
        <p className="text-sm text-rose-400">{locale === 'th' ? 'รวมหนี้สิน' : 'Total Liabilities'}</p>
        <p className="text-2xl font-bold font-mono text-white">{formatCurrency(totalLiabilities, locale)}</p>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.15 }}
        className={`rounded-xl p-4 ${isPositive ? 'bg-emerald-400/10 border-emerald-400/30' : 'bg-rose-400/10 border-rose-400/30'}`}
      >
        <p className="text-sm text-amber-400">{locale === 'th' ? 'มูลค่าสุทธิ' : 'Net Worth'}</p>
        <p className={`text-2xl font-bold font-mono ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
          {isPositive ? '+' : ''}{formatCurrency(netWorth, locale)}
        </p>
      </motion.div>
    </motion.div>
  );
}