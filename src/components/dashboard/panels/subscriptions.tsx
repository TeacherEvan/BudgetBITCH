// components/dashboard/panels/subscriptions.tsx
'use client';

import { useState } from 'react';
import { Plus, Trash2, Edit, CreditCard, Music, Tv, Gamepad2, ShoppingBag } from 'lucide-react';
import { useSubscriptions } from '@/hooks/use-local-db';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils/currency';

interface SubscriptionsProps {
  locale?: 'th' | 'en';
}

export function Subscriptions({ locale = 'en' }: SubscriptionsProps) {
  const { subscriptions, loading } = useSubscriptions();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    cycle: 'monthly',
    category: 'streaming',
    paymentMethod: 'credit_card',
  });

  const categoryOptions = [
    { value: 'streaming', label: locale === 'th' ? 'สตรีมมิง' : 'Streaming' },
    { value: 'music', label: 'Music' },
    { value: 'software', label: 'Software' },
    { value: 'gaming', label: 'Gaming' },
    { value: 'cloud', label: 'Cloud Storage' },
    { value: 'other', label: 'Other' },
  ];

  const cycleOptions = [
    { value: 'monthly', label: locale === 'th' ? 'รายเดือน' : 'Monthly' },
    { value: 'yearly', label: locale === 'th' ? 'รายปี' : 'Yearly' },
  ];

  const paymentOptions = [
    { value: 'credit_card', label: 'Credit Card' },
    { value: 'debit_card', label: 'Debit Card' },
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'wallet', label: 'Digital Wallet' },
  ];

  const resetForm = () => {
    setEditingId(null);
    setShowForm(false);
    setFormData({ name: '', amount: '', cycle: 'monthly', category: 'streaming', paymentMethod: 'credit_card' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.amount) return;
    resetForm();
  };

  const handleEdit = (sub: any) => {
    setEditingId(sub.id);
    setFormData({ name: sub.name, amount: sub.amount.toString(), cycle: sub.cycle, category: sub.category, paymentMethod: sub.paymentMethod });
    setShowForm(true);
  };

  const handleDelete = (id: string) => {};

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'streaming': return <Tv className="w-4 h-4" />;
      case 'music': return <Music className="w-4 h-4" />;
      case 'gaming': return <Gamepad2 className="w-4 h-4" />;
      case 'software': return <ShoppingBag className="w-4 h-4" />;
      default: return <CreditCard className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">📺 Subscriptions</h3>
        <Button variant="primary" size="sm" onClick={() => { setShowForm(true); setEditingId(null); }}>
          <Plus className="w-4 h-4 mr-1" /> Add
        </Button>
      </div>

      {showForm && (
        <Card className="p-4">
          <form onSubmit={handleSubmit} className="space-y-3">
            <Input label={locale === 'th' ? 'ชื่อบริการ' : 'Service Name'} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder={locale === 'th' ? 'เช่น Netflix, Spotify' : 'e.g. Netflix, Spotify'} required />
            <div className="grid gap-3 sm:grid-cols-2">
              <Input label={locale === 'th' ? 'จำนวนเงิน' : 'Amount'} type="number" step="0.01" min="0" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} required />
              <Select label="Cycle" value={formData.cycle} onChange={e => setFormData({...formData, cycle: e.target.value})} options={cycleOptions.map(c => ({value: c.value, label: c.label}))} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Select label="Category" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} options={categoryOptions.map(c => ({value: c.value, label: c.label}))} />
              <Select label="Payment Method" value={formData.paymentMethod} onChange={e => setFormData({...formData, paymentMethod: e.target.value})} options={paymentOptions.map(p => ({value: p.value, label: p.label}))} />
            </div>
            <div className="flex gap-2">
              <Button type="submit" className="flex-1">{editingId ? 'Update' : 'Add'}</Button>
              <Button type="button" variant="secondary" onClick={resetForm}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      <div className="space-y-2">
        {[{ name: 'Netflix', amount: 419, cycle: 'monthly', category: 'streaming' },
          { name: 'Spotify', amount: 129, cycle: 'monthly', category: 'music' },
          { name: 'YouTube Premium', amount: 159, cycle: 'monthly', category: 'streaming' },
          { name: 'iCloud 2TB', amount: 99, cycle: 'monthly', category: 'cloud' },
        ].map((sub, i) => (
          <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-black/30 border border-white/10">
            <div className="flex items-center gap-3">
              {getCategoryIcon(sub.category)}
              <div>
                <p className="font-medium text-white">{sub.name}</p>
                <p className="text-xs text-white/60 capitalize">{sub.cycle} · {sub.category}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-white">{formatCurrency(sub.amount, locale)}</span>
              <Button variant="ghost" size="sm" aria-label="Edit"><Edit className="w-4 h-4" /></Button>
              <Button variant="ghost" size="sm" aria-label="Delete"><Trash2 className="w-4 h-4 text-rose-400" /></Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
