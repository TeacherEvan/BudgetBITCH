// components/dashboard/panels/bills.tsx
'use client';

import { useState } from 'react';
import { Plus, Trash2, Edit, Calendar, List, ChevronLeft, ChevronRight } from 'lucide-react';
import { useBills } from '@/hooks/use-local-db';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils/currency';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import type { ExpenseCategory } from '@/lib/types/budget';
import { getThaiHolidays, getHolidaysOn, formatBuddhistEra } from '@/lib/utils/date';
import { cn } from '@/lib/utils/cn';

interface Bill {
  id: string;
  name: string;
  amount: number;
  category: ExpenseCategory;
  dueDay: number;
  isActive: boolean;
  reminderDaysBefore: number;
}

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

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

interface BillsProps {
  locale?: 'th' | 'en';
}

export function Bills({ locale = 'en' }: BillsProps) {
  const { bills, add, update, remove, loading } = useBills();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const today = new Date();
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [calYear, setCalYear] = useState(today.getFullYear());
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

    const bill: Bill = {
      ...formData,
      amount: parseFloat(formData.amount),
      dueDay: typeof formData.dueDay === 'string' ? parseInt(formData.dueDay) : formData.dueDay,
      id: editingId || crypto.randomUUID(),
    };

    if (editingId) {
      update(bill);
    } else {
      add(bill);
    }
    resetForm();
  };

  const handleEdit = (bill: Bill) => {
    setEditingId(bill.id);
    setFormData({
      name: bill.name,
      amount: bill.amount.toString(),
      category: bill.category,
      dueDay: bill.dueDay,
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
      category: 'utilities' as ExpenseCategory,
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
    value: c.value as ExpenseCategory,
    label: locale === 'th' ? c.label.th : c.label.en,
  }));

  const sortedBills = [...bills].sort((a, b) => getDaysUntilDue(a.dueDay) - getDaysUntilDue(b.dueDay));

  // ---- Calendar view helpers ----
  const firstOfMonth = new Date(calYear, calMonth, 1);
  const startWeekday = firstOfMonth.getDay(); // 0 = Sunday
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const monthHolidays = getThaiHolidays(calYear).filter(h => new Date(h.date).getMonth() === calMonth);

  const prevMonth = () => {
    if (calMonth === 0) {
      setCalMonth(11);
      setCalYear(calYear - 1);
    } else {
      setCalMonth(calMonth - 1);
    }
  };
  const nextMonth = () => {
    if (calMonth === 11) {
      setCalMonth(0);
      setCalYear(calYear + 1);
    } else {
      setCalMonth(calMonth + 1);
    }
  };

  const monthLabel = format(firstOfMonth, 'MMMM yyyy', { locale: locale === 'th' ? th : undefined });
  const beYear = formatBuddhistEra(firstOfMonth);

  // Build cells: leading blanks + day numbers.
  const cells: (number | null)[] = [
    ...Array.from({ length: startWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">📋 Bills</h3>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg overflow-hidden border border-white/10">
            <button
              onClick={() => setView('list')}
              className={cn(
                'px-2.5 py-1.5 text-sm flex items-center gap-1 transition-colors',
                view === 'list' ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white',
              )}
              aria-pressed={view === 'list'}
            >
              <List className="w-3.5 h-3.5" /> {locale === 'th' ? 'รายการ' : 'List'}
            </button>
            <button
              onClick={() => setView('calendar')}
              className={cn(
                'px-2.5 py-1.5 text-sm flex items-center gap-1 transition-colors',
                view === 'calendar' ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white',
              )}
              aria-pressed={view === 'calendar'}
            >
              <Calendar className="w-3.5 h-3.5" /> {locale === 'th' ? 'ปฏิทิน' : 'Calendar'}
            </button>
          </div>
          <Button variant="primary" size="sm" onClick={() => { setShowForm(true); setEditingId(null); resetForm(); }}>
            <Plus className="w-4 h-4 mr-1" /> {locale === 'th' ? 'เพิ่ม' : 'Add'}
          </Button>
        </div>
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
              onChange={e => setFormData({ ...formData, category: e.target.value as ExpenseCategory })}
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

      {view === 'list' ? (
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
      ) : (
        <div className="space-y-4">
          {/* Month navigation */}
          <div className="flex items-center justify-between">
            <button onClick={prevMonth} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70" aria-label="Previous month">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="text-center">
              <p className="font-medium text-white">{monthLabel}</p>
              <p className="text-xs text-amber-400/80">{locale === 'th' ? `พ.ศ. ${beYear}` : `B.E. ${beYear}`}</p>
            </div>
            <button onClick={nextMonth} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70" aria-label="Next month">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {WEEKDAYS.map(w => (
              <div key={w} className="text-[10px] uppercase text-white/40 py-1">{w}</div>
            ))}
            {cells.map((day, i) => {
              if (day === null) return <div key={`blank-${i}`} />;
              const cellDate = new Date(calYear, calMonth, day);
              const dueBills = bills.filter(b => b.dueDay === day);
              const holidays = getHolidaysOn(cellDate);
              const isToday = day === today.getDate() && calMonth === today.getMonth() && calYear === today.getFullYear();
              const hasBill = dueBills.length > 0;
              const hasHoliday = holidays.length > 0;

              return (
                <div
                  key={day}
                  className={cn(
                    'aspect-square rounded-lg p-1 flex flex-col items-center justify-start text-xs border',
                    isToday ? 'border-amber-400/60 bg-amber-400/10' : 'border-white/5 bg-black/30',
                    hasBill && 'ring-1 ring-rose-500/40',
                    hasHoliday && !hasBill && 'ring-1 ring-amber-400/40',
                  )}
                  title={[
                    dueBills.map(b => b.name).join(', '),
                    holidays.map(h => h.name).join(', '),
                  ].filter(Boolean).join(' • ') || undefined}
                >
                  <span className={cn('font-medium', isToday ? 'text-amber-400' : 'text-white/80')}>{day}</span>
                  {hasBill && (
                    <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-rose-500" title="Bill due" />
                  )}
                  {hasHoliday && (
                    <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-amber-400" title="Holiday" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-white/60">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500" /> {locale === 'th' ? 'บิลครบกำหนด' : 'Bill due'}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400" /> {locale === 'th' ? 'วันหยุด' : 'Holiday'}
            </span>
          </div>

          {/* Holiday list for the month */}
          {monthHolidays.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wider text-white/40">
                {locale === 'th' ? 'วันหยุดเดือนนี้' : 'Holidays this month'}
              </p>
              <div className="space-y-1">
                {monthHolidays.map(h => (
                  <div key={h.date} className="flex items-center justify-between text-sm px-2 py-1.5 rounded-lg bg-amber-400/5 border border-amber-400/20">
                    <span className="text-amber-300 font-medium">{locale === 'th' ? h.nameTh : h.name}</span>
                    <span className="text-white/50 font-mono">{new Date(h.date).getDate()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}// End of file
