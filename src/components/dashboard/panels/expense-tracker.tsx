// components/dashboard/panels/expense-tracker.tsx
'use client';

import { useState, useMemo } from 'react';
import { Plus, Trash2, Edit, FileSpreadsheet } from 'lucide-react';
import { useExpenses, useBudgets } from '@/hooks/use-local-db';
import { addExpense, generateId } from '@/lib/db/local-db';
import type { ExpenseEntry } from '@/lib/types/budget';
import type { ParsedExpense } from '@/modules/budgeting/csv-import';
import { ImportCsvModal } from './import-csv-modal';
import { PurchaseNoteModal } from './purchase-note-modal';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useCurrency } from '@/hooks/use-currency';
import { usePurchaseNotes } from '@/hooks/use-purchase-notes';
import type { ExpenseCategory } from '@/lib/types/budget';

interface Expense {
  id: string;
  merchant: string;
  amount: number;
  category: ExpenseCategory;
  date: string;
  note?: string;
  source: 'manual' | 'voice' | 'import' | 'receipt';
}

const CATEGORIES: { value: ExpenseCategory; label: { en: string } }[] = [
  { value: 'housing', label: { en: 'Housing' } },
  { value: 'transport', label: { en: 'Transport' } },
  { value: 'food', label: { en: 'Food' } },
  { value: 'utilities', label: { en: 'Utilities' } },
  { value: 'phone_internet', label: { en: 'Phone/Internet' } },
  { value: 'subscriptions', label: { en: 'Subscriptions' } },
  { value: 'entertainment', label: { en: 'Entertainment' } },
  { value: 'healthcare', label: { en: 'Healthcare' } },
  { value: 'insurance', label: { en: 'Insurance' } },
  { value: 'debt', label: { en: 'Debt' } },
  { value: 'savings', label: { en: 'Savings' } },
  { value: 'other', label: { en: 'Other' } },
];

interface ExpenseTrackerProps {
  locale?: string;
}

interface FormData {
  merchant: string;
  amount: string;
  category: ExpenseCategory;
  date: string;
  note: string;
  source: 'manual' | 'voice' | 'import' | 'receipt';
}

export function ExpenseTracker({ locale = 'en' }: ExpenseTrackerProps) {
  const formatCurrency = useCurrency();

  const { expenses, add, update, remove, loading } = useExpenses();
  const { budgets } = useBudgets();
  const { boardId, notes, setNote } = usePurchaseNotes();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [noteExpenseId, setNoteExpenseId] = useState<string | null>(null);
  
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
    label: c.label.en,
  }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <span className="text-xl">💸</span>
          {'Expense Tracker'}
        </h3>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowImport(true)}
            className="flex items-center gap-1"
            data-testid="import-csv-btn"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span className="hidden @xs:inline">{'Import'}</span>
          </Button>
          <Button variant="primary" size="sm" onClick={() => { setEditingId(null); resetForm(); setShowForm(true); }} className="flex items-center">
            <Plus className="w-4 h-4 @xs:mr-1" />
            <span className="hidden @xs:inline">{'Add'}</span>
          </Button>
        </div>
      </div>

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
                label={'Merchant'}
                value={formData.merchant}
                onChange={e => setFormData({ ...formData, merchant: e.target.value })}
                placeholder={'e.g. Grab, Walmart'}
                required
              />
              <Input
                label={'Amount'}
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={e => setFormData({ ...formData, amount: e.target.value })}
                required
              />
            </div>
            <Select
              label={'Category'}
              value={formData.category}
              onChange={e => setFormData({ ...formData, category: e.target.value as ExpenseCategory })}
              options={categoryOptions}
            />
            <Input
              label={'Date'}
              type="date"
              value={formData.date}
              onChange={e => setFormData({ ...formData, date: e.target.value })}
            />
            <Input
              label={'Note'}
              value={formData.note}
              onChange={e => setFormData({ ...formData, note: e.target.value })}
              placeholder={'Optional note...'}
            />
            <div className="flex gap-2">
              <Button type="submit" className="flex-1">
                {editingId ? ('Update') : ('Add')}
              </Button>
              <Button type="button" variant="secondary" onClick={resetForm}>
                {'Cancel'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      <div className="space-y-2">
        {loading ? (
          <div className="text-center py-8 text-white/50">
            {'Loading...'}
          </div>
        ) : expenses.length === 0 ? (
          <div className="text-center py-8 text-white/50">
            {'No expenses yet. Add your first expense!'}
          </div>
        ) : (
          <div className="space-y-2">
            {expenses
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map(expense => {
                const budget = categoryBudgets.get(expense.category);
                const spent = categorySpending.get(expense.category) || 0;
                const cat = CATEGORIES.find(c => c.value === expense.category);
                const catLabel = cat?.label.en;
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
                          {'Over Budget'}
                        </span>}
                        {boardId && (
                          <button
                            type="button"
                            onClick={() => setNoteExpenseId(expense.id)}
                            aria-label={'Shared note'}
                            className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${
                              notes[expense.id]
                                ? 'bg-amber-400/20 text-amber-400 border-amber-400/30'
                                : 'bg-white/10 text-white/70 border-white/10 hover:border-[rgba(201,150,12,0.4)]'
                            }`}
                          >
                            📝 {notes[expense.id] ? '✓' : ''}
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-white/50 mt-0.5 truncate">
                        {new Date(expense.date).toLocaleDateString('en-US')} • {formatCurrency(expense.amount, locale)}
                        {expense.note && ` • ${expense.note}`}
                        {notes[expense.id] && ` • 📝 ${notes[expense.id].note}`}
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

      <PurchaseNoteModal
        isOpen={noteExpenseId !== null}
        onClose={() => setNoteExpenseId(null)}
        locale={locale}
        merchant={expenses.find((e) => e.id === noteExpenseId)?.merchant ?? ''}
        initialNote={noteExpenseId ? notes[noteExpenseId]?.note ?? '' : ''}
        onSave={(note) => {
          if (noteExpenseId) return setNote(noteExpenseId, note);
        }}
      />
    </div>
  );
}