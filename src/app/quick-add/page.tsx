// app/quick-add/page.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from 'convex/react';
import { Plus, Minus, Camera, Save, ArrowLeft, Loader2, Check, AlertCircle, MessageSquare, ShieldCheck, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useExpenses, useWizardProfile, useIncomes } from '@/hooks/use-local-db';
import { useReceiptScan } from '@/hooks/use-receipt-scan';
import { useInboxPermission } from '@/hooks/use-inbox-permission';
import { parseSMS, getBestCandidate } from '@/lib/sms-parser';
import { ReceiptVerifySheet } from '@/components/receipt/receipt-verify-sheet';
import { type ExpenseCategory, type IncomeCategory, type ReceiptLineItem } from '@/lib/types/budget';
import { mapCategory, reconcileLineItems } from '@/lib/receipt/map-category';
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
}

export default function QuickAddPage() {
  const router = useRouter();
  const l = labels.en;

  const { add: addExpense } = useExpenses();
  const { add: addIncome } = useIncomes();
  const { profile, save: saveProfile } = useWizardProfile();
  
  const { draft, scanImage, answerQuestion, confirmDraft } = useReceiptScan();
  const { status: inboxPermStatus, grantPermission, denyPermission } = useInboxPermission();

  // Optional Convex actions for AI vision receipt and message parsing
  let parseReceiptAction: ReturnType<typeof useAction<typeof api.receipts.parseReceipt>> | null = null;
  let parseMessageAction: ReturnType<typeof useAction<typeof api.receipts.parseMessage>> | null = null;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    parseReceiptAction = useAction(api.receipts.parseReceipt);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    parseMessageAction = useAction(api.receipts.parseMessage);
  } catch {
    // Offline or test environment fallback
  }

  // Load the pending bot-ingested (LINE / TeacherBOY) receipt draft so the
  // scraped amount/merchant surface on Quick Add without hunting the dashboard.
  // The bot writes drafts to Convex (status: 'draft', source: 'line').
  const botDrafts = useQuery(api.receipts.listReceipts, {
    source: 'line',
    status: 'draft',
    limit: 1,
  });
  const confirmBotDraft = useMutation(api.receipts.confirm);
  const [botDraftId, setBotDraftId] = useState<string | null>(null);

  // UI States
  const [isExpense, setIsExpense] = useState(true);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [detectedCategory, setDetectedCategory] = useState<ExpenseCategory>('other');
  const [incomeCategory, setIncomeCategory] = useState<IncomeCategory>('salary');
  const [entrySource, setEntrySource] = useState<'manual' | 'receipt' | 'import'>('manual');

  // Scanned-receipt review fields (editable before save)
  const [scannedAmount, setScannedAmount] = useState('');
  const [scannedMerchant, setScannedMerchant] = useState('');
  const [scannedCategory, setScannedCategory] = useState<ExpenseCategory>('other');
  const [scannedDate, setScannedDate] = useState('');
  const [scannedLineItems, setScannedLineItems] = useState<ReceiptLineItem[] | undefined>(undefined);

  // Permission & SMS Modal States
  const [showPermModal, setShowPermModal] = useState(false);
  const [showSmsModal, setShowSmsModal] = useState(false);
  const [rememberCheck, setRememberCheck] = useState(true);
  const [rawSmsInput, setRawSmsInput] = useState('');
  const [verifiedSmsData, setVerifiedSmsData] = useState<{
    amount: number;
    merchant: string;
    category: ExpenseCategory;
    date: string;
    type: 'expense' | 'income';
  } | null>(null);
  
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error';
  }>({ show: false, message: '', type: 'success' });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sample preset notifications for easy 1-click scraping test
  const sampleNotifications = [
    'CHASE: Your card ending in 1234 was charged $45.20 at TARGET on 08/01',
    'FNB :-): Paid R120.00 at Woolworths on 01Aug',
    'Citi Card ending 1234: $3500.00 received from ACME Corp',
    'Revolut: You spent $14.99 at APPLE',
    'Wise: You sent $85.00 to UBER',
  ];

  // Automatically hide toast after 3.5 seconds
  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => {
        setToast(prev => ({ ...prev, show: false }));
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [toast.show]);

  // Populate the Quick Add form from a scanned receipt draft so the user can
  // review/edit the fields before saving. We mirror the SMS flow: fill the
  // editable input + category selector, then let the user press Save manually.
  // The draft is NOT auto-committed — that was the previous bug (data landed in
  // the DB but never touched any field).
  useEffect(() => {
    if (draft && draft.fields) {
      setIsExpense(true);
      setEntrySource('receipt');

      const amtVal = Number(draft.fields.total?.value ?? 0);
      const merchVal = String(draft.fields.merchant?.value ?? '').trim();
      const catVal = (draft.fields.category?.value as string) ?? 'other';
      const catMapped = mapCategory(catVal || merchVal);
      const dateVal = draft.fields.date?.value
        ? String(draft.fields.date.value)
        : new Date().toISOString().split('T')[0];

      setDetectedCategory(catMapped);
      // Receipt engine already returns a valid category; use it directly for the
      // scanned review select (don't run the SMS mapCategory, which can emit
      // values like 'phone_internet' that aren't in the select list).
      setScannedAmount(amtVal > 0 ? String(amtVal) : '');
      setScannedMerchant(merchVal);
      setScannedCategory((catVal as ExpenseCategory) ?? 'other');
      setScannedDate(dateVal);

      // Carry the engine's itemization into the review card. The bot-ingest
      // path below does the same; without this a CAMERA scan silently lost its
      // line items and the whole receipt total landed in one category.
      // `unit_price` is the engine's snake_case field -> `unitPrice` on ours.
      const rawItems = Array.isArray(draft.lineItems) ? draft.lineItems : [];
      const mappedItems: ReceiptLineItem[] = rawItems.map((li) => ({
        description: String(li.description ?? ''),
        amount: Math.round((Number(li.amount) || 0) * 100) / 100,
        category: mapCategory(li.description),
        ...(Number.isFinite(li.qty) ? { qty: Number(li.qty) } : {}),
        ...(Number.isFinite(li.unit_price)
          ? { unitPrice: Math.round((Number(li.unit_price) || 0) * 100) / 100 }
          : {}),
      }));
      setScannedLineItems(mappedItems.length > 0 ? mappedItems : undefined);

      // Pre-fill the combined amount+merchant input so the user can still edit
      // the free-text field if they prefer that path.
      const prefill = [
        amtVal > 0 ? String(amtVal) : '',
        merchVal,
      ].filter(Boolean).join(' ').trim();
      setInputText(prefill);

      if (amtVal > 0 || merchVal) {
        setToast({
          show: true,
          message: `📸 Photo scanned${merchVal ? `: ${merchVal}` : ''}. Review the fields, then press Save.`,
          type: 'success'
        });
      } else {
        setToast({
          show: true,
          message: '📸 Photo scanned but no details found. Type the amount to save.',
          type: 'success'
        });
      }
    }
  }, [draft]);

  // Surface a bot-ingested (LINE / TeacherBOY) draft on Quick Add. The bot
  // writes drafts to Convex; load the latest pending one and fill the scanned
  // review fields so the scraped amount/merchant are visible and editable.
  // Skips if the user scanned a receipt in this session (local `draft` wins).
  useEffect(() => {
    if (draft) return; // session scan takes precedence
    const bot = botDrafts?.receipts?.[0];
    if (!bot) {
      if (botDraftId) setBotDraftId(null);
      return;
    }
    setIsExpense(true);
    setEntrySource('receipt');
    setBotDraftId(bot._id as string);
    setScannedAmount(bot.amount ? String(bot.amount) : '');
    setScannedMerchant(String(bot.merchant ?? ''));
    setScannedCategory((bot.category as ExpenseCategory) ?? 'other');
    setScannedLineItems(
      Array.isArray(bot.lineItems)
        ? (bot.lineItems as Array<{ description?: string; amount?: number }>).map((li) => ({
            description: String(li.description ?? ''),
            amount: Math.round((Number(li.amount) || 0) * 100) / 100,
            category: mapCategory(li.description),
          }))
        : undefined,
    );
    setScannedDate(
      bot.date
        ? String(bot.date)
        : new Date(bot._creationTime ?? Date.now()).toISOString().split('T')[0],
    );
    if (bot.amount) {
      setInputText(`${bot.amount} ${bot.merchant ?? ''}`.trim());
    }
  }, [draft, botDrafts, botDraftId]);

  // Persist the reviewed receipt fields. We fill the shared form state and reuse
  // the manual Save path so there is exactly one write into the expense store.
  const handleSaveScannedReceipt = async () => {
    const amtVal = parseFloat(scannedAmount);
    if (!Number.isFinite(amtVal) || amtVal <= 0) {
      setToast({ show: true, message: 'Please enter a valid amount', type: 'error' });
      return;
    }
    try {
      setLoading(true);
      const date = scannedDate || new Date().toISOString().split('T')[0];
      const roundedAmount = Math.round(amtVal * 100) / 100;
      // Only persist an itemization that reconciles with the reviewed total —
      // a half-parsed item set would misreport per-category spend downstream.
      const trustedItems = reconcileLineItems(scannedLineItems, roundedAmount);
      await addExpense({
        amount: roundedAmount,
        merchant: scannedMerchant.trim() || 'Photo Receipt',
        category: scannedCategory,
        date,
        source: 'receipt',
        note: 'Scanned receipt photo',
        lineItems: trustedItems,
      });
      if (botDraftId) {
        // Confirm the bot-ingested Convex draft (idempotent; flips status to
        // confirmed and stores the reviewed overrides).
        await confirmBotDraft({
          draftId: botDraftId as never,
          overrides: {
            amount: Math.round(amtVal * 100) / 100,
            merchant: scannedMerchant.trim() || 'Photo Receipt',
            category: scannedCategory,
            date,
          },
        });
        setBotDraftId(null);
      } else {
        // Session scan path: reuse the hook's confirm (skips the duplicate add).
        await confirmDraft(undefined, { skipLocalAdd: true });
      }
      setToast({ show: true, message: `📸 Saved receipt: ${amtVal} @ ${scannedMerchant || 'Photo Receipt'}`, type: 'success' });
      setScannedAmount('');
      setScannedMerchant('');
      setScannedDate('');
      setScannedLineItems(undefined);
      setInputText('');
      setDetectedCategory('other');
      setEntrySource('manual');
    } catch (err) {
      console.error('Failed to save scanned receipt:', err);
      setToast({ show: true, message: `Failed to save: ${err instanceof Error ? err.message : String(err)}`, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Handle manual or verified save
  const handleSave = async () => {
    const trimmed = inputText.trim();

    // Amount is optional on Quick Add: a note-only entry is saved as amount 0
    // so the user is never blocked from recording a spend. The manual/verified
    // save path below tolerates amountVal === 0.
    const numberMatch = trimmed.match(/(\d+(?:\.\d+)?)/);
    const amountVal = numberMatch ? parseFloat(numberMatch[1]) : 0;
    const noteVal = (numberMatch ? trimmed.replace(numberMatch[0], '') : trimmed).trim();

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
          note: noteVal || undefined,
          lineItems: entrySource === 'receipt' ? scannedLineItems : undefined,
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
          await scanImage(img, profile?.locale?.includes('TH') ? 'TH' : 'ZA');
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

  // Extract fields from pasted or selected SMS/Email text via Gemini AI + parseSMS fallback
  const handleScrapeSms = async (overrideText?: string) => {
    const textToScrape = (overrideText ?? rawSmsInput).trim();
    if (!textToScrape) {
      setToast({ show: true, message: 'Please enter or select message text first.', type: 'error' });
      return;
    }

    setLoading(true);
    setToast({ show: true, message: '🤖 AI Scraping Message/Email...', type: 'success' });

    let amt = 0;
    let merch = 'Merchant';
    let cat: ExpenseCategory = 'other';
    let dateVal = new Date().toISOString().split('T')[0];
    let isExp = true;

    // 1. Attempt Gemini 2.5 Flash AI server-side message parsing
    if (parseMessageAction && typeof navigator !== 'undefined' && navigator.onLine) {
      try {
        const aiResult = await parseMessageAction({ messageText: textToScrape });
        if (aiResult && aiResult.amount > 0) {
          amt = aiResult.amount;
          merch = aiResult.merchant || 'Merchant';
          cat = mapCategory(aiResult.category || 'other');
          dateVal = aiResult.date || dateVal;
          isExp = aiResult.type !== 'income';
        }
      } catch (err) {
        console.warn('Convex AI parseMessage failed, falling back to parseSMS:', err);
      }
    }

    // 2. Fallback to client regex parseSMS engine if AI was unconfigured/offline
    if (amt === 0) {
      const parsed = parseSMS(textToScrape, 'manual-paste');
      const best = getBestCandidate(parsed);
      if (best && best.amount > 0) {
        amt = best.amount;
        merch = best.merchant || 'Merchant';
        cat = mapCategory(best.merchant || best.rawText);
        dateVal = best.date || dateVal;
        isExp = best.type !== 'income';
      }
    }

    setLoading(false);

    if (amt > 0) {
      const resultData = {
        amount: amt,
        merchant: merch,
        category: cat,
        date: dateVal,
        type: isExp ? ('expense' as const) : ('income' as const),
      };
      setVerifiedSmsData(resultData);
      setInputText(`${amt} ${merch}`.trim());
      setDetectedCategory(cat);
      setIsExpense(isExp);
      setEntrySource('import');
      setToast({ show: true, message: `📱 AI Scraped: ${amt} @ ${merch}. Please verify below!`, type: 'success' });
    } else {
      setToast({ show: true, message: 'Could not extract valid financial info from message.', type: 'error' });
    }
  };

  // User confirms verified scraped entry
  const handleConfirmVerifiedSms = async () => {
    if (!verifiedSmsData) return;
    const { amount, merchant, category, date, type } = verifiedSmsData;

    try {
      setLoading(true);
      if (type === 'expense') {
        await addExpense({
          amount,
          merchant,
          category,
          date,
          source: 'import',
          note: 'Inbox SMS/Email'
        });
        setToast({ show: true, message: `📱 Verified & Saved: ${amount} @ ${merchant}`, type: 'success' });
      } else {
        await addIncome({
          amount,
          source: merchant,
          category: incomeCategory,
          frequency: 'one_time',
          date,
          note: 'Inbox SMS/Email',
          entrySource: 'import'
        });
        setToast({ show: true, message: `📱 Verified & Saved Income: ${amount} @ ${merchant}`, type: 'success' });
      }

      // Reset
      setShowSmsModal(false);
      setVerifiedSmsData(null);
      setRawSmsInput('');
      setInputText('');
      setDetectedCategory('other');
      setEntrySource('manual');
    } catch (err) {
      console.error('Failed to save verified entry:', err);
      setToast({ show: true, message: 'Failed to save entry. Please try again.', type: 'error' });
    } finally {
      setLoading(false);
    }
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

        {/* Scanned Receipt Review (editable fields) */}
        {entrySource === 'receipt' && (scannedAmount !== '' || scannedMerchant !== '') ? (
          <div className="mb-6 bg-amber-400/5 border border-amber-400/30 rounded-2xl p-4 space-y-3 animate-in fade-in" data-testid="scanned-receipt-card">
            <div className="flex items-center gap-2 text-amber-400 font-medium text-xs uppercase tracking-wider">
              <Camera className="w-4 h-4" />
              <span>{'Scanned Receipt — review & save'}</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-white/50 tracking-wider">{'Amount'}</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={scannedAmount}
                  onChange={(e) => setScannedAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white placeholder-white/30 text-sm focus:outline-none focus:border-amber-400/50"
                  data-testid="scanned-amount-input"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-white/50 tracking-wider">{'Date'}</label>
                <input
                  type="date"
                  value={scannedDate}
                  onChange={(e) => setScannedDate(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-400/50"
                  data-testid="scanned-date-input"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-white/50 tracking-wider">{'Merchant'}</label>
              <input
                type="text"
                value={scannedMerchant}
                onChange={(e) => setScannedMerchant(e.target.value)}
                placeholder="Merchant name"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white placeholder-white/30 text-sm focus:outline-none focus:border-amber-400/50"
                data-testid="scanned-merchant-input"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-white/50 tracking-wider">{'Category'}</label>
              <select
                value={scannedCategory}
                onChange={(e) => setScannedCategory(e.target.value as ExpenseCategory)}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none focus:border-amber-400/50 text-white outline-none"
                data-testid="scanned-category-select"
              >
                {['food', 'transport', 'shopping', 'utilities', 'entertainment', 'medical', 'housing', 'personal', 'education', 'income', 'other'].map((c) => (
                  <option key={c} value={c} className="bg-[#0a0a0a]">{c}</option>
                ))}
              </select>
            </div>

            <Button
              variant="primary"
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-bold"
              onClick={handleSaveScannedReceipt}
              isLoading={loading}
              data-testid="save-scanned-receipt-btn"
            >
              <Save className="w-4 h-4 text-slate-950" />
              <span>{'Save Scanned Receipt'}</span>
            </Button>
          </div>
        ) : null}

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

      {/* Paste / Select SMS & Email Modal */}
      {showSmsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-sm bg-neutral-900 border border-sky-500/30 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto" data-testid="paste-sms-modal">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sky-400">
                <MessageSquare className="w-5 h-5" />
                <h3 className="text-sm font-bold text-white">
                  {l.pasteSmsTitle}
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowSmsModal(false);
                  setVerifiedSmsData(null);
                }}
                className="text-white/40 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick-Select Sample Bank Notifications */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-sky-400/80 tracking-wider">
                {'Select Recent Message / Notification:'}
              </label>
              <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto pr-1">
                {sampleNotifications.map((sample, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setRawSmsInput(sample);
                      handleScrapeSms(sample);
                    }}
                    className="text-left text-xs bg-white/5 hover:bg-sky-500/20 border border-white/10 hover:border-sky-400/40 rounded-xl p-2.5 text-white/80 transition-all"
                  >
                    {sample}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Paste Text Area */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-white/50 tracking-wider">
                {'Or Paste Message / Email Text:'}
              </label>
              <textarea
                value={rawSmsInput}
                onChange={(e) => setRawSmsInput(e.target.value)}
                placeholder={l.pasteSmsPlaceholder}
                rows={3}
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-3 text-xs text-white placeholder-white/30 focus:outline-none focus:border-sky-400/50"
                data-testid="sms-text-input"
              />
            </div>

            {/* AI Scrape & Extract Button */}
            <Button
              variant="secondary"
              className="w-full py-2.5 rounded-xl text-xs font-semibold bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/30"
              onClick={() => handleScrapeSms()}
              isLoading={loading}
              data-testid="scrape-sms-btn"
            >
              {'🤖 AI Scrape & Extract Message'}
            </Button>

            {/* Verified Scraped Message Card */}
            {verifiedSmsData && (
              <div className="bg-sky-950/40 border border-sky-400/40 rounded-2xl p-4 space-y-3 animate-in fade-in" data-testid="verified-scraped-card">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-sky-400 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> {'Verified Scraped Message'}
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${verifiedSmsData.type === 'expense' ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
                    {verifiedSmsData.type}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-black/30 p-2 rounded-xl">
                    <span className="text-[10px] text-white/40 block">{'Merchant'}</span>
                    <span className="font-semibold text-white">{verifiedSmsData.merchant}</span>
                  </div>
                  <div className="bg-black/30 p-2 rounded-xl">
                    <span className="text-[10px] text-white/40 block">{'Amount'}</span>
                    <span className="font-bold text-amber-400">${verifiedSmsData.amount.toFixed(2)}</span>
                  </div>
                  <div className="bg-black/30 p-2 rounded-xl">
                    <span className="text-[10px] text-white/40 block">{'Category'}</span>
                    <span className="font-semibold text-white capitalize">{verifiedSmsData.category}</span>
                  </div>
                  <div className="bg-black/30 p-2 rounded-xl">
                    <span className="text-[10px] text-white/40 block">{'Date'}</span>
                    <span className="font-semibold text-white">{verifiedSmsData.date}</span>
                  </div>
                </div>

                <Button
                  variant="primary"
                  className="w-full py-2.5 rounded-xl text-xs font-bold bg-sky-400 hover:bg-sky-300 text-slate-950"
                  onClick={handleConfirmVerifiedSms}
                  isLoading={loading}
                  data-testid="confirm-verified-sms-btn"
                >
                  {'Confirm & Add Expense'}
                </Button>
              </div>
            )}

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => {
                  setShowSmsModal(false);
                  setVerifiedSmsData(null);
                }}
                className="text-xs text-white/50 hover:text-white"
              >
                {l.close}
              </button>
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
