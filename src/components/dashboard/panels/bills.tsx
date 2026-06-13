// components/dashboard/panels/bills.tsx
'use client';

import { useState } from 'react';
import { Plus, Trash2, Edit, Calendar } from 'lucide-react';
import { useBills } from '@/hooks/use-local-db';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils/currency';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import type { ExpenseCategory } from '@/lib/types/budget';

const CATEGORIES = [
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

interface BillsProps {
  locale?: 'th' | 'en';
}

export function Bills({ locale = 'en' }: BillsProps) {
  const { bills, add, update, remove, loading } = useBills();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    category: 'utilities' as ExpenseCategory,
    dueDay: 1,
    isActive: true,
    reminderDaysBefore: 3,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.amount) return;
    
    const bill = {
      ...formData,
      amount: parseFloat(formData.amount),
      dueDay: parseInt(formData.dueDay as any),
      id: editingId || crypto.randomUUID(),
    };
    
    if (editingId) {
      update(bill as any);
    } else {
      add(bill as any);
    }
    resetForm();
  };

  const handleEdit = (bill: any) => {
    setEditingId(bill.id);
    setFormData({
      name: bill.name,
      amount: bill.amount.toString(),
      category: bill.category,
      dueDay: bill.dueDay.toString(),
      isActive: bill.isActive,
      reminderDaysBefore: bill.reminderDaysBefore,
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
      name: '',
      amount: '',
      category: 'utilities',
      dueDay: 1,
      isActive: true,
      reminderDaysBefore: 3,
    });
  };

  const getDaysUntilDue = (dueDay: number) => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const dueDate = new Date(currentYear, currentMonth, dueDay);
    if (dueDate < today) {
      dueDate.setMonth(currentMonth + 1);
    }
    const diffTime = dueDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const categoryOptions = CATEGORIES.map(c => ({
    value: c.value,
    label: locale === 'th' ? c.label.th : c.label.en,
  }));

  const sortedBills = [...bills].sort((a, b) => getDaysUntilDue(a.dueDay) - getDaysUntilDue(b.dueDay));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">📋 Bills</h3>
        <Button variant="primary" size="sm" onClick={() => { setShowForm(true); setEditingId(null); resetForm(); }}>
          <Plus className="w-4 h-4 mr-1" /> Add Bill
        </Button>
      </div>

      {showForm && (
        <Card className="p-4">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                label={locale === 'th' ? 'ชื่อบิล' : 'Bill Name'}
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder={locale === 'th' ? 'เช่น ค่าไฟ, ค่าน้ำ, ค่าเน็ต' : 'e.g. Electric, Water, Internet'}
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
            <div className="grid gap-3 sm:grid-cols-3">
              <Input
                label={locale === 'th' ? 'วันครบกำหนด (1-31)' : 'Due Day (1-31)'}
                type="number"
                min="1"
                max="31"
                value={formData.dueDay}
                onChange={e => setFormData({ ...formData, dueDay: parseInt(e.target.value) || 1 })}
              />
              <Input
                label={locale === 'th' ? 'เตือนล่วงหน้า (วัน)' : 'Remind Before (days)'}
                type="number"
                min="0"
                max="30"
                value={formData.reminderDaysBefore}
                onChange={e => setFormData({ ...formData, reminderDaysBefore: parseInt(e.target.value) || 3 })}
              />
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 rounded border-white/30 bg-black/30 text-amber-400 focus:ring-amber-400"
                />
                <label htmlFor="isActive" className="text-sm text-white/80">
                  {locale === 'th' ? 'เปิดใช้งาน' : 'Active'}
                </label>
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit" className="flex-1">
                {editingId ? (locale === 'th' ? 'อัปเดต' : 'Update') : (locale === 'th' ? 'เพิ่ม' : 'Add')}
              </Button>
              <Button type="button" variant="secondary" onClick={resetForm}>
                {locale === 'th' ? 'ยกเลิก' : 'Cancel'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      <div className="space-y-2">
        {loading ? (
          <div className="text-center py-8 text-white/50">Loading...</div>
        ) : bills.length === 0 ? (
          <div className="text-center py-8 text-white/50">
            {locale === 'th' ? 'ยังไม่มีบิล ให้เพิ่มบิลแรกของคุณ!' : 'No bills yet. Add your first bill!'}
          </div>
        ) : (
          <div className="space-y-2">
            {sortedBills.map(bill => {
              const daysUntil = getDaysUntilDue(bill.dueDay);
              const isOverdue = daysUntil < 0;
              const isDueSoon = daysUntil <= 3 && daysUntil >= 0;
              
              return (
                <div key={bill.id} className="flex items-center gap-3 p-3 rounded-xl bg-black/30 border border-white/10">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white">{bill.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        isOverdue ? 'bg-rose-500/20 text-rose-400' :
                        isDueSoon ? 'bg-amber-400/20 text-amber-400' :
                        'bg-white/10 text-white/70'
                      }`}>
                        {isOverdue 
                          ? (locale === 'th' ? 'เกินกำหนด' : 'Overdue')
                          : isDueSoon 
                            ? (locale === 'th' ? `เหลือ ${daysUntil} วัน` : `${daysUntil} days left`)
                            : (locale === 'th' ? `เหลือ ${daysUntil} วัน` : `${daysUntil} days`)}
                      </span>
                    </div>
                    <p className="text-xs text-white/50 mt-0.5">
                      {formatCurrency(bill.amount, locale)} • Due: {bill.dueDay} {locale === 'th' ? 'ของทุกเดือน' : 'monthly'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-white">
                      {formatCurrency(bill.amount, locale)}
                    </span>
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(bill)} aria-label="Edit">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(bill.id)} aria-label="Delete">
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

const categoryOptions = CATEGORIES.map(c => ({
  value: c.value,
  label: c.label,
}));