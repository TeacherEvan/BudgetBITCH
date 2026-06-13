// components/dashboard/critical-expenses-modal.tsx
'use client';

import { useState, useMemo } from 'react';
import { X, AlertCircle, Target, TrendingUp, Calculator } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { ProgressRing } from '@/components/ui/progress-ring';
import { Card } from '@/components/ui/card';
import { CRITICAL_EXPENSES, CriticalExpenseKey } from '@/lib/types/budget';
import { calculateCompoundProjection, formatCurrency, getSuggestedCriticalExpenseCost } from '@/lib/utils/compound-calculator';
import { useCriticalExpense } from '@/hooks/use-critical-expense';
import { useWizardProfile } from '@/hooks/use-local-db';

interface CriticalExpensesModalProps {
  isOpen: boolean;
  onClose: () => void;
  locale: 'th' | 'en';
}

export function CriticalExpensesModal({ isOpen, onClose, locale }: CriticalExpensesModalProps) {
  const { profile } = useWizardProfile();
  const { commitment, loading: commitmentLoading, save: saveCommitment } = useCriticalExpense();
  const [selectedExpense, setSelectedExpense] = useState<CriticalExpenseKey | null>(null);
  const [customAmount, setCustomAmount] = useState<string>('');

  const expenseList = Object.entries(CRITICAL_EXPENSES) as [CriticalExpenseKey, typeof CRITICAL_EXPENSES[CriticalExpenseKey]][];
  
  const suggestedAmounts = useMemo(() => {
    if (!profile) return {} as Record<CriticalExpenseKey, number>;
    const suggestions: Record<CriticalExpenseKey, number> = {} as Record<CriticalExpenseKey, number>;
    for (const [key] of expenseList) {
      suggestions[key] = getSuggestedCriticalExpenseCost(key, profile.answers);
    }
    return suggestions;
  }, [profile]);

  const handleSelect = (key: CriticalExpenseKey) => {
    setSelectedExpense(key);
    const suggested = suggestedAmounts[key] || 0;
    setCustomAmount(String(suggested));
  };

  const handleSave = async () => {
    if (!selectedExpense) return;
    const amount = Number(customAmount) || 0;
    if (amount <= 0) return;

    const projection = calculateCompoundProjection({ monthlySavings: amount });
    
    await saveCommitment({
      month: new Date().toISOString().slice(0, 7),
      expenseKey: selectedExpense,
      estimatedMonthlyCost: amount,
      committedAt: new Date().toISOString(),
      status: 'active',
      compoundProjection: projection,
    });
    onClose();
  };

  const currentCommitment = commitment;
  const committedExpense = currentCommitment?.expenseKey;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={locale === 'th' ? 'ค่าใช้จ่ายที่ควรลด' : 'Cut One Expense This Month'}
      description={locale === 'th' 
        ? 'เลือกหนึ่งรายการที่จะลด และดูเงินที่จะประหยัดได้' 
        : 'Pick one expense to cut and see your savings'}
      size="lg"
      showCloseButton={true}
    >
      {commitmentLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-400" />
          <span className="ml-3 text-white/70">Loading...</span>
        </div>
      ) : committedExpense ? (
        // Show current commitment
        <div className="space-y-6">
          <Card variant="accent" className="p-6 text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Target className="h-8 w-8 text-amber-400" />
              <h3 className="text-xl font-semibold text-white">
                {locale === 'th' ? 'คุณได้เลือกแล้วในเดือนนี้' : 'Already Committed This Month'}
              </h3>
            </div>
            
            <div className="flex items-center justify-center gap-6 mb-4">
              <ProgressRing 
                value={85} 
                size={100} 
                strokeWidth={8}
                color="amber"
                showValue={false}
              />
              <div className="text-left">
                <p className="text-2xl font-bold text-amber-400 font-mono">
                  {CRITICAL_EXPENSES[committedExpense][locale === 'th' ? 'labelTh' : 'labelEn']}
                </p>
                <p className="text-white/70">
                  {locale === 'th' ? 'คัดลอก' : 'Cut'} ฿{currentCommitment?.estimatedMonthlyCost?.toLocaleString()}/mo
                </p>
                <p className="text-sm text-white/50 mt-1">
                  {locale === 'th' ? 'จะได้' : 'Will save'} 
                  {formatCurrency(currentCommitment?.compoundProjection.oneYear || 0, locale)}/yr
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-black/30 rounded-xl p-4">
                <div className="text-2xl font-bold text-amber-400 font-mono">
                  {formatCurrency(currentCommitment?.compoundProjection.oneYear || 0, locale)}
                </div>
                <div className="text-xs text-white/60">1 Year</div>
              </div>
              <div className="bg-black/30 rounded-xl p-4">
                <div className="text-2xl font-bold text-amber-400 font-mono">
                  {formatCurrency(currentCommitment?.compoundProjection.fiveYears || 0, locale)}
                </div>
                <div className="text-xs text-white/60">5 Years</div>
              </div>
              <div className="bg-black/30 rounded-xl p-4">
                <div className="text-2xl font-bold text-amber-400 font-mono">
                  {formatCurrency(currentCommitment?.compoundProjection.tenYears || 0, locale)}
                </div>
                <div className="text-xs text-white/60">10 Years</div>
              </div>
            </div>

            <Button variant="secondary" className="w-full mt-4" onClick={() => {}}>
              {locale === 'th' ? 'เปลี่ยนรายการ' : 'Change Selection'}
            </Button>
          </Card>
        </div>
      ) : (
        // Show expense picker
        <div className="space-y-6">
          <div className="flex items-center gap-3 p-4 bg-amber-400/10 border border-amber-400/30 rounded-xl">
            <Calculator className="h-8 w-8 text-amber-400" />
            <div>
              <p className="font-semibold text-white">
                {locale === 'th' ? 'กฎ: เลือกแค่ 1 อย่างต่อเดือน' : 'Rule: Pick ONLY 1 per month'}
              </p>
              <p className="text-sm text-white/60">
                {locale === 'th' 
                  ? 'ลงทุนเงินที่ประหยัดได้ที่อัตรา 7% ต่อปี' 
                  : 'Invest savings at 7% annual return'}
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {expenseList.map(([key, expense]) => {
              const isSelected = selectedExpense === key;
              const suggested = suggestedAmounts[key] || 0;
              const projection = calculateCompoundProjection({ monthlySavings: suggested });
              
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleSelect(key)}
                  className={`
                    p-4 rounded-xl border-2 transition-all text-left relative
                    ${isSelected 
                      ? 'border-amber-400 bg-amber-400/10' 
                      : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                    }
                  `}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-3xl mt-1">{expense.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">
                          {locale === 'th' ? expense.labelTh : expense.labelEn}
                        </span>
                        {isSelected && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-medium">
                            {locale === 'th' ? 'เลือกแล้ว' : 'Selected'}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-white/60">{expense.thaiContext}</p>
                      
                      {suggested > 0 && (
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-xs text-white/50">
                            {locale === 'th' ? 'แนะนำ' : 'Suggested'}:
                          </span>
                          <span className="text-sm font-mono text-amber-400">
                            {formatCurrency(suggested, locale)}/mo
                          </span>
                          <span className="text-xs text-white/50">
                            → {formatCurrency(projection.oneYear, locale)}/yr
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  {isSelected && (
                    <div className="absolute top-2 right-2 flex items-center gap-1 text-amber-400">
                      <AlertCircle className="h-4 w-4" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {selectedExpense && (
            <Card variant="strong" className="p-4">
              <h4 className="font-semibold text-white mb-4">
                {locale === 'th' ? 'ตั้งค่าจำนวนเงิน' : 'Set Amount'}:
                {CRITICAL_EXPENSES[selectedExpense][locale === 'th' ? 'labelTh' : 'labelEn']}
              </h4>
              
              <div className="space-y-4">
                <div className="relative">
                  <input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="100"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    className="w-full text-2xl font-mono text-center bg-black/30 border border-white/10 rounded-xl px-4 py-4 text-white placeholder:text-white/30 outline-none focus:border-amber-400"
                    placeholder={locale === 'th' ? 'เช่น 3000' : 'e.g. 3000'}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50">
                    {locale === 'th' ? '฿' : '$'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {[1000, 3000, 5000, 8000, 10000].map(amt => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setCustomAmount(String(amt))}
                      className={`px-3 py-2 rounded-xl text-sm font-medium transition ${
                        Number(customAmount) === amt
                          ? 'bg-amber-400 text-slate-950'
                          : 'bg-white/5 text-white/70 hover:bg-white/10'
                      }`}
                    >
                      {formatCurrency(amt, locale)}
                    </button>
                  ))}
                </div>

                {Number(customAmount) > 0 && (
                  <div className="grid grid-cols-3 gap-3 text-center pt-2">
                    <div className="bg-black/30 rounded-xl p-3">
                      <div className="text-xl font-bold text-amber-400 font-mono">
                        {formatCurrency(calculateCompoundProjection({ monthlySavings: Number(customAmount) }).oneYear, locale)}
                      </div>
                      <div className="text-xs text-white/60">{locale === 'th' ? '1 ปี' : '1 Year'}</div>
                    </div>
                    <div className="bg-black/30 rounded-xl p-3">
                      <div className="text-xl font-bold text-amber-400 font-mono">
                        {formatCurrency(calculateCompoundProjection({ monthlySavings: Number(customAmount) }).fiveYears, locale)}
                      </div>
                      <div className="text-xs text-white/60">{locale === 'th' ? '5 ปี' : '5 Years'}</div>
                    </div>
                    <div className="bg-black/30 rounded-xl p-3">
                      <div className="text-xl font-bold text-amber-400 font-mono">
                        {formatCurrency(calculateCompoundProjection({ monthlySavings: Number(customAmount) }).tenYears, locale)}
                      </div>
                      <div className="text-xs text-white/60">{locale === 'th' ? '10 ปี' : '10 Years'}</div>
                    </div>
                  </div>
                )}

                <Button 
                  variant="primary" 
                  className="w-full" 
                  size="lg"
                  onClick={handleSave}
                  disabled={!customAmount || Number(customAmount) <= 0}
                >
                  {locale === 'th' ? 'ยืนยันและเริ่มลด' : 'Commit & Start Cutting'}
                </Button>
              </div>
            </Card>
          )}
        </div>
      )}
    </Modal>
  );
}