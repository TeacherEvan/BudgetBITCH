// components/dashboard/panels/debt-payoff.tsx
'use client';

import { useState } from 'react';
import { Plus, Trash2, Edit, Calculator, ArrowUp, ArrowDown } from 'lucide-react';
import { useDebtPayoff } from '@/hooks/use-local-db';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils/currency';

interface DebtPayoffProps {
  locale?: 'th' | 'en';
}

type DebtType = 'credit_card' | 'personal_loan' | 'car_loan' | 'mortgage' | 'family' | 'other';
type PayoffStrategy = 'avalanche' | 'snowball';

interface Debt {
  id: string;
  name: string;
  balance: number;
  apr: number;
  minimumPayment: number;
  type: DebtType;
}

const DEBT_TYPES = [
  { value: 'credit_card', label: { th: 'บัตรเครดิต', en: 'Credit Card' } },
  { value: 'personal_loan', label: { th: 'กู้ยืมส่วนตัว', en: 'Personal Loan' } },
  { value: 'car_loan', label: { th: 'กู้รถ', en: 'Car Loan' } },
  { value: 'mortgage', label: { th: 'กู้บ้าน/คอนโด', en: 'Mortgage' } },
  { value: 'family', label: { th: 'หนี้ครอบครัว', en: 'Family Loan' } },
  { value: 'other', label: { th: 'อื่นๆ', en: 'Other' } },
];

interface DebtPayoffProps {
  locale?: 'th' | 'en';
}

export function DebtPayoff({ locale = 'en' }: DebtPayoffProps) {
  const { debts, loading, add: addDebt, update: updateDebt, remove: removeDebt } = useDebtPayoff();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [strategy, setStrategy] = useState<PayoffStrategy>('avalanche');
  const [formData, setFormData] = useState({
    name: '',
    balance: '',
    apr: '',
    minimumPayment: '',
    type: 'credit_card' as DebtType,
  });

  const DEBT_TYPES_OPTIONS = DEBT_TYPES.map(t => ({
    value: t.value,
    label: locale === 'th' ? t.label.th : t.label.en,
  }));

  const STRATEGY_OPTIONS = [
    { value: 'avalanche', label: locale === 'th' ? 'เน้นดอกเบี้ยสูงก่อน (Avalanche)' : 'Highest Interest First (Avalanche)' },
    { value: 'snowball', label: locale === 'th' ? 'เน้นยอดน้อยก่อน (Snowball)' : 'Smallest Balance First (Snowball)' },
  ];

  // Calculate payoff order based on strategy
  const sortedDebts = [...debts].sort((a, b) => {
    if (strategy === 'avalanche') {
      return b.apr - a.apr; // Highest interest first
    }
    return a.balance - b.balance; // Smallest balance first
  });

  // Calculate payoff timeline
  const totalDebt = debts.reduce((sum, d) => sum + d.balance, 0);
  const totalMonthlyPayment = debts.reduce((sum, d) => sum + d.minimumPayment, 0);
  const extraPayment = 5000; // Extra payment per month

  const resetForm = () => {
    setEditingId(null);
    setShowForm(false);
    setFormData({ name: '', balance: '', apr: '', minimumPayment: '', type: 'credit_card' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.balance || !formData.apr || !formData.minimumPayment) return;
    resetForm();
  };

  const handleEdit = (debt: any) => {
    setEditingId(debt.id);
    setFormData({ name: debt.name, balance: debt.balance.toString(), apr: debt.apr.toString(), minimumPayment: debt.minimumPayment.toString(), type: debt.type });
    setShowForm(true);
  };

  const handleDelete = (id: string) => {};

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">📉 Debt Payoff</h3>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => setStrategy('avalanche')} className={strategy === 'avalanche' ? 'bg-amber-400/20 border-amber-400/30' : ''}>
            🏔️ {locale === 'th' ? 'เน้นดอกเบี้ยสูง' : 'Avalanche'}
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setStrategy('snowball')} className={strategy === 'snowball' ? 'bg-emerald-400/20 border-emerald-400/30' : ''}>
            ⛄ {locale === 'th' ? 'เน้นยอดน้อย' : 'Snowball'}
          </Button>
          <Button variant="primary" size="sm" onClick={() => { setShowForm(true); setEditingId(null); }}>
            <Plus className="w-4 h-4 mr-1" /> Add
          </Button>
        </div>
      </div>

      <Card className="p-4 mb-4">
        <h4 className="font-semibold text-white mb-3">{locale === 'th' ? 'สรุปหนี้สิน' : 'Debt Summary'}</h4>
        <div className="grid gap-3 sm:grid-cols-4">
          <div className="bg-blue-400/10 border border-blue-400/30 rounded-xl p-4">
            <p className="text-sm text-blue-400">Total Debt</p>
            <p className="text-2xl font-bold font-mono text-white">{formatCurrency(debts.reduce((sum, d) => sum + d.balance, 0), locale)}</p>
          </div>
          <div className="bg-amber-400/10 border border-amber-400/30 rounded-xl p-4">
            <p className="text-sm text-amber-400">Monthly Minimum</p>
            <p className="text-2xl font-bold font-mono text-white">{formatCurrency(debts.reduce((sum, d) => sum + d.minimumPayment, 0), locale)}</p>
          </div>
          <div className="bg-emerald-400/10 border border-emerald-400/30 rounded-xl p-4">
            <p className="text-sm text-emerald-400">Extra Payment</p>
            <p className="text-2xl font-bold font-mono text-white">{formatCurrency(5000, locale)}</p>
          </div>
          <div className="bg-rose-400/10 border border-rose-400/30 rounded-xl p-4">
            <p className="text-sm text-rose-400">Total APR (avg)</p>
            <p className="text-2xl font-bold font-mono text-white">{debts.length > 0 ? (debts.reduce((sum, d) => sum + d.apr, 0) / debts.length).toFixed(1) : '0'}%</p>
          </div>
        </div>
      </Card>

      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-white">{locale === 'th' ? 'หนี้สินตามลำดับชำระ' : 'Debts in Payoff Order'}</h3>
        <select 
          value={strategy} 
          onChange={(e) => setStrategy(e.target.value as PayoffStrategy)}
          className="bg-black/30 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-amber-400"
        >
          {STRATEGY_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      <div className="space-y-2">
        {sortedDebts.map((debt, index) => (
          <div key={debt.id} className="flex items-center gap-3 p-3 rounded-xl bg-black/30 border border-white/10">
            <div className="w-8 h-8 rounded-full bg-amber-400/20 flex items-center justify-center text-amber-400 font-bold text-sm">
              {index + 1}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-white">{debt.name}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/70 capitalize">{debt.type.replace('_', ' ')}</span>
              </div>
              <p className="text-xs text-white/50 mt-0.5">
                {formatCurrency(debt.balance, locale)} · {debt.apr}% APR · Min: {formatCurrency(debt.minimumPayment, locale)}/mo
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-white">{formatCurrency(debt.balance, locale)}</span>
              <Button variant="ghost" size="sm" onClick={() => handleEdit(debt)} aria-label="Edit">
                <Edit className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => handleDelete(debt.id)} aria-label="Delete">
                <Trash2 className="w-4 h-4 text-rose-400" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
          <div className="bg-black/95 border border-white/10 rounded-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-white mb-4">{locale === 'th' ? 'เพิ่มหนี้สิน' : 'Add Debt'}</h3>
            <form onSubmit={(e) => { e.preventDefault(); setShowForm(false); }} className="space-y-3">
              <Input label={locale === 'th' ? 'ชื่อหนี้' : 'Debt Name'} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder={locale === 'th' ? 'เช่น บัตรเครดิตธนาคาร, กู้รถ' : 'e.g. Bank Credit Card, Car Loan'} required />
              <div className="grid gap-3 sm:grid-cols-2">
                <Input label={locale === 'th' ? 'ยอดคงเหลือ' : 'Balance'} type="number" step="0.01" min="0" value={formData.balance} onChange={e => setFormData({...formData, balance: e.target.value})} required />
                <Input label="APR %" type="number" step="0.01" min="0" max="100" value={formData.apr} onChange={e => setFormData({...formData, apr: e.target.value})} required />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Input label={locale === 'th' ? 'ชำระขั้นต่ำ/เดือน' : 'Min Payment/Month'} type="number" step="0.01" min="0" value={formData.minimumPayment} onChange={e => setFormData({...formData, minimumPayment: e.target.value})} required />
                <Select label={locale === 'th' ? 'ประเภทหนี้' : 'Debt Type'} value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as any})} options={DEBT_TYPES_OPTIONS} />
              </div>
              <div className="flex gap-2">
                <Button type="button" onClick={resetForm} variant="secondary">{locale === 'th' ? 'ยกเลิก' : 'Cancel'}</Button>
                <Button type="submit" className="flex-1">{editingId ? 'Update' : 'Add'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}