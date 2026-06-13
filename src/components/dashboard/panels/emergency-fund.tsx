// components/dashboard/panels/emergency-fund.tsx
'use client';

import { useState } from 'react';
import { Plus, Trash2, Edit, Shield, AlertCircle, CheckCircle } from 'lucide-react';
import { useEmergencyFund } from '@/hooks/use-local-db';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ProgressRing } from '@/components/ui/progress-ring';
import { formatCurrency } from '@/lib/utils/currency';
import { format } from 'date-fns';

interface EmergencyFundProps {
  locale?: 'th' | 'en';
}

export function EmergencyFund({ locale = 'en' }: EmergencyFundProps) {
  const { fund, loading, update: updateFund } = useEmergencyFund();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    targetAmount: '50000',
    currentAmount: '0',
    name: 'Emergency Fund',
  });

  const progress = fund.targetAmount > 0 ? (fund.currentAmount / fund.targetAmount) * 100 : 0;
  const isComplete = fund.currentAmount >= fund.targetAmount;

  const resetForm = () => {
    setEditingId(null);
    setShowForm(false);
    setFormData({ targetAmount: '50000', currentAmount: '0', name: 'Emergency Fund' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.targetAmount) return;
    resetForm();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">🛡️ Emergency Fund</h3>
        <Button variant="primary" size="sm" onClick={() => { setShowForm(true); }}>
          <Plus className="w-4 h-4 mr-1" /> {locale === 'th' ? 'ตั้งเป้า' : 'Set Target'}
        </Button>
      </div>

      <div className="flex items-center gap-6">
        <ProgressRing value={Math.min(100, progress)} size={100} strokeWidth={8} color="emerald" showValue />
        <div className="flex-1">
          <p className="text-sm text-white/60">{locale === 'th' ? 'เป้าหมาย' : 'Target'}</p>
          <p className="text-2xl font-bold font-mono text-white">{formatCurrency(fund.targetAmount, locale)}</p>
          <p className="text-sm text-white/60 mt-1">{locale === 'th' ? 'ปัจจุบัน' : 'Current'}: {formatCurrency(fund.currentAmount, locale)}</p>
          <p className="text-sm text-white/60 mt-1">{locale === 'th' ? 'เหลือ' : 'Remaining'}: {formatCurrency(Math.max(0, fund.targetAmount - fund.currentAmount), locale)}</p>
          {isComplete && (
            <div className="flex items-center gap-2 mt-2 text-emerald-400">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">{locale === 'th' ? 'บรรลุเป้าหมายแล้ว!' : 'Goal Achieved!'}</span>
            </div>
          )}
        </div>
      </div>

      <Card className="p-4">
        <h4 className="font-semibold text-white mb-3">{locale === 'th' ? 'เพิ่มเงินเข้ากองทุน' : 'Add to Fund'}</h4>
        <div className="grid gap-3 sm:grid-cols-3">
          <Button variant="secondary" size="sm" onClick={() => {
            const newAmount = fund.currentAmount + 1000;
            const newProgress = progress + (1000 / fund.targetAmount) * 100;
          }}>
            +{formatCurrency(1000, locale)}
          </Button>
          <Button variant="secondary" size="sm" onClick={() => {}}>
            +{formatCurrency(5000, locale)}
          </Button>
          <Button variant="primary" size="sm" onClick={() => {}}>
            +{formatCurrency(10000, locale)}
          </Button>
        </div>
      </Card>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
          <div className="bg-black/95 border border-white/10 rounded-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-white mb-4">{locale === 'th' ? 'ตั้งเป้ากองทุนสำรอง' : 'Set Emergency Fund Target'}</h3>
            <form onSubmit={(e) => { e.preventDefault(); }} className="space-y-3">
              <Input label={locale === 'th' ? 'ชื่อกองทุน' : 'Fund Name'} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
              <Input label={locale === 'th' ? 'เป้าหมายจำนวนเงิน' : 'Target Amount'} type="number" step="0.01" min="0" value={formData.targetAmount} onChange={e => setFormData({...formData, targetAmount: e.target.value})} required />
              <Input label={locale === 'th' ? 'จำนวนปัจจุบัน' : 'Current Amount'} type="number" step="0.01" min="0" value={formData.currentAmount} onChange={e => setFormData({...formData, currentAmount: e.target.value})} />
              <div className="flex gap-2">
                <Button type="button" onClick={() => setShowForm(false)} variant="secondary">{locale === 'th' ? 'ยกเลิก' : 'Cancel'}</Button>
                <Button type="submit" className="flex-1">{locale === 'th' ? 'บันทึก' : 'Save'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}