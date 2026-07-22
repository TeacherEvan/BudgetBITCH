// components/dashboard/panels/expense-tracker.tsx
'use client';

import { useState, useMemo } from 'react';
import { Plus, Trash2, Edit, Mic, FileSpreadsheet } from 'lucide-react';
import { useExpenses, useBudgets } from '@/hooks/use-local-db';
import { addExpense, generateId } from '@/lib/db/local-db';
import type { ExpenseEntry } from '@/lib/types/budget';
import type { ParsedExpense } from '@/modules/budgeting/csv-import';
import { ImportCsvModal } from './import-csv-modal';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useCurrency } from '@/hooks/use-currency';
import type { ExpenseCategory } from '@/lib/types/budget';
import { VoiceExpenseInput } from './voice-expense-input';

interface Expense {
  id: string;
  merchant: string;
  amount: number;
  category: ExpenseCategory;
  date: string;
  note?: string;
  source: 'manual' | 'voice' | 'import';
}

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

interface FormData {
  merchant: string;
  amount: string;
  category: ExpenseCategory;
  date: string;
  note: string;
  source: 'manual' | 'voice' | 'import';
}

export function ExpenseTracker({ locale = 'en' }: ExpenseTrackerProps) {
  const formatCurrency = useCurrency();

  const { expenses, add, update, remove, loading } = useExpenses();
  const { budgets } = useBudgets();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showVoiceInput, setShowVoiceInput] = useState(false);
  const [showImport, setShowImport] = useState(false);
  
  const [formData, setFormData] = useState<FormData>({
    merchant: '',
    amount: '',
    category: 'food' as ExpenseCategory,
    date: new Date().toISOString().split('T')[0],
    note: '',
    source: 'manual' as const,
  });

  const categoryBudgets = useMemo(
    () => new Map(budgets.map(b => [b.category, b.monthlyLimit])),
    [budgets]
  );

  const categorySpending = useMemo(() => {
    const map = new Map<ExpenseCategory, number>();
    for (let i = 0; i < expenses.length; i++) {
      const e = expenses[i];
      if (e.amount > 0) {
        map.set(e.category, (map.get(e.category) || 0) + e.amount);
      }
    }
    return map;
  }, [expenses]);

  const handleVoiceAdd = (expense: { merchant: string; amount: number; category: ExpenseCategory; note?: string }) => {
    add({
      ...expense,
      date: new Date().toISOString().split('T')[0],
      source: 'voice',
    });
  };

  const handleImportRows = async (rows: ParsedExpense[]) => {
    // Persist each parsed row as an ExpenseEntry with a generated id.
    await Promise.all(
      rows.map((row) =>
        addExpense({
          id: generateId(),
          date: row.date,
          category: row.category,
          merchant: row.merchant,
          amount: row.amount,
          note: row.note,
          source: 'import',
        } as ExpenseEntry),
      ),
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.merchant || !formData.amount) return;
    
    if (editingId) {
      update({
        ...formData,
        amount: parseFloat(formData.amount),
        id: editingId,
      });
    } else {
      add({
        ...formData,
        amount: parseFloat(formData.amount),
        source: formData.source,
      });
    }
    resetForm();
  };

  const handleEdit = (expense: Expense) => {
    setEditingId(expense.id);
    setFormData({
      merchant: expense.merchant,
      amount: expense.amount.toString(),
      category: expense.category,
      date: expense.date,
      note: expense.note || '',
      source: expense.source,
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
      category: 'food' as ExpenseCategory,
      date: new Date().toISOString().split('T')[0],
      note: '',
      source: 'manual' as const,
    });
  };

  const categoryOptions = CATEGORIES.map(c => ({
    value: c.value,
    label: locale === 'th' ? c.label.th : c.label.en,
  }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <span className="text-xl">💸</span>
          {locale === 'th' ? 'บันทึกค่าใช้จ่าย' : 'Expense Tracker'}
        </h3>
        <div className="flex gap-2">
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={() => setShowVoiceInput(true)}
            className="flex items-center gap-1"
          >
            <Mic className="w-4 h-4" />
            <span className="hidden @xs:inline">{locale === 'th' ? 'เสียง' : 'Voice'}</span>
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowImport(true)}
            className="flex items-center gap-1"
            data-testid="import-csv-btn"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span className="hidden @xs:inline">{locale === 'th' ? 'นำเข้า' : 'Import'}</span>
          </Button>
          <Button variant="primary" size="sm" onClick={() => { setEditingId(null); resetForm(); setShowForm(true); }} className="flex items-center">
            <Plus className="w-4 h-4 @xs:mr-1" />
            <span className="hidden @xs:inline">{locale === 'th' ? 'เพิ่ม' : 'Add'}</span>
          </Button>
        </div>
      </div>

      {/* Voice Input Modal */}
      <VoiceExpenseInput
        locale={locale}
        onAddExpense={handleVoiceAdd}
        isOpen={showVoiceInput}
        onClose={() => setShowVoiceInput(false)}
      />

      {/* CSV Import Modal */}
      <ImportCsvModal
        locale={locale}
        isOpen={showImport}
        onClose={() => setShowImport(false)}
        onImport={handleImportRows}
      />

      {showForm && (
        <Card className="p-4">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                label={locale === 'th' ? 'รายการ' : 'Merchant'}
                value={formData.merchant}
                onChange={e => setFormData({ ...formData, merchant: e.target.value })}
                placeholder={locale === 'th' ? 'เช่น Grab, Lotus' : 'e.g. Grab, Walmart'}
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
              onChange={e => setFormData({ ...formData, category: e.target.value as ExpenseCategory })}
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
          <div className="text-center py-8 text-white/50">
            {locale === 'th' ? 'กำลังโหลด...' : 'Loading...'}
          </div>
        ) : expenses.length === 0 ? (
          <div className="text-center py-8 text-white/50">
            {locale === 'th' ? 'ยังไม่มีค่าใช้จ่าย เพิ่มรายการแรกได้เลย!' : 'No expenses yet. Add your first expense!'}
          </div>
        ) : (
          <div className="space-y-2">
            {expenses
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map(expense => {
                const budget = categoryBudgets.get(expense.category);
                const spent = categorySpending.get(expense.category) || 0;
                const cat = CATEGORIES.find(c => c.value === expense.category);
                const catLabel = locale === 'th' ? cat?.label.th : cat?.label.en;
                const overBudget = budget && spent > budget;
                
                const sourceIcon = expense.source === 'voice' ? '🎤' : 
                                  expense.source === 'import' ? '📥' : '✏️';

                return (
                  <div
                    key={expense.id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-black/30 border border-white/10"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-white truncate">{expense.merchant}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/70">
                          {catLabel || expense.category}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-400">
                          {sourceIcon}
                        </span>
                        {overBudget && <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400">
                          {locale === 'th' ? 'เกินงบ' : 'Over Budget'}
                        </span>}
                      </div>
                      <p className="text-xs text-white/50 mt-0.5 truncate">
                        {new Date(expense.date).toLocaleDateString(locale === 'th' ? 'th-TH' : 'en-US')} • {formatCurrency(expense.amount, locale)}
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