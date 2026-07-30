'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useIncomes, useWizardProfile } from '@/hooks/use-local-db';
import { useCurrency } from '@/hooks/use-currency';
import type { IncomeCategory, IncomeFrequency } from '@/lib/types/budget';
import { Plus } from 'lucide-react';

interface AddIncomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  locale: string;
}

const CATEGORIES: { value: IncomeCategory; labelEn: string; icon: string }[] = [
  { value: 'salary', labelEn: 'Salary', icon: '💵' },
  { value: 'freelance', labelEn: 'Freelance', icon: '💻' },
  { value: 'business', labelEn: 'Business', icon: '🏢' },
  { value: 'investments', labelEn: 'Investments', icon: '📈' },
  { value: 'gift', labelEn: 'Gift', icon: '🎁' },
  { value: 'refund', labelEn: 'Refund', icon: '🔄' },
  { value: 'other', labelEn: 'Other', icon: '✨' },
];

const FREQUENCIES: { value: IncomeFrequency; labelEn: string; }[] = [
  { value: 'one_time', labelEn: 'One-Time' },
  { value: 'weekly', labelEn: 'Weekly' },
  { value: 'biweekly', labelEn: 'Bi-Weekly' },
  { value: 'monthly', labelEn: 'Monthly' },
  { value: 'yearly', labelEn: 'Yearly' },
];

export function AddIncomeModal({ isOpen, onClose, locale }: AddIncomeModalProps) {
  const { add: addIncome } = useIncomes();
  const { profile, save: saveProfile } = useWizardProfile();
  const formatCurrency = useCurrency();

  // Form states
  const [amount, setAmount] = useState('');
  const [source, setSource] = useState('');
  const [category, setCategory] = useState<IncomeCategory>('salary');
  const [frequency, setFrequency] = useState<IncomeFrequency>('monthly');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [taxDeducted, setTaxDeducted] = useState('');
  const [note, setNote] = useState('');
  const [updateBaseline, setUpdateBaseline] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;

    try {
      setLoading(true);
      const parsedTax = parseFloat(taxDeducted) || undefined;

      await addIncome({
        amount: parsedAmount,
        source: source.trim() || ('Income'),
        category,
        frequency,
        date,
        taxDeducted: parsedTax,
        note: note.trim() || undefined,
        entrySource: 'manual',
      });

      // Update monthly baseline in Wizard profile if selected
      if (updateBaseline && profile) {
        let monthlyAmount = parsedAmount;
        if (frequency === 'weekly') {
          monthlyAmount = parsedAmount * 4.33;
        } else if (frequency === 'biweekly') {
          monthlyAmount = parsedAmount * 2.16;
        } else if (frequency === 'yearly') {
          monthlyAmount = parsedAmount / 12;
        } else if (frequency === 'one_time') {
          monthlyAmount = 0; // One-time does not increase base recurring income
        }

        if (monthlyAmount > 0) {
          const currentIncome = profile.answers?.income || 0;
          await saveProfile({
            ...profile,
            answers: {
              ...profile.answers,
              income: currentIncome + Math.round(monthlyAmount),
            },
          });
        }
      }

      // Reset
      setAmount('');
      setSource('');
      setCategory('salary');
      setFrequency('monthly');
      setDate(new Date().toISOString().split('T')[0]);
      setTaxDeducted('');
      setNote('');
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={'Add Income'}
      description={'Log your cash inflow with all details'}
      size="md"
      showCloseButton={true}
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        {/* Amount input */}
        <div className="space-y-1.5">
          <label htmlFor="income-amount-input" className="text-xs font-semibold text-emerald-400 uppercase tracking-wider block">
            {'Amount'}
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lg font-bold text-white/50">
              {formatCurrency(0, locale).replace(/[0,\s.]/g, '')}
            </span>
            <Input
              id="income-amount-input"
              type="number"
              step="any"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="pl-10 text-xl font-bold bg-[#0d0d14]/70 border-emerald-950 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 text-white rounded-xl placeholder:text-white/20"
            />
          </div>
        </div>

        {/* Source / Description */}
        <div className="space-y-1.5">
          <label htmlFor="income-source-input" className="text-xs font-semibold text-white/70 uppercase tracking-wider block">
            {'Source / Payer'}
          </label>
          <Input
            id="income-source-input"
            type="text"
            required
            value={source}
            onChange={(e) => setSource(e.target.value)}
            placeholder={'e.g. Monthly Salary, Freelance project'}
            className="bg-[#0d0d14]/70 border-zinc-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 rounded-xl placeholder:text-white/20"
          />
        </div>

        {/* Category Pick grid */}
        <div className="space-y-1.5">
          <label id="income-category-label" className="text-xs font-semibold text-white/70 uppercase tracking-wider block">
            {'Category'}
          </label>
          <div role="group" aria-labelledby="income-category-label" className="grid grid-cols-4 gap-1.5">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => setCategory(cat.value)}
                aria-pressed={category === cat.value}
                className={`py-2 px-1 text-center rounded-xl border transition text-xs flex flex-col items-center gap-1 font-medium ${
                  category === cat.value
                    ? 'bg-emerald-950/40 border-emerald-500 text-white shadow-lg shadow-emerald-950/20'
                    : 'bg-zinc-900/30 border-zinc-800/80 text-white/60 hover:bg-zinc-900/50 hover:text-white'
                }`}
              >
                <span className="text-lg">{cat.icon}</span>
                <span className="truncate max-w-full text-[10px]">
                  {cat.labelEn}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Frequency & Date */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="income-frequency-select" className="text-xs font-semibold text-white/70 uppercase tracking-wider block">
              {'Frequency'}
            </label>
            <select
              id="income-frequency-select"
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as IncomeFrequency)}
              className="w-full px-3 py-2 bg-[#0d0d14]/70 border border-zinc-800 rounded-xl text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 text-white outline-none"
            >
              {FREQUENCIES.map((f) => (
                <option key={f.value} value={f.value} className="bg-[#0d0d14]">
                  {f.labelEn}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="income-date-input" className="text-xs font-semibold text-white/70 uppercase tracking-wider block">
              {'Date Received'}
            </label>
            <Input
              id="income-date-input"
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-[#0d0d14]/70 border-zinc-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 rounded-xl"
            />
          </div>
        </div>

        {/* Tax Deducted & Notes */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-white/50 uppercase tracking-wider block">
              {'Tax Deducted (Optional)'}
            </label>
            <Input
              type="number"
              step="any"
              value={taxDeducted}
              onChange={(e) => setTaxDeducted(e.target.value)}
              placeholder="0.00"
              className="bg-[#0d0d14]/70 border-zinc-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 rounded-xl placeholder:text-white/20"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-white/50 uppercase tracking-wider block">
              {'Note (Optional)'}
            </label>
            <Input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={'e.g. Quarter bonus'}
              className="bg-[#0d0d14]/70 border-zinc-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 rounded-xl placeholder:text-white/20"
            />
          </div>
        </div>

        {/* Update Baseline Checkbox */}
        {frequency !== 'one_time' && (
          <label className="flex items-center gap-2.5 py-1 text-xs text-white/70 select-none cursor-pointer">
            <input
              type="checkbox"
              checked={updateBaseline}
              onChange={(e) => setUpdateBaseline(e.target.checked)}
              className="w-4 h-4 border border-zinc-800 bg-[#0d0d14] accent-emerald-500 rounded cursor-pointer"
            />
            <span>
              {'Add to base monthly profile income estimate'}
            </span>
          </label>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-3">
          <Button
            type="button"
            variant="secondary"
            className="flex-1 border-zinc-850 hover:bg-white/5 rounded-xl py-2"
            onClick={onClose}
          >
            {'Cancel'}
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-black font-semibold rounded-xl py-2 shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-1.5"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-black border-t-transparent animate-spin rounded-full" />
            ) : (
              <>
                <Plus className="w-4 h-4" />
                {'Save Income'}
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
