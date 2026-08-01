// app/quick-add/page.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Minus, Camera, Save, ArrowLeft, Loader2, Check, AlertCircle, MessageSquare, ShieldCheck, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useExpenses, useWizardProfile, useIncomes } from '@/hooks/use-local-db';
import { useReceiptScan } from '@/hooks/use-receipt-scan';
import { useInboxPermission } from '@/hooks/use-inbox-permission';
import { parseSMS, getBestCandidate } from '@/lib/sms-parser';
import { ReceiptVerifySheet } from '@/components/receipt/receipt-verify-sheet';
import { type ExpenseCategory, type IncomeCategory } from '@/lib/types/budget';
import { useAction } from 'convex/react';
import { api } from '../../../convex/_generated/api';

const labels = {
  en: {
    title: 'Quick Add',
    placeholder: 'Type amount then note, e.g. 120 lunch',
    camera: 'Scan Receipt',
    inbox: 'Inbox SMS/Email',
    save: 'Save',
    scanning: 'Scanning & scraping receipt photo...',
    parsing: 'Parsing SMS message...',
    successAdded: 'Expense recorded successfully!',
    successIncome: 'Income added successfully!',
    failed: 'Failed to record entry!',
    invalidAmount: 'Please enter a valid amount',
    back: 'Back',
    expense: 'Expense (-)',
    income: 'Income (+)',
    permTitle: 'SMS & Email Inbox Permission',
    permDesc: 'Allow Budget Boss to parse financial transaction messages from your inbox or clipboard to auto-fill details?',
    rememberChoice: 'Remember my decision on this device',
    allow: 'Allow Access',
    deny: 'Deny Access',
    pasteSmsTitle: 'Paste SMS or Email Notification',
    pasteSmsPlaceholder: 'Paste bank alert e.g. "Paid $45.50 at STARBUCKS card 1234 on 08/01/2026"',
    extractBtn: 'Scrape & Auto-Fill',
    close: 'Close',
  }
};

const mapCategory = (cat: string): ExpenseCategory => {
  const normalized = cat.toLowerCase().replace(/[\s_-]+/g, '');
  if (normalized.includes('food') || normalized.includes('dining') || normalized.includes('restaurant') || normalized.includes('starbucks') || normalized.includes('mcdonald')) return 'food';
  if (normalized.includes('transport') || normalized.includes('taxi') || normalized.includes('ride') || normalized.includes('fuel') || normalized.includes('car') || normalized.includes('grab') || normalized.includes('bolt') || normalized.includes('uber')) return 'transport';
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
  const { status: inboxPermStatus, grantPermission, denyPermission } = useInboxPermission();

  // Optional Convex action for AI vision receipt parsing
  let parseReceiptAction: ReturnType<typeof useAction<typeof api.receipts.parseReceipt>> | null = null;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    parseReceiptAction = useAction(api.receipts.parseReceipt);
  } catch {
    // Offline or test environment fallback
  }

  // UI States
  const [isExpense, setIsExpense] = useState(true);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [detectedCategory, setDetectedCategory] = useState<ExpenseCategory>('other');
  const [incomeCategory, setIncomeCategory] = useState<IncomeCategory>('salary');
  const [entrySource, setEntrySource] = useState<'manual' | 'receipt' | 'import'>('manual');

  // Permission & SMS Modal States
  const [showPermModal, setShowPermModal] = useState(false);
  const [showSmsModal, setShowSmsModal] = useState(false);
  const [rememberCheck, setRememberCheck] = useState(true);
  const [rawSmsInput, setRawSmsInput] = useState('');
  
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error';
  }>({ show: false, message: '', type: 'success' });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Automatically hide toast after 3.5 seconds
  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => {
        setToast(prev => ({ ...prev, show: false }));
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [toast.show]);

  // Sync scanned receipt draft fields into Quick Add form automatically
  useEffect(() => {
    if (draft && draft.fields) {
      setIsExpense(true);
      setEntrySource('receipt');
      const amtVal = Number(draft.fields.total?.value ?? 0);
      const merchVal = String(draft.fields.merchant?.value ?? 'Receipt').trim();
      const catVal = (draft.fields.category?.value as string) ?? 'other';

      const catMapped = mapCategory(catVal || merchVal);
      setDetectedCategory(catMapped);

      if (amtVal > 0) {
        // Auto-fill input text with amount and merchant
        setInputText(`${amtVal} ${merchVal}`.trim());

        // Automatically commit scanned expense so user does not need to re-type or click secondary buttons
        const handleAutoCommit = async () => {
          try {
            await addExpense({
              amount: amtVal,
              merchant: merchVal || 'Photo Receipt',
              category: catMapped,
              date: draft.fields.date?.value ? String(draft.fields.date.value) : new Date().toISOString().split('T')[0],
              source: 'receipt',
              note: 'Scanned receipt photo'
            });
            setToast({ show: true, message: `📸 Scraped & Saved: ${amtVal} @ ${merchVal}`, type: 'success' });
            await confirmDraft();
          } catch (err) {
            console.error("Auto-save receipt error:", err);
          }
        };
        handleAutoCommit();
      } else {
        // If amount was unextracted or 0, pre-fill merchant and prompt user for amount
        setInputText(`${merchVal}`.trim());
        setToast({
          show: true,
          message: `📸 Photo scanned: "${merchVal}". Please type the amount:`,
          type: 'success'
        });
      }
    }
  }, [draft, addExpense, confirmDraft]);

  // Handle manual or verified save
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
          source: entrySource,
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
          entrySource: entrySource === 'import' ? 'import' : 'manual'
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
      setEntrySource('manual');
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

    reader.onload = async () => {
      const dataUrl = reader.result as string;

      // First attempt: Gemini AI Vision Receipt Parser via Convex (if online & action available)
      if (parseReceiptAction && typeof navigator !== 'undefined' && navigator.onLine) {
        try {
          const aiRes = await parseReceiptAction({ base64Image: dataUrl });
          if (aiRes && aiRes.amount > 0) {
            const amt = aiRes.amount;
            const merch = aiRes.merchant || 'Receipt';
            const cat = mapCategory(aiRes.category || 'other');

            await addExpense({
              amount: amt,
              merchant: merch,
              category: cat,
              date: aiRes.date || new Date().toISOString().split('T')[0],
              source: 'receipt',
              note: 'Scanned receipt photo'
            });

            setInputText(`${amt} ${merch}`);
            setDetectedCategory(cat);
            setEntrySource('receipt');
            setToast({ show: true, message: `📸 AI Scraped & Saved: ${amt} @ ${merch}`, type: 'success' });
            setLoading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
          }
        } catch (aiErr) {
          console.warn("Server AI receipt parse failed, falling back to OCR engine:", aiErr);
        }
      }

      // Fallback: Client-side OCR + Pattern Scraper Engine
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = async () => {
        try {
          await scanImage(img, 'ZA');
          setEntrySource('receipt');
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

    reader.readAsDataURL(file);
  };

  // Trigger Inbox SMS/Email process
  const triggerInboxFeature = () => {
    if (inboxPermStatus === 'granted') {
      setShowSmsModal(true);
    } else if (inboxPermStatus === 'denied') {
      setShowPermModal(true);
    } else {
      setShowPermModal(true);
    }
  };

  const handleGrantPermission = () => {
    grantPermission(rememberCheck);
    setShowPermModal(false);
    setShowSmsModal(true);
  };

  const handleDenyPermission = () => {
    denyPermission(rememberCheck);
    setShowPermModal(false);
    setToast({ show: true, message: 'Permission denied for SMS/Email ingestion.', type: 'error' });
  };

  // Extract fields from pasted SMS/Email text
  const handleScrapeSms = async () => {
    if (!rawSmsInput.trim()) {
      setToast({ show: true, message: 'Please enter or paste message text first.', type: 'error' });
      return;
    }

    const parsed = parseSMS(rawSmsInput, 'manual-paste');
    const best = getBestCandidate(parsed);

    if (best && best.amount > 0) {
      const amt = best.amount;
      const merch = best.merchant || 'Merchant';
      const cat = mapCategory(best.merchant || best.rawText);
      const isExp = best.type !== 'income';

      setInputText(`${amt} ${merch}`.trim());
      setDetectedCategory(cat);
      setIsExpense(isExp);
      setEntrySource('import');
      setShowSmsModal(false);

      if (isExp) {
        await addExpense({
          amount: amt,
          merchant: merch,
          category: cat,
          date: best.date || new Date().toISOString().split('T')[0],
          source: 'import',
          note: 'Inbox SMS/Email'
        });
        setToast({ show: true, message: `📱 Scraped & Saved: ${best.currency} ${amt} @ ${merch}`, type: 'success' });
      } else {
        setToast({ show: true, message: `📱 Scraped Income: ${best.currency} ${amt} @ ${merch}`, type: 'success' });
      }
    } else {
      setToast({ show: true, message: 'Could not extract valid financial info from message.', type: 'error' });
    }
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
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-white/30 text-sm focus:outline-none focus:border-amber-400/50 transition-colors disabled:opacity-50 pr-24"
              autoFocus
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {entrySource === 'import' && (
                <span className="text-[10px] bg-sky-400/20 text-sky-300 font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  📱 SMS
                </span>
              )}
              {entrySource === 'receipt' && (
                <span className="text-[10px] bg-amber-400/20 text-amber-300 font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  📸 Photo
                </span>
              )}
              {detectedCategory !== 'other' && isExpense && entrySource === 'manual' && (
                <span className="text-[10px] bg-amber-400/20 text-amber-300 font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  {detectedCategory}
                </span>
              )}
            </div>
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

        {/* Action Buttons Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {/* Camera Scan Button */}
          <Button
            variant="secondary"
            onClick={triggerCamera}
            isLoading={loading}
            className="flex items-center justify-center gap-1.5 py-3 rounded-2xl text-xs font-semibold"
          >
            <Camera className="w-4 h-4 text-amber-400" />
            <span>{l.camera}</span>
          </Button>

          {/* Inbox SMS / Email Button */}
          <Button
            variant="secondary"
            onClick={triggerInboxFeature}
            isLoading={loading}
            className="flex items-center justify-center gap-1.5 py-3 rounded-2xl text-xs font-semibold"
            data-testid="inbox-sms-btn"
          >
            <MessageSquare className="w-4 h-4 text-sky-400" />
            <span>{l.inbox}</span>
          </Button>
        </div>

        {/* Save Button */}
        <Button
          variant="primary"
          onClick={handleSave}
          isLoading={loading}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-xs font-bold shadow-lg"
        >
          <Save className="w-4 h-4 text-slate-950" />
          <span>{l.save}</span>
        </Button>

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

      {/* Permission Modal */}
      {showPermModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-sm bg-neutral-900 border border-sky-400/30 rounded-3xl p-6 shadow-2xl space-y-4" data-testid="inbox-perm-modal">
            <div className="flex items-center gap-3 text-sky-400">
              <div className="p-2.5 rounded-2xl bg-sky-400/10 border border-sky-400/20">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-white leading-tight">
                {l.permTitle}
              </h3>
            </div>
            <p className="text-xs text-white/70 leading-relaxed">
              {l.permDesc}
            </p>
            <label className="flex items-center gap-2.5 text-xs text-white/80 cursor-pointer pt-2 select-none">
              <input
                type="checkbox"
                checked={rememberCheck}
                onChange={(e) => setRememberCheck(e.target.checked)}
                className="w-4 h-4 rounded border-white/20 bg-white/10 text-sky-500 focus:ring-0 cursor-pointer"
                data-testid="remember-perm-checkbox"
              />
              <span>{l.rememberChoice}</span>
            </label>
            <div className="flex gap-2 pt-2">
              <Button
                variant="secondary"
                className="flex-1 py-2.5 rounded-xl text-xs"
                onClick={handleDenyPermission}
                data-testid="deny-perm-btn"
              >
                {l.deny}
              </Button>
              <Button
                variant="primary"
                className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-sky-400 hover:bg-sky-300 text-slate-950"
                onClick={handleGrantPermission}
                data-testid="grant-perm-btn"
              >
                {l.allow}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Paste SMS / Email Modal */}
      {showSmsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-sm bg-neutral-900 border border-white/10 rounded-3xl p-6 shadow-2xl space-y-4" data-testid="paste-sms-modal">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sky-400">
                <MessageSquare className="w-5 h-5" />
                <h3 className="text-sm font-bold text-white">
                  {l.pasteSmsTitle}
                </h3>
              </div>
              <button
                onClick={() => setShowSmsModal(false)}
                className="text-white/40 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <textarea
              value={rawSmsInput}
              onChange={(e) => setRawSmsInput(e.target.value)}
              placeholder={l.pasteSmsPlaceholder}
              rows={4}
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-3 text-xs text-white placeholder-white/30 focus:outline-none focus:border-sky-400/50"
              data-testid="sms-text-input"
            />
            <div className="flex gap-2">
              <Button
                variant="secondary"
                className="flex-1 py-2.5 rounded-xl text-xs"
                onClick={() => setShowSmsModal(false)}
              >
                {l.close}
              </Button>
              <Button
                variant="primary"
                className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-sky-400 hover:bg-sky-300 text-slate-950"
                onClick={handleScrapeSms}
                data-testid="scrape-sms-btn"
              >
                {l.extractBtn}
              </Button>
            </div>
          </div>
        </div>
      )}

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

      {/* Receipt Verification Bottom Sheet (Questions only if ambiguous) */}
      <ReceiptVerifySheet
        isOpen={Boolean(draft && draft.questions && draft.questions.length > 0)}
        questions={draft?.questions ?? []}
        onAnswer={answerQuestion}
        onClose={() => confirmDraft()}
      />
    </div>
  );
}
