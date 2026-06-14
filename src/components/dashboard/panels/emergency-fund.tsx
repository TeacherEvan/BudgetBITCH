// components/dashboard/panels/emergency-fund.tsx
'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Shield, CheckCircle } from 'lucide-react';
import { useEmergencyFund } from '@/hooks/use-local-db';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ProgressRing } from '@/components/ui/progress-ring';
import { Modal } from '@/components/ui/modal';
import { formatCurrency } from '@/lib/utils/currency';
import { EmergencyFundSkeleton } from './emergency-fund-skeleton';

interface EmergencyFundProps {
  locale?: 'th' | 'en';
}

interface FormData {
  targetAmount: string;
  currentAmount: string;
  name: string;
}

const initialFormData: FormData = {
  targetAmount: '50000',
  currentAmount: '0',
  name: 'Emergency Fund',
};

export function EmergencyFund({ locale = 'en' }: EmergencyFundProps) {
  const { fund, loading, update: updateFund } = useEmergencyFund();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState<FormData>(initialFormData);

  const progress = fund.targetAmount > 0 ? (fund.currentAmount / fund.targetAmount) * 100 : 0;
  const isComplete = fund.currentAmount >= fund.targetAmount;
  const remaining = Math.max(0, fund.targetAmount - fund.currentAmount);

  const resetForm = () => {
    setFormData(initialFormData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.targetAmount) return;
    await updateFund({
      targetAmount: parseFloat(formData.targetAmount),
      currentAmount: parseFloat(formData.currentAmount) || 0,
    });
    setIsFormOpen(false);
    resetForm();
  };

  const handleAddToFund = async (amount: number) => {
    await updateFund({ currentAmount: fund.currentAmount + amount });
  };

  const openForm = () => {
    setFormData(initialFormData);
    setIsFormOpen(true);
  };

  if (loading) {
    return <EmergencyFundSkeleton />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between">
        <motion.h3
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-lg font-semibold text-white flex items-center gap-2"
        >
          <Shield className="w-5 h-5 text-emerald-400" aria-hidden="true" />
          Emergency Fund
        </motion.h3>
        <motion.button
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          onClick={openForm}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Button variant="primary" size="sm">
            <Plus className="w-4 h-4 mr-1" />
            {locale === 'th' ? 'ตั้งเป้า' : 'Set Target'}
          </Button>
        </motion.button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex items-center gap-6"
      >
        <ProgressRing
          value={Math.min(100, progress)}
          size={100}
          strokeWidth={8}
          color="emerald"
          showValue
        />
        <div className="flex-1 space-y-2">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="text-sm text-white/60"
          >
            {locale === 'th' ? 'เป้าหมาย' : 'Target'}
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-2xl font-bold font-mono text-white"
          >
            {formatCurrency(fund.targetAmount, locale)}
          </motion.p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
            className="text-sm text-white/60"
          >
            {locale === 'th' ? 'ปัจจุบัน' : 'Current'}: {formatCurrency(fund.currentAmount, locale)}
          </motion.p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-sm text-white/60"
          >
            {locale === 'th' ? 'เหลือ' : 'Remaining'}: {formatCurrency(remaining, locale)}
          </motion.p>
          {isComplete && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2 mt-2 text-emerald-400"
            >
              <CheckCircle className="w-5 h-5" aria-hidden="true" />
              <span className="font-medium">{locale === 'th' ? 'บรรลุเป้าหมายแล้ว!' : 'Goal Achieved!'}</span>
            </motion.div>
          )}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="p-4" variant="default">
          <h4 className="font-semibold text-white mb-3">{locale === 'th' ? 'เพิ่มเงินเข้ากองทุน' : 'Add to Fund'}</h4>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { amount: 1000, variant: 'secondary' as const },
              { amount: 5000, variant: 'secondary' as const },
              { amount: 10000, variant: 'primary' as const },
            ].map(({ amount, variant }, i) => (
              <motion.button
                key={amount}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 + 0.05 * i }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleAddToFund(amount)}
              >
                <Button variant={variant} size="sm">
                  +{formatCurrency(amount, locale)}
                </Button>
              </motion.button>
            ))}
          </div>
        </Card>
      </motion.div>

      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={locale === 'th' ? 'ตั้งเป้ากองทุนสำรอง' : 'Set Emergency Fund Target'}
        size="md"
        closeOnEscape
        closeOnOverlayClick
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label={locale === 'th' ? 'ชื่อกองทุน' : 'Fund Name'}
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            required
            autoFocus
          />
          <Input
            label={locale === 'th' ? 'เป้าหมายจำนวนเงิน' : 'Target Amount'}
            type="number"
            step="0.01"
            min="0"
            value={formData.targetAmount}
            onChange={e => setFormData({ ...formData, targetAmount: e.target.value })}
            required
          />
          <Input
            label={locale === 'th' ? 'จำนวนปัจจุบัน' : 'Current Amount'}
            type="number"
            step="0.01"
            min="0"
            value={formData.currentAmount}
            onChange={e => setFormData({ ...formData, currentAmount: e.target.value })}
          />
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setIsFormOpen(false)} className="flex-1">
              {locale === 'th' ? 'ยกเลิก' : 'Cancel'}
            </Button>
            <Button type="submit" className="flex-1">
              {locale === 'th' ? 'บันทึก' : 'Save'}
            </Button>
          </div>
        </form>
      </Modal>
    </motion.div>
  );
}