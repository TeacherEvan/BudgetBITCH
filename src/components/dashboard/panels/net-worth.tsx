// components/dashboard/panels/net-worth.tsx
'use client';

import { useState } from 'react';
import { Plus, Trash2, Edit, PieChart } from 'lucide-react';
import { useNetWorth } from '@/hooks/use-local-db';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils/currency';

interface NetWorthProps {
  locale?: 'th' | 'en';
}

export function NetWorth({ locale = 'en' }: { locale?: 'th' | 'en' }) {
  const { snapshot, addAsset, updateAsset, removeAsset, addLiability, updateLiability, removeLiability, loading } = useNetWorth();
  const [showAssetForm, setShowAssetForm] = useState(false);
  const [showLiabilityForm, setShowLiabilityForm] = useState(false);

  const totalAssets = 0;
  const totalLiabilities = 0;
  const netWorth = 0;
  const isPositive = true;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">💰 Net Worth</h3>
        <div className="flex gap-2">
          <Button variant="primary" size="sm" onClick={() => {}}>{locale === 'th' ? '+ ทรัพย์สิน' : '+ Asset'}</Button>
          <Button variant="secondary" size="sm" onClick={(): void => {}}>{locale === 'th' ? '+ หนี้สิน' : '+ Liability'}</Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <div className="bg-emerald-400/10 border border-emerald-400/30 rounded-xl p-4">
          <p className="text-sm text-emerald-400">{locale === 'th' ? 'รวมทรัพย์สิน' : 'Total Assets'}</p>
          <p className="text-2xl font-bold font-mono text-white">{formatCurrency(0, locale === 'th' ? 'th' : 'en')}</p>
        </div>
        <div className="bg-rose-400/10 border border-rose-400/30 rounded-xl p-4">
          <p className="text-sm text-rose-400">{locale === 'th' ? 'รวมหนี้สิน' : 'Total Liabilities'}</p>
          <p className="text-2xl font-bold font-mono text-white">{formatCurrency(0, locale === 'th' ? 'th' : 'en')}</p>
        </div>
        <div className="bg-emerald-400/10 border border-emerald-400/30 rounded-xl p-4">
          <p className="text-sm text-emerald-400">{locale === 'th' ? 'มูลค่าสุทธิ' : 'Net Worth'}</p>
          <p className="text-2xl font-bold font-mono text-white">{formatCurrency(0, locale === 'th' ? 'th' : 'en')}</p>
        </div>
      </div>

      <div className="grid gap-4">
        <div>
          <h4 className="font-semibold text-white mb-3">{locale === 'th' ? 'ทรัพย์สิน' : 'Assets'}</h4>
          <div className="space-y-2">
            <div className="p-3 rounded-xl bg-black/30 border border-white/10 text-center text-white/50">
              No assets yet. Add your first asset!
            </div>
          </div>
        </div>
        <div>
          <h4 className="font-semibold text-white mb-3">{locale === 'th' ? 'หนี้สิน' : 'Liabilities'}</h4>
          <div className="space-y-2">
            <div className="p-3 rounded-xl bg-black/30 border border-white/10 text-center text-white/50">
              No liabilities yet. Add your first liability!
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}