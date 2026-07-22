// app/quick-add/page.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Plus, Minus, Camera, Save, ArrowLeft, Loader2, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useExpenses, useWizardProfile } from '@/hooks/use-local-db';
import { useAction } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { type ExpenseCategory } from '@/lib/types/budget';

const labels = {
  th: {
    title: 'เพิ่มรายการด่วน',
    placeholder: 'พิมพ์จำนวนเงินตามด้วยรายละเอียด เช่น 120 ข้าวเที่ยง',
    camera: 'สแกนใบเสร็จ',
    save: 'บันทึก',
    scanning: 'กำลังวิเคราะห์ใบเสร็จ...',
    successAdded: 'บันทึกค่าใช้จ่ายสำเร็จ!',
    successIncome: 'ปรับเพิ่มรายได้สำเร็จ!',
    failed: 'เกิดข้อผิดพลาดในการบันทึก!',
    invalidAmount: 'กรุณาป้อนจำนวนเงินที่ถูกต้อง',
    back: 'ย้อนกลับ',
    expense: 'ค่าใช้จ่าย (-)',
    income: 'รายได้ (+)',
  },
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
  if (normalized.includes('food') || normalized.includes('dining') || normalized.includes('restaurant') || normalized.includes('กิน')) return 'food';
  if (normalized.includes('transport') || normalized.includes('taxi') || normalized.includes('ride') || normalized.includes('fuel') || normalized.includes('car') || normalized.includes('รถ')) return 'transport';
  if (normalized.includes('utilities') || normalized.includes('electricity') || normalized.includes('water') || normalized.includes('ไฟ')) return 'utilities';
  if (normalized.includes('housing') || normalized.includes('rent') || normalized.includes('mortgage') || normalized.includes('บ้าน')) return 'housing';
  if (normalized.includes('phone') || normalized.includes('internet') || normalized.includes('telecom') || normalized.includes('เน็ต')) return 'phone_internet';
  if (normalized.includes('sub') || normalized.includes('netflix') || normalized.includes('spotify')) return 'subscriptions';
  if (normalized.includes('entertainment') || normalized.includes('movie') || normalized.includes('game') || normalized.includes('เกม')) return 'entertainment';
  if (normalized.includes('health') || normalized.includes('medical') || normalized.includes('doctor') || normalized.includes('hospital') || normalized.includes('ยา')) return 'healthcare';
  if (normalized.includes('insurance') || normalized.includes('ประกัน')) return 'insurance';
  if (normalized.includes('debt') || normalized.includes('loan') || normalized.includes('ดอกเบี้ย')) return 'debt';
  if (normalized.includes('savings') || normalized.includes('invest') || normalized.includes('ออม')) return 'savings';
  return 'other';
};

export default function QuickAddPage() {
  const locale = useLocale() as 'th' | 'en';
  const router = useRouter();
  const l = labels[locale];

  const { add: addExpense } = useExpenses();
  const { profile, save: saveProfile } = useWizardProfile();
  
  // Safe invocation of useAction (falls back gracefully if not authenticated/online)
  let parseReceiptAction: any = null;
  try {
    parseReceiptAction = useAction(api.receipts.parseReceipt);
  } catch (e) {
    console.warn("Convex provider not active or offline:", e);
  }

  // UI States
  const [isExpense, setIsExpense] = useState(true);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [detectedCategory, setDetectedCategory] = useState<ExpenseCategory>('other');
  
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
          merchant: noteVal || (locale === 'th' ? 'รายการด่วน' : 'Quick Expense'),
          category: detectedCategory,
          date: new Date().toISOString().split('T')[0],
          source: 'manual',
          note: noteVal || undefined
        });
        setToast({ show: true, message: l.successAdded, type: 'success' });
      } else {
        // Record Income
        if (profile) {
          const currentIncome = profile.answers?.income || 0;
          const updatedProfile = {
            ...profile,
            answers: {
              ...profile.answers,
              income: currentIncome + amountVal
            }
          };
          await saveProfile(updatedProfile);
          setToast({ show: true, message: l.successIncome, type: 'success' });
        } else {
          throw new Error("Wizard profile not initialized");
        }
      }

      // Reset form
      setInputText('');
      setDetectedCategory('other');
    } catch (err: any) {
      console.error(err);
      setToast({ show: true, message: `${l.failed} ${err.message || ''}`, type: 'error' });
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

    reader.onloadend = async () => {
      const base64String = reader.result as string;
      try {
        if (!parseReceiptAction) {
          throw new Error("Backend connection offline. Please enter manually.");
        }

        const parsed = await parseReceiptAction({ base64Image: base64String });
        
        // Auto populate values
        setIsExpense(true); // Receipts are always expenses
        setDetectedCategory(mapCategory(parsed?.category || 'other'));
        
        // Construct visual text: amount + merchant
        const amountStr = (parsed?.amount ?? 0).toString();
        const merchantStr = parsed?.merchant || '';
        setInputText(`${amountStr} ${merchantStr}`.trim());

        setToast({
          show: true,
          message: locale === 'th' ? `สแกนใบเสร็จสำเร็จ! ${parsed?.amount ?? 0} บาท` : `Successfully scanned! ${parsed?.amount ?? 0}`,
          type: 'success'
        });
      } catch (err: any) {
        console.error("Receipt scanning failed:", err);
        setToast({
          show: true,
          message: err.message || "Failed to process receipt image. Please enter manually.",
          type: 'error'
        });
      } finally {
        setLoading(false);
        // Clear file input
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };

    reader.readAsDataURL(file);
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
    </div>
  );
}
