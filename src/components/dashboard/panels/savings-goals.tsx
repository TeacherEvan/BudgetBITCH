// components/dashboard/panels/savings-goals.tsx
'use client';

import { useState } from 'react';
import { Plus, Trash2, Edit, Target } from 'lucide-react';
import { useSavingsGoals } from '@/hooks/use-local-db';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ProgressRing } from '@/components/ui/progress-ring';
import { formatCurrency } from '@/lib/utils/currency';
import { format } from 'date-fns';

interface SavingsGoalsProps {
  locale?: 'th' | 'en';
}

export function SavingsGoals({ locale = 'en' }: SavingsGoalsProps) {
  const { goals, add, update, remove, loading } = useSavingsGoals();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    targetAmount: '',
    currentAmount: '0',
    targetDate: '',
    category: 'emergency' as 'emergency' | 'vacation' | 'purchase' | 'investment' | 'other',
    autoAllocate: '',
  });

  const categoryOptions = [
    { value: 'emergency', label: { th: 'เงินสำรองฉุกเฉิน', en: 'Emergency Fund' } },
    { value: 'vacation', label: { th: 'วันหยุด/ท่องเที่ยว', en: 'Vacation' } },
    { value: 'purchase', label: { th: 'ซื้อของ/ทรัพย์สิน', en: 'Purchase' } },
    { value: 'investment', label: { th: 'การลงทุน', en: 'Investment' } },
    { value: 'other', label: { th: 'อื่นๆ', en: 'Other' } },
  ];

  const resetForm = () => {
    setEditingId(null);
    setShowForm(false);
    setFormData({
      name: '',
      targetAmount: '',
      currentAmount: '0',
      targetDate: '',
      category: 'emergency',
      autoAllocate: '',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.targetAmount) return;
    
    const goal = {
      ...formData,
      targetAmount: parseFloat(formData.targetAmount),
      currentAmount: parseFloat(formData.currentAmount) || 0,
      autoAllocate: formData.autoAllocate ? parseFloat(formData.autoAllocate) : undefined,
      id: editingId || crypto.randomUUID(),
    };
    
    if (editingId) {
      update(goal as any);
    } else {
      add(goal as any);
    }
    resetForm();
  };

  const handleEdit = (goal: any) => {
    setEditingId(goal.id);
    setFormData({
      name: goal.name,
      targetAmount: goal.targetAmount.toString(),
      currentAmount: goal.currentAmount.toString(),
      targetDate: goal.targetDate || '',
      category: goal.category,
      autoAllocate: goal.autoAllocate?.toString() || '',
    });
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    remove(id);
  };

  const handleAddProgress = (id: string, amount: number) => {
    const goal = goals.find(g => g.id === id);
    if (goal) {
      update({ ...goal, currentAmount: goal.currentAmount + amount });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">🎯 Savings Goals</h3>
        <Button variant="primary" size="sm" onClick={() => { setShowForm(true); setEditingId(null); resetForm(); }}>
          <Plus className="w-4 h-4 mr-1" /> Add Goal
        </Button>
      </div>

      {showForm && (
        <Card className="p-4">
          <form onSubmit={handleSubmit} className="space-y-3">
            <Input
              label={locale === 'th' ? 'ชื่อเป้าหมาย' : 'Goal Name'}
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder={locale === 'th' ? 'เช่น ท่องเที่ยวญี่ปุ่น, ซื้อรถใหม่' : 'e.g. Japan Trip, New Car'}
              required
            />
            <div className="grid gap-3 sm:grid-cols-2">
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
            </div>
            <Select
              label={locale === 'th' ? 'ประเภท' : 'Category'}
              value={formData.category}
              onChange={e => setFormData({ ...formData, category: e.target.value as any })}
              options={categoryOptions.map(c => ({ value: c.value, label: locale === 'th' ? c.label.th : c.label.en }))}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                label={locale === 'th' ? 'วันที่เป้าหมาย' : 'Target Date'}
                type="date"
                value={formData.targetDate}
                onChange={e => setFormData({ ...formData, targetDate: e.target.value })}
              />
              <Input
                label={locale === 'th' ? 'จัดสรรอัตโนมัติ/เดือน' : 'Auto Allocate/Month'}
                type="number"
                step="0.01"
                min="0"
                value={formData.autoAllocate}
                onChange={e => setFormData({ ...formData, autoAllocate: e.target.value })}
                placeholder="Optional"
              />
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

      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-8 text-white/50">Loading...</div>
        ) : goals.length === 0 ? (
          <div className="text-center py-8 text-white/50">
            {locale === 'th' ? 'ยังไม่มีเป้าหมาย ให้เพิ่มเป้าหมายแรกของคุณ!' : 'No goals yet. Add your first goal!'}
          </div>
        ) : (
          <div className="space-y-3">
            {goals.map(goal => {
              const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
              const remaining = goal.targetAmount - goal.currentAmount;
              const daysLeft = goal.targetDate ? Math.ceil((new Date(goal.targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;

              return (
                <Card key={goal.id} className="p-4">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Target className="w-5 h-5 text-amber-400" />
                        <h4 className="font-semibold text-white">{goal.name}</h4>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/70">
                          {locale === 'th' ? categoryOptions.find(c => c.value === goal.category)?.label.th : categoryOptions.find(c => c.value === goal.category)?.label.en}
                        </span>
                      </div>
                      {goal.targetDate && (
                        <p className="text-xs text-white/50 mt-1">
                          Target: {format(new Date(goal.targetDate), locale === 'th' ? 'd MMM yyyy' : 'MMM d, yyyy')}
                          {daysLeft !== null && (
                            <span className={`ml-2 ${daysLeft < 0 ? 'text-rose-400' : daysLeft <= 30 ? 'text-amber-400' : 'text-emerald-400'}`}>
                              {daysLeft < 0 ? (locale === 'th' ? 'เกินกำหนด' : 'Overdue') : `${daysLeft} days left`}
                            </span>
                          )}
                        </p>
                      )}
                    </div>
                    <ProgressRing value={Math.min(100, progress)} size={60} strokeWidth={6} color="amber" showValue />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3 text-center">
                    <div className="bg-black/30 rounded-xl p-3">
                      <p className="text-xs text-white/60">{locale === 'th' ? 'เป้าหมาย' : 'Target'}</p>
                      <p className="font-mono text-lg text-white">{formatCurrency(goal.targetAmount, locale)}</p>
                    </div>
                    <div className="bg-black/30 rounded-xl p-3">
                      <p className="text-xs text-white/60">{locale === 'th' ? 'ปัจจุบัน' : 'Current'}</p>
                      <p className="font-mono text-lg text-white">{formatCurrency(goal.currentAmount, locale)}</p>
                    </div>
                    <div className="bg-black/30 rounded-xl p-3">
                      <p className="text-xs text-white/60">{locale === 'th' ? 'เหลือ' : 'Remaining'}</p>
                      <p className="font-mono text-lg text-white">{formatCurrency(remaining, locale)}</p>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <Button 
                      size="sm" 
                      variant="primary" 
                      onClick={() => handleAddProgress(goal.id, 100)}
                      className="flex-1"
                    >
                      +{formatCurrency(100, locale)}
                    </Button>
                    <Button 
                      size="sm" 
                      variant="secondary" 
                      onClick={() => handleAddProgress(goal.id, 500)}
                      className="flex-1"
                    >
                      +{formatCurrency(500, locale)}
                    </Button>
                    <Button 
                      size="sm" 
                      variant="secondary" 
                      onClick={() => handleAddProgress(goal.id, 1000)}
                      className="flex-1"
                    >
                      +{formatCurrency(1000, locale)}
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => handleEdit(goal)}
                      className="w-10"
                      aria-label="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => handleDelete(goal.id)}
                      className="w-10"
                      aria-label="Delete"
                    >
                      <Trash2 className="w-4 h-4 text-rose-400" />
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}