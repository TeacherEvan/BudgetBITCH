// components/dashboard/panels/expense-tracker.tsx
'use client';

import { useState } from 'react';
import { Plus, Trash2, Edit, Mic } from 'lucide-react';
import { useExpenses, useBudgets } from '@/hooks/use-local-db';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { THAI_CATEGORY_ALIASES } from '@/lib/utils/thai-category-mapper';
import { formatCurrency } from '@/lib/utils/currency';
import type { ExpenseCategory } from '@/lib/types/budget';

const CATEGORIES: { value: ExpenseCategory; label: { th: string; en: string } }[] = [
  { value: 'housing', label: { th: 'ที่อยู่อาศัย', en: 'Housing' } },
  { value: 'transport', label: { th: 'การเดินทาง', en: 'Transport' } },
  { value: 'food', label: { th: 'อาหาร', en: 'Food' } },
  { value: 'utilities', label: { th: 'ค่าสาธารณูปโภค', en: 'Utilities' } },
  { value: 'phone_internet', label: { th: 'โทรศัพท์/อินเตอร์เน็ต', en: 'Phone/Internet' } },
  { value: 'subscriptions', label: { th: 'สมัครสมาชิก', en: 'Subscriptions' } },
  { value: 'entertainment', label: { th: 'บันเทิง', en: 'Entertainment' } },
  { value: 'healthcare', label: { th: 'สุขภาพ', en: 'Healthcare' } },
  { value: 'insurance', label: { th: 'ประกันภัย', en: 'Insurance' } },
  { value: 'debt', label: { th: 'หนี้สิน', en: 'Debt' } },
  { value: 'savings', label: { th: 'เงินออม', en: 'Savings' } },
  { value: 'other', label: { th: 'อื่นๆ', en: 'Other' } },
];

interface ExpenseTrackerProps {
  locale?: 'th' | 'en';
}

export function ExpenseTracker({ locale = 'en' }: ExpenseTrackerProps) {
  const { expenses, add, update, remove, loading } = useExpenses();
  const { budgets } = useBudgets();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    merchant: '',
    amount: '',
    category: 'food' as ExpenseCategory,
    date: new Date().toISOString().split('T')[0],
    note: '',
  });

  const categoryBudgets = new Map(budgets.map(b => [b.category, b.monthlyLimit]));
  const categorySpending = new Map<ExpenseCategory, number>();
  expenses.forEach(e => {
    if (e.amount > 0) {
      categorySpending.set(e.category, (categorySpending.get(e.category) || 0) + e.amount);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.merchant || !formData.amount) return;
    
    const expense = {
      ...formData,
      amount: parseFloat(formData.amount),
      id: editingId || crypto.randomUUID(),
    };
    
    if (editingId) {
      update(expense as any);
    } else {
      add(expense as any);
    }
    resetForm();
  };

  const handleEdit = (expense: any) => {
    setEditingId(expense.id);
    setFormData({
      merchant: expense.merchant,
      amount: expense.amount.toString(),
      category: expense.category,
      date: expense.date,
      note: expense.note || '',
    });
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    remove(id);
  };

  const resetForm = () => {
    setEditingId(null);
    setShowForm(false);
    setFormData({
      merchant: '',
      amount: '',
      category: 'food',
      date: new Date().toISOString().split('T')[0],
      note: '',
    });
  };

  const categoryOptions = CATEGORIES.map(c => ({
    value: c.value,
    label: locale === 'th' ? c.label.th : c.label.en,
  }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">
          💸 Expense Tracker
        </h3>
        <Button variant="primary" size="sm" onClick={() => { setShowForm(true); setEditingId(null); resetForm(); }}>
          <Plus className="w-4 h-4 mr-1" /> Add
        </Button>
      </div>

      {showForm && (
        <Card className="p-4">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                label={locale === 'th' ? 'รายการ' : 'Merchant'}
                value={formData.merchant}
                onChange={e => setFormData({ ...formData, merchant: e.target.value })}
                placeholder={locale === 'th' ? 'เช่น 7-Eleven, Grab, Lotus' : 'e.g. 7-Eleven, Grab, Walmart'}
                required
              />
              <Input
                label={locale === 'th' ? 'จำนวนเงิน' : 'Amount'}
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={e => setFormData({ ...formData, amount: e.target.value })}
                required
              />
            </div>
            <Select
              label={locale === 'th' ? 'หมวดหมู่' : 'Category'}
              value={formData.category}
              onChange={e => setFormData({ ...formData, category: e.target.value as any })}
              options={categoryOptions}
            />
            <Input
              label={locale === 'th' ? 'วันที่' : 'Date'}
              type="date"
              value={formData.date}
              onChange={e => setFormData({ ...formData, date: e.target.value })}
            />
            <Input
              label={locale === 'th' ? 'หมายเหตุ' : 'Note'}
              value={formData.note}
              onChange={e => setFormData({ ...formData, note: e.target.value })}
              placeholder={locale === 'th' ? 'บันทึกเพิ่มเติม...' : 'Optional note...'}
            />
            <div className="flex gap-2">
              <Button type="submit" className="flex-1">
                {editingId ? 'Update' : 'Add'}
              </Button>
              <Button type="button" variant="secondary" onClick={resetForm}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      <div className="space-y-2">
        {loading ? (
          <div className="text-center py-8 text-white/50">Loading...</div>
        ) : expenses.length === 0 ? (
          <div className="text-center py-8 text-white/50">
            No expenses yet. Add your first expense!
          </div>
        ) : (
          <div className="space-y-2">
            {expenses
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map(expense => {
                const budget = categoryBudgets.get(expense.category);
                const spent = categorySpending.get(expense.category) || 0;
                const pct = budget ? (spent / budget) * 100 : 0;
                const cat = CATEGORIES.find(c => c.value === expense.category);
                const catLabel = locale === 'th' ? cat?.label.th : cat?.label.en;
                const overBudget = budget && spent > budget;

                return (
                  <div
                    key={expense.id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-black/30 border border-white/10"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white">{expense.merchant}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/70">
                          {catLabel || expense.category}
                        </span>
                        {overBudget && <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400">Over Budget</span>}
                      </div>
                      <p className="text-xs text-white/50 mt-0.5">
                        {format(new Date(expense.date), 'MMM d, yyyy')} • {formatCurrency(expense.amount, locale)}
                        {expense.note && ` • ${expense.note}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`font-mono text-white ${overBudget ? 'text-rose-400' : ''}`}>
                        {formatCurrency(expense.amount, locale)}
                      </span>
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(expense)} aria-label="Edit">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(expense.id)} aria-label="Delete">
                        <Trash2 className="w-4 h-4 text-rose-400" />
                      </Button>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
}

import { format } from 'date-fns';