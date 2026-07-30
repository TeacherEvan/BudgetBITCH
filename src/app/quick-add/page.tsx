// app/quick-add/page.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Minus, Camera, Save, ArrowLeft, Loader2, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useExpenses, useWizardProfile, useIncomes } from '@/hooks/use-local-db';
import { useReceiptScan } from '@/hooks/use-receipt-scan';
import { ReceiptVerifySheet } from '@/components/receipt/receipt-verify-sheet';
import { type ExpenseCategory, type IncomeCategory } from '@/lib/types/budget';

const labels = {
  en: {
    title: 'Quick Add',
    placeholder: 'Type amount then note, e.g. 120 lunch',
    camera: 'Scan Receipt',
    save: 'Save',
    scanning: 'Scanning receipt...',
    successAdded: 'Expense recorded successfully!',
    successIncome: 'Income added successfully!',
    failed: 'Failed to record entry!',
    invalidAmount: 'Please enter a valid amount',
    back: 'Back',
    expense: 'Expense (-)',
    income: 'Income (+)',
  }
};

const mapCategory = (cat: string): ExpenseCategory => {
  const normalized = cat.toLowerCase().replace(/[\s_-]+/g, '');
  if (normalized.includes('food') || normalized.includes('dining') || normalized.includes('restaurant')) return 'food';
  if (normalized.includes('transport') || normalized.includes('taxi') || normalized.includes('ride') || normalized.includes('fuel') || normalized.includes('car')) return 'transport';
  if (normalized.includes('utilities') || normalized.includes('electricity') || normalized.includes('water')) return 'utilities';
  if (normalized.includes('housing') || normalized.includes('rent') || normalized.includes('mortgage')) return 'housing';
  if (normalized.includes('phone') || normalized.includes('internet') || normalized.includes('telecom')) return 'phone_internet';
  if (normalized.includes('sub') || normalized.includes('netflix') || normalized.includes('spotify')) return 'subscriptions';
  if (normalized.includes('entertainment') || normalized.includes('movie') || normalized.includes('game')) return 'entertainment';
  if (normalized.includes('health') || normalized.includes('medical') || normalized.includes('doctor') || normalized.includes('hospital')) return 'healthcare';
  if (normalized.includes('insurance')) return 'insurance';
  if (normalized.includes('debt') || normalized.includes('loan')) return 'debt';
  if (normalized.includes('savings') || normalized.includes('invest')) return 'savings';
  return 'other';
};

export default function QuickAddPage() {
  const router = useRouter();
  const l = labels.en;

  const { add: addExpense } = useExpenses();
  const { add: addIncome } = useIncomes();
  const { profile, save: saveProfile } = useWizardProfile();
  
  const { draft, scanImage, answerQuestion, confirmDraft } = useReceiptScan();

  // UI States
  const [isExpense, setIsExpense] = useState(true);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [detectedCategory, setDetectedCategory] = useState<ExpenseCategory>('other');
  const [incomeCategory, setIncomeCategory] = useState<IncomeCategory>('salary');
  
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error';
  }>({ show: false, message: '', type: 'success' });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Automatically hide toast after 3 seconds
  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => {
        setToast(prev => ({ ...prev, show: false }));
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast.show]);

  // Sync scanned draft fields to input box
  useEffect(() => {
    if (draft && draft.fields) {
      setIsExpense(true);
      const amtVal = draft.fields.total?.value ?? 0;
      const merchVal = draft.fields.merchant?.value ?? '';
      const catVal = (draft.fields.category?.value as string) ?? 'other';

      setInputText(`${amtVal} ${merchVal}`.trim());
      setDetectedCategory(mapCategory(catVal));
    }
  }, [draft]);

  // Handle manual input save
  const handleSave = async () => {
    const trimmed = inputText.trim();
    if (!trimmed) {
      setToast({ show: true, message: l.invalidAmount, type: 'error' });
      return;
    }

    // Extract first number found
    const numberMatch = trimmed.match(/(\d+(?:\.\d+)?)/);
    if (!numberMatch) {
      setToast({ show: true, message: l.invalidAmount, type: 'error' });
      return;
    }

    const amountVal = parseFloat(numberMatch[1]);
    const noteVal = trimmed.replace(numberMatch[0], '').trim();

    try {
      setLoading(true);
      if (isExpense) {
        // Record Expense
        await addExpense({
          amount: amountVal,
          merchant: noteVal || ('Quick Expense'),
          category: detectedCategory,
          date: new Date().toISOString().split('T')[0],
          source: 'manual',
          note: noteVal || undefined
        });
        setToast({ show: true, message: l.successAdded, type: 'success' });
      } else {
        // Record Income Log
        await addIncome({
          amount: amountVal,
          source: noteVal || ('Quick Income'),
          category: incomeCategory,
          frequency: 'one_time',
          date: new Date().toISOString().split('T')[0],
          note: noteVal || undefined,
          entrySource: 'manual'
        });

        // Also update profile baseline monthly income
        if (profile) {
          const currentIncome = profile.answers?.income || 0;
          await saveProfile({
            ...profile,
            answers: {
              ...profile.answers,
              income: currentIncome + amountVal
            }
          });
        }
        setToast({ show: true, message: l.successIncome, type: 'success' });
      }

      // Reset form
      setInputText('');
      setDetectedCategory('other');
    } catch (err) {
      console.error(err);
      setToast({ show: true, message: `${l.failed} ${err instanceof Error ? err.message : String(err)}`, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Trigger camera file picker
  const triggerCamera = () => {
    fileInputRef.current?.click();
  };

  // Process captured receipt image
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Verify it's an image
    if (!file.type.startsWith('image/')) {
      setToast({ show: true, message: 'Please select a valid image file.', type: 'error' });
      return;
    }

    setLoading(true);
    setToast({ show: true, message: l.scanning, type: 'success' });

    const reader = new FileReader();
    reader.onerror = () => {
      setLoading(false);
      setToast({
        show: true,
        message: 'Failed to read image file. Please try again or enter manually.',
        type: 'error'
      });
      if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = async () => {
      try {
        setLoading(true);
        setToast({ show: true, message: l.scanning, type: 'success' });
        await scanImage(img, 'ZA');
      } catch (err) {
        console.error("Receipt scanning failed:", err);
        setToast({
          show: true,
          message: (err instanceof Error ? err.message : String(err)) || "Failed to process receipt image. Please enter manually.",
          type: 'error'
        });
      } finally {
        setLoading(false);
        URL.revokeObjectURL(url);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    img.src = url;
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-4 relative overflow-hidden select-none">
      
      {/* Decorative Cyberpunk Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-amber-400/5 blur-[120px] pointer-events-none" />
      <div className={`absolute bottom-1/4 left-1/2 -translate-x-1/2 translate-y-1/2 w-80 h-80 rounded-full blur-[120px] pointer-events-none transition-colors duration-500 ${isExpense ? 'bg-rose-500/5' : 'bg-emerald-500/5'}`} />

      {/* Standalone Widget Container */}
      <div className="w-full max-w-sm bg-black/45 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 shadow-2xl relative z-10 transition-all duration-300">
        
        {/* Header / Back */}
        <div className="flex items-center justify-between mb-8">
          <button 
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-1.5 text-xs text-white/50 hover:text-amber-400 transition-colors p-1"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{l.back}</span>
          </button>
          <h2 className="text-sm font-semibold tracking-wider uppercase text-amber-400/80">
            {l.title}
          </h2>
          <div className="w-12 h-1" /> {/* Spacer */}
        </div>

        {/* Large Widget +/- Sign Toggle */}
        <div className="flex justify-center mb-8">
          <button
            onClick={() => setIsExpense(!isExpense)}
            aria-label={isExpense ? (l.expense) : (l.income)}
            className={`
              w-24 h-24 rounded-full flex flex-col items-center justify-center border-2 transition-all duration-300 relative group
              ${isExpense 
                ? 'bg-rose-950/20 border-rose-500/40 text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.15)] hover:border-rose-400' 
                : 'bg-emerald-950/20 border-emerald-500/40 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.15)] hover:border-emerald-400'
              }
            `}
          >
            {isExpense ? (
              <Minus className="w-10 h-10 stroke-[2.5]" />
            ) : (
              <Plus className="w-10 h-10 stroke-[2.5]" />
            )}
            <span className="text-[10px] uppercase font-bold tracking-wider mt-1 opacity-70">
              {isExpense ? l.expense : l.income}
            </span>
          </button>
        </div>

        {/* Amount & Description Input Box */}
        <div className="space-y-4 mb-6">
          <div className="relative">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={l.placeholder}
              disabled={loading}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-white/30 text-sm focus:outline-none focus:border-amber-400/50 transition-colors disabled:opacity-50 pr-12"
              autoFocus
            />
            {detectedCategory !== 'other' && isExpense && (
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] bg-amber-400/20 text-amber-300 font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider">
                {detectedCategory}
              </span>
            )}
          </div>
        </div>

        {/* Category Pickers for Income */}
        {!isExpense && (
          <div className="mb-6 space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-white/50 tracking-wider">
              {'Income Category'}
            </label>
            <select
              value={incomeCategory}
              onChange={(e) => setIncomeCategory(e.target.value as IncomeCategory)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-sm focus:outline-none focus:border-emerald-500/50 text-white outline-none"
            >
              <option value="salary" className="bg-[#0a0a0a]">💵 {'Salary'}</option>
              <option value="freelance" className="bg-[#0a0a0a]">💻 {'Freelance'}</option>
              <option value="business" className="bg-[#0a0a0a]">🏢 {'Business'}</option>
              <option value="investments" className="bg-[#0a0a0a]">📈 {'Investments'}</option>
              <option value="gift" className="bg-[#0a0a0a]">🎁 {'Gift'}</option>
              <option value="refund" className="bg-[#0a0a0a]">🔄 {'Refund'}</option>
              <option value="other" className="bg-[#0a0a0a]">✨ {'Other'}</option>
            </select>
          </div>
        )}

        {/* Action Buttons Row */}
        <div className="grid grid-cols-2 gap-4">
          {/* Camera Scan Button */}
          <Button
            variant="secondary"
            onClick={triggerCamera}
            isLoading={loading}
            className="flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-semibold"
          >
            <Camera className="w-4 h-4 text-amber-400" />
            <span>{l.camera}</span>
          </Button>

          {/* Save Button */}
          <Button
            variant="primary"
            onClick={handleSave}
            isLoading={loading}
            className="flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-bold"
          >
            <Save className="w-4 h-4 text-slate-950" />
            <span>{l.save}</span>
          </Button>
        </div>

        {/* Hidden Camera Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          capture="environment"
          className="hidden"
          data-testid="camera-file-input"
        />
      </div>

      {/* Floating Toast Notification */}
      {toast.show && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-down">
          <div className={`
            px-4 py-3 rounded-2xl flex items-center gap-2.5 shadow-2xl backdrop-blur-xl border text-sm max-w-xs font-medium
            ${toast.type === 'success' 
              ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-300' 
              : 'bg-rose-950/90 border-rose-500/30 text-rose-300'
            }
          `}>
            {loading && toast.message === l.scanning ? (
              <Loader2 className="w-4 h-4 animate-spin text-amber-400 flex-shrink-0" />
            ) : toast.type === 'success' ? (
              <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            )}
            <span className="leading-tight">{toast.message}</span>
          </div>
        </div>
      )}

      {/* Receipt Verification Bottom Sheet */}
      <ReceiptVerifySheet
        isOpen={Boolean(draft && draft.questions && draft.questions.length > 0)}
        questions={draft?.questions ?? []}
        onAnswer={answerQuestion}
        onClose={() => confirmDraft()}
      />
    </div>
  );
}
