// components/dashboard/panels/subscriptions.tsx
'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Edit, CreditCard, Music, Tv, Gamepad2, ShoppingBag } from 'lucide-react';
import { useSubscriptions } from '@/hooks/use-local-db';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { formatCurrency } from '@/lib/utils/currency';
import { generateId } from '@/lib/db/local-db';
import { SubscriptionsSkeleton } from './subscriptions-skeleton';
import { EmptyState } from './empty-state';

interface SubscriptionsProps {
  locale?: 'th' | 'en';
}

interface FormData {
  name: string;
  amount: string;
  cycle: 'monthly' | 'yearly';
  category: 'streaming' | 'music' | 'software' | 'gaming' | 'cloud' | 'other';
  paymentMethod: 'credit_card' | 'debit_card' | 'bank_transfer' | 'wallet';
}

const initialFormData: FormData = {
  name: '',
  amount: '',
  cycle: 'monthly',
  category: 'streaming',
  paymentMethod: 'credit_card',
};

const categoryOptions = (locale: 'th' | 'en') => [
  { value: 'streaming', label: locale === 'th' ? 'สตรีมมิง' : 'Streaming' },
  { value: 'music', label: 'Music' },
  { value: 'software', label: 'Software' },
  { value: 'gaming', label: 'Gaming' },
  { value: 'cloud', label: 'Cloud Storage' },
  { value: 'other', label: 'Other' },
];

const cycleOptions = (locale: 'th' | 'en') => [
  { value: 'monthly', label: locale === 'th' ? 'รายเดือน' : 'Monthly' },
  { value: 'yearly', label: locale === 'th' ? 'รายปี' : 'Yearly' },
];

const paymentOptions = [
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'debit_card', label: 'Debit Card' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'wallet', label: 'Digital Wallet' },
];

export function Subscriptions({ locale = 'en' }: SubscriptionsProps) {
  const { subscriptions, add, update, remove, loading } = useSubscriptions();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);

  const totalMonthly = subscriptions
    .filter(s => s.cycle === 'monthly')
    .reduce((sum, s) => sum + s.amount, 0);
  const totalYearly = subscriptions
    .filter(s => s.cycle === 'yearly')
    .reduce((sum, s) => sum + s.amount / 12, 0);
  const total = totalMonthly + totalYearly;

  const resetForm = () => {
    setEditingId(null);
    setIsFormOpen(false);
    setFormData(initialFormData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.amount) return;

    const sub = {
      ...formData,
      amount: parseFloat(formData.amount),
      id: editingId || generateId(),
      date: new Date().toISOString().split('T')[0],
      isRecurring: true,
    };

    if (editingId) {
      await update(sub as any);
    } else {
      await add(sub as any);
    }
    resetForm();
  };

  const handleEdit = (sub: any) => {
    setEditingId(sub.id);
    setFormData({
      name: sub.name,
      amount: sub.amount.toString(),
      cycle: sub.cycle,
      category: sub.category,
      paymentMethod: sub.paymentMethod,
    });
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    await remove(id);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'streaming': return <Tv className="w-4 h-4" aria-hidden="true" />;
      case 'music': return <Music className="w-4 h-4" aria-hidden="true" />;
      case 'gaming': return <Gamepad2 className="w-4 h-4" aria-hidden="true" />;
      case 'software': return <ShoppingBag className="w-4 h-4" aria-hidden="true" />;
      default: return <CreditCard className="w-4 h-4" aria-hidden="true" />;
    }
  };

  const openForm = () => {
    setFormData(initialFormData);
    setEditingId(null);
    setIsFormOpen(true);
  };

  if (loading) {
    return <SubscriptionsSkeleton />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center justify-between"
      >
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Tv className="w-5 h-5 text-amber-400" aria-hidden="true" />
          Subscriptions
        </h3>
        <div className="flex items-center gap-3">
          <span className="text-sm font-mono text-amber-400">
            {formatCurrency(total, locale)}/mo
          </span>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={openForm}
          >
            <Button variant="primary" size="sm">
              <Plus className="w-4 h-4 mr-1" />
              Add
            </Button>
          </motion.button>
        </div>
      </motion.div>

      {subscriptions.length === 0 ? (
        <EmptyState
          icon={<Tv className="w-8 h-8" aria-hidden="true" />}
          title={locale === 'th' ? 'ยังไม่มีการสมัครสมาชิก' : 'No subscriptions yet'}
          description={locale === 'th' ? 'เริ่มต้นโดยเพิ่มสมาชิกแรกของคุณ' : 'Get started by adding your first subscription'}
          actionLabel={locale === 'th' ? 'เพิ่มสมาชิก' : 'Add Subscription'}
          onAction={openForm}
        />
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="space-y-2"
          role="list"
        >
          {subscriptions.map((sub, index) => (
            <motion.div
              key={sub.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 * index }}
              whileHover={{ x: 4 }}
              className="flex items-center justify-between p-3 rounded-xl bg-black/20 border border-white/10 transition-colors hover:border-white/20"
              role="listitem"
            >
              <div className="flex items-center gap-3">
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/80"
                >
                  {getCategoryIcon(sub.category)}
                </motion.div>
                <div>
                  <p className="font-medium text-white">{sub.name}</p>
                  <p className="text-xs text-white/60 capitalize">{sub.cycle} · {sub.category}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-white">{formatCurrency(sub.amount, locale)}</span>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleEdit(sub)}
                >
                  <Button variant="ghost" size="sm" aria-label={locale === 'th' ? 'แก้ไข' : 'Edit'}>
                    <Edit className="w-4 h-4" aria-hidden="true" />
                  </Button>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleDelete(sub.id)}
                >
                  <Button variant="ghost" size="sm" className="text-rose-400 hover:bg-rose-500/10" aria-label={locale === 'th' ? 'ลบ' : 'Delete'}>
                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                  </Button>
                </motion.button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      <Modal
        isOpen={isFormOpen}
        onClose={resetForm}
        title={editingId ? (locale === 'th' ? 'แก้ไขสมาชิก' : 'Edit Subscription') : (locale === 'th' ? 'เพิ่มสมาชิกใหม่' : 'Add Subscription')}
        size="md"
        closeOnEscape
        closeOnOverlayClick
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label={locale === 'th' ? 'ชื่อบริการ' : 'Service Name'}
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            placeholder={locale === 'th' ? 'เช่น Netflix, Spotify' : 'e.g. Netflix, Spotify'}
            required
            autoFocus
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label={locale === 'th' ? 'จำนวนเงิน' : 'Amount'}
              type="number"
              step="0.01"
              min="0"
              value={formData.amount}
              onChange={e => setFormData({ ...formData, amount: e.target.value })}
              required
            />
            <Select
              label="Cycle"
              value={formData.cycle}
              onChange={e => setFormData({ ...formData, cycle: e.target.value as 'monthly' | 'yearly' })}
              options={cycleOptions(locale).map(c => ({ value: c.value, label: c.label }))}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Select
              label="Category"
              value={formData.category}
              onChange={e => setFormData({ ...formData, category: e.target.value as FormData['category'] })}
              options={categoryOptions(locale).map(c => ({ value: c.value, label: c.label }))}
            />
            <Select
              label="Payment Method"
              value={formData.paymentMethod}
              onChange={e => setFormData({ ...formData, paymentMethod: e.target.value as FormData['paymentMethod'] })}
              options={paymentOptions.map(p => ({ value: p.value, label: p.label }))}
            />
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={resetForm} className="flex-1">
              {locale === 'th' ? 'ยกเลิก' : 'Cancel'}
            </Button>
            <Button type="submit" className="flex-1">
              {editingId ? (locale === 'th' ? 'อัปเดต' : 'Update') : (locale === 'th' ? 'เพิ่ม' : 'Add')}
            </Button>
          </div>
        </form>
      </Modal>
    </motion.div>
  );
}