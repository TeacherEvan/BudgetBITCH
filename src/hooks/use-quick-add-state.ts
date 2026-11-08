// hooks/use-quick-add-state.ts
'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { useAction } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { useExpenses, useWizardProfile, useIncomes } from '@/hooks/use-local-db';
import { useReceiptScan } from '@/hooks/use-receipt-scan';
import { useInboxPermission } from '@/hooks/use-inbox-permission';
import { parseSMS, getBestCandidate } from '@/lib/sms-parser';
import { repeatExpense } from '@/lib/db/stores/expenses-store';
import { parseManualEntry, findRepeatCandidate } from '@/lib/quick-add/parse-entry';
import { preprocessReceiptImage } from '@/lib/receipt/image-preprocessor';
import { playSuccessChime } from '@/lib/audio/sound-fx';
import { mapCategory, reconcileLineItems } from '@/lib/receipt/map-category';
import type { ExpenseCategory, IncomeCategory, ReceiptLineItem } from '@/lib/types/budget';
import type { VerifiedSmsData } from '@/components/quick-add/sms-paste-modal';
import { useTranslations } from 'next-intl';
import { useHaptic } from '@/hooks/use-haptic';

export type ScanStage =
  | 'idle'
  | 'optimizing'
  | 'ai-vision'
  | 'fallback-gemini'
  | 'client-ocr'
  | 'complete';

export type FieldConfidence = 'high' | 'review';
export type ScanConfidenceMap = {
  amount: FieldConfidence;
  merchant: FieldConfidence;
  date: FieldConfidence;
};

export type QuickAddToast = {
  show: boolean;
  message: string;
  type: 'success' | 'error';
};

export type QuickAddStateRefs = {
  fileInputRef: React.RefObject<HTMLInputElement | null>;
};

export type QuickAddState = {
  // Toggle + manual entry
  isExpense: boolean;
  setIsExpense: (v: boolean) => void;
  inputText: string;
  setInputText: (v: string) => void;
  loading: boolean;
  detectedCategory: ExpenseCategory;
  setDetectedCategory: (v: ExpenseCategory) => void;
  entrySource: 'manual' | 'receipt' | 'import';
  setEntrySource: (v: 'manual' | 'receipt' | 'import') => void;

  // Scanned-receipt review fields
  scannedAmount: string;
  setScannedAmount: (v: string) => void;
  scannedMerchant: string;
  setScannedMerchant: (v: string) => void;
  scannedCategory: ExpenseCategory;
  setScannedCategory: (v: ExpenseCategory) => void;
  scannedDate: string;
  setScannedDate: (v: string) => void;
  scannedTax: string;
  setScannedTax: (v: string) => void;
  scannedCurrency: string;
  setScannedCurrency: (v: string) => void;
  scannedLineItems: ReceiptLineItem[] | undefined;
  setScannedLineItems: (v: ReceiptLineItem[] | undefined) => void;
  repeatCandidate: ReturnType<typeof findRepeatCandidate> | undefined;
  scanStage: ScanStage;
  scanPreviewUrl: string | null;
  scanConfidence: ScanConfidenceMap;

  // Income category
  incomeCategory: IncomeCategory;
  setIncomeCategory: (v: IncomeCategory) => void;

  // Permission + SMS modal
  showPermModal: boolean;
  setShowPermModal: (v: boolean) => void;
  showSmsModal: boolean;
  setShowSmsModal: (v: boolean) => void;
  rememberCheck: boolean;
  setRememberCheck: (v: boolean) => void;
  rawSmsInput: string;
  setRawSmsInput: (v: string) => void;
  verifiedSmsData: VerifiedSmsData | null;
  setVerifiedSmsData: (v: VerifiedSmsData | null) => void;

  toast: QuickAddToast;
  setToast: (v: QuickAddToast) => void;

  fileInputRef: React.RefObject<HTMLInputElement | null>;
  sampleNotifications: string[];

  // Actions
  triggerCamera: () => void;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  handleCapturedFrame?: (blob: Blob) => Promise<void>;
  handleSaveScannedReceipt: () => Promise<void>;
  updateScannedLineItem: (
    idx: number,
    field: 'description' | 'amount' | 'qty',
    value: string | number | undefined,
  ) => void;
  addScannedLineItem: () => void;
  removeScannedLineItem: (idx: number) => void;
  handleRepeatPurchase: () => Promise<void>;
  handleSave: () => Promise<void>;
  handleScrapeSms: (overrideText?: string) => Promise<void>;
  handleConfirmVerifiedSms: () => Promise<void>;
  triggerInboxFeature: () => void;
  handleGrantPermission: () => void;
  handleDenyPermission: () => void;

  // Receipt verify sheet
  answerQuestion: ReturnType<typeof useReceiptScan>['answerQuestion'];
  confirmDraft: ReturnType<typeof useReceiptScan>['confirmDraft'];
  profile: ReturnType<typeof useWizardProfile>['profile'];
  draft: ReturnType<typeof useReceiptScan>['draft'];
};

/**
 * useQuickAddState — encapsulates every piece of Quick Add mutation state and
 * side-effecting handler so the page component stays a thin render surface.
 * Extracted from the 819-line `app/quick-add/page.tsx` as part of the
 * 2026-08-18 codebase-audit de-monolithization (Milestone 3 / Priority 3).
 * Behavior is preserved bit-for-bit; the 17 colocated page tests pin it.
 */
export function useQuickAddState(): QuickAddState {
  const t = useTranslations('quickAdd');
  // Single useExpenses hook subscription feeds both addExpense and existingExpenses
  const { expenses: existingExpenses, add: addExpense } = useExpenses();
  const { add: addIncome } = useIncomes();
  const { profile, save: saveProfile } = useWizardProfile();

  const { draft, scanImage, answerQuestion, confirmDraft } = useReceiptScan();
  const { status: inboxPermStatus, grantPermission, denyPermission } = useInboxPermission();

  // Convex action references are created unconditionally; offline fallback is
  // handled at the call sites below rather than by conditionally invoking hooks.
  const parseMessageAction = useAction(api.receipts.parseMessage);
  const proxyReceiptScan = useAction(api.receipts.proxyReceiptScan);
  const parseReceiptAction = useAction(api.receipts.parseReceipt);

  // Load the pending bot-ingested (LINE / TeacherBOY) receipt draft so the
  // scraped amount/merchant surface on Quick Add without hunting the dashboard.
  // The bot writes drafts to Convex (status: 'draft', source: 'line').
  const botDrafts = useQuery(api.receipts.listReceipts, {
    source: 'line',
    status: 'draft',
    limit: 1,
  });
  const confirmBotDraft = useMutation(api.receipts.confirm);
  const [botDraftId, setBotDraftId] = useState<Id<'receipts'> | null>(null);

  const haptic = useHaptic();
  const [scanStage, setScanStage] = useState<ScanStage>('idle');
  const [scanPreviewUrl, setScanPreviewUrl] = useState<string | null>(null);

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
  const [scannedTax, setScannedTax] = useState('');
  const [scannedCurrency, setScannedCurrency] = useState('');
  const [scannedLineItems, setScannedLineItems] = useState<ReceiptLineItem[] | undefined>(undefined);

  // Dirty guards: track which scanned fields the user has edited so the
  // bot-draft effect never clobbers them on realtime ticks.
  const dirtyFields = useRef<Set<string>>(new Set());
  const isSaving = useRef(false);

  // Wrapper setters that mark fields as dirty when user edits them
  const setScannedAmountDirty = (v: string) => {
    dirtyFields.current.add('scannedAmount');
    setScannedAmount(v);
  };
  const setScannedMerchantDirty = (v: string) => {
    dirtyFields.current.add('scannedMerchant');
    setScannedMerchant(v);
  };
  const setScannedCategoryDirty = (v: ExpenseCategory) => {
    dirtyFields.current.add('scannedCategory');
    setScannedCategory(v);
  };
  const setScannedDateDirty = (v: string) => {
    dirtyFields.current.add('scannedDate');
    setScannedDate(v);
  };
  const setScannedTaxDirty = (v: string) => {
    dirtyFields.current.add('scannedTax');
    setScannedTax(v);
  };
  const setScannedCurrencyDirty = (v: string) => {
    dirtyFields.current.add('scannedCurrency');
    setScannedCurrency(v);
  };
  const setScannedLineItemsDirty = (v: ReceiptLineItem[] | undefined) => {
    dirtyFields.current.add('scannedLineItems');
    setScannedLineItems(v);
  };
  const setInputTextDirty = (v: string) => {
    dirtyFields.current.add('inputText');
    setInputText(v);
  };

  // Permission & SMS Modal States
  const [showPermModal, setShowPermModal] = useState(false);
  const [showSmsModal, setShowSmsModal] = useState(false);
  const [rememberCheck, setRememberCheck] = useState(true);
  const [rawSmsInput, setRawSmsInput] = useState('');
  const [verifiedSmsData, setVerifiedSmsData] = useState<VerifiedSmsData | null>(null);

  const [toast, setToast] = useState<QuickAddToast>({ show: false, message: '', type: 'success' });

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
        setToast((prev) => ({ ...prev, show: false }));
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
      // Dirty guard: only populate if user hasn't edited the field
      const isDirty = dirtyFields.current;
      if (!isDirty.has('scannedAmount')) {
        setScannedAmount(amtVal > 0 ? String(amtVal) : '');
      }
      if (!isDirty.has('scannedMerchant')) {
        setScannedMerchant(merchVal);
      }
      if (!isDirty.has('scannedCategory')) {
        setScannedCategory((catVal as ExpenseCategory) ?? 'other');
      }
      if (!isDirty.has('scannedDate')) {
        setScannedDate(dateVal);
      }
      if (!isDirty.has('scannedCurrency')) {
        setScannedCurrency(String(draft.fields.currency?.value ?? ''));
      }

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
        ...(Number.isFinite(li.unitPrice)
          ? { unitPrice: Math.round((Number(li.unitPrice) || 0) * 100) / 100 }
          : {}),
      }));
      if (!isDirty.has('scannedLineItems')) {
        setScannedLineItems(mappedItems.length > 0 ? mappedItems : undefined);
      }

      // Pre-fill the combined amount+merchant input so the user can still edit
      // the free-text field if they prefer that path.
      const prefill = [amtVal > 0 ? String(amtVal) : '', merchVal].filter(Boolean).join(' ').trim();
      if (!isDirty.has('inputText')) {
        setInputText(prefill);
      }

      if (amtVal > 0 || merchVal) {
        setToast({
          show: true,
          message: `📸 Photo scanned${merchVal ? `: ${merchVal}` : ''}. Review the fields, then press Save.`,
          type: 'success',
        });
      } else {
        setToast({
          show: true,
          message: '📸 Photo scanned but no details found. Type the amount to save.',
          type: 'success',
        });
      }
    }
  }, [draft]);

  // Surface a bot-ingested (LINE / TeacherBOY) draft on Quick Add. The bot
  // writes drafts to Convex; load the latest pending one and fill the scanned
  // review fields so the scraped amount/merchant are visible and editable.
  // Skips if the user scanned a receipt in this session (local `draft` wins).
  // Dirty guard: never overwrite fields the user has edited.
  useEffect(() => {
    if (draft) return; // session scan takes precedence
    const bot = botDrafts?.receipts?.[0];
    if (!bot) {
      if (botDraftId) setBotDraftId(null);
      return;
    }

    // Only set botDraftId if it's a new draft (different _id)
    if (botDraftId !== bot._id) {
      setBotDraftId(bot._id as Id<'receipts'>);
    }

    // Populate fields only if user hasn't edited them (dirty guard)
    const isDirty = dirtyFields.current;

    if (!isDirty.has('scannedAmount')) {
      setScannedAmount(bot.amount ? String(bot.amount) : '');
    }
    if (!isDirty.has('scannedMerchant')) {
      setScannedMerchant(String(bot.merchant ?? ''));
    }
    if (!isDirty.has('scannedCategory')) {
      setScannedCategory((bot.category as ExpenseCategory) ?? 'other');
    }
    if (!isDirty.has('scannedLineItems')) {
      setScannedLineItems(
        Array.isArray(bot.lineItems)
          ? (bot.lineItems as Array<{ description?: string; amount?: number }>).map((li) => ({
              description: String(li.description ?? ''),
              amount: Math.round((Number(li.amount) || 0) * 100) / 100,
              category: mapCategory(li.description),
            }))
          : undefined,
      );
    }
    if (!isDirty.has('scannedDate')) {
      setScannedDate(
        bot.date
          ? String(bot.date)
          : new Date(bot._creationTime ?? Date.now()).toISOString().split('T')[0],
      );
    }
    if (!isDirty.has('scannedCurrency')) {
      setScannedCurrency(String(bot.currency ?? ''));
    }
    if (bot.amount && !isDirty.has('inputText')) {
      setInputText(`${bot.amount} ${bot.merchant ?? ''}`.trim());
    }

    setIsExpense(true);
    setEntrySource('receipt');
    // Intentionally omit botDraftId: it is derived from bot._id inside,
    // and adding it would re-trigger the effect on every realtime tick.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft, botDrafts]);

  // Persist the reviewed receipt fields. We fill the shared form state and reuse
  // the manual Save path so there is exactly one write into the expense store.
  // FIX: confirm-then-local-add with re-entry guard to prevent duplicate writes
  // on double-click or retry-after-failure.
  const handleSaveScannedReceipt = async () => {
    const amtVal = parseFloat(scannedAmount);
    if (!Number.isFinite(amtVal) || amtVal <= 0) {
      setToast({ show: true, message: 'Please enter a valid amount', type: 'error' });
      return;
    }
    
    // Re-entry guard: prevent double-save on rapid clicks
    if (isSaving.current) return;
    isSaving.current = true;
    
    try {
      setLoading(true);
      const date = scannedDate || new Date().toISOString().split('T')[0];
      const roundedAmount = Math.round(amtVal * 100) / 100;
      // Only persist an itemization that reconciles with the reviewed total —
      // a half-parsed item set would misreport per-category spend downstream.
      const trustedItems = reconcileLineItems(scannedLineItems, roundedAmount);
      
      // FIX: Confirm bot draft FIRST, then add local expense
      // This ensures atomicity: if confirm fails, we don't create a local expense
      // that would become a duplicate on retry.
      if (botDraftId) {
        // Confirm the bot-ingested Convex draft (idempotent; flips status to
        // confirmed and stores the reviewed overrides).
        await confirmBotDraft({
          draftId: botDraftId,
          overrides: {
            amount: roundedAmount,
            merchant: scannedMerchant.trim() || 'Photo Receipt',
            category: scannedCategory,
            date,
          },
        });
        // Only add local expense AFTER successful confirm
        await addExpense({
          amount: roundedAmount,
          merchant: scannedMerchant.trim() || 'Photo Receipt',
          category: scannedCategory,
          date,
          source: 'receipt',
          note: 'Scanned receipt photo',
          lineItems: trustedItems,
          tax: scannedTax ? parseFloat(scannedTax) || undefined : undefined,
        });
        setBotDraftId(null);
      } else {
        // Session scan path: confirm first, then local add (skipLocalAdd
        // means confirmDraft will not write the local expense itself).
        await confirmDraft(undefined, { skipLocalAdd: true });
        await addExpense({
          amount: roundedAmount,
          merchant: scannedMerchant.trim() || 'Photo Receipt',
          category: scannedCategory,
          date,
          source: 'receipt',
          note: 'Scanned receipt photo',
          lineItems: trustedItems,
          tax: scannedTax ? parseFloat(scannedTax) || undefined : undefined,
        });
      }
      
      setToast({
        show: true,
        message: `📸 Saved receipt: ${amtVal} @ ${scannedMerchant || 'Photo Receipt'}`,
        type: 'success',
      });
      setScanStage('idle');
      setScanPreviewUrl(null);
      haptic.trigger('success');
      playSuccessChime();
      setScannedAmount('');
      setScannedMerchant('');
      setScannedDate('');
      setScannedTax('');
      setScannedCurrency('');
      setScannedLineItems(undefined);
      setInputText('');
      setDetectedCategory('other');
      setEntrySource('manual');
      // Clear dirty fields on successful save
      dirtyFields.current.clear();
    } catch (err) {
      console.error('Failed to save scanned receipt:', err);
      haptic.trigger('error');
      setToast({
        show: true,
        message: `Failed to save: ${err instanceof Error ? err.message : String(err)}`,
        type: 'error',
      });
      // On confirm failure, botDraftId is preserved so user can retry
    } finally {
      setLoading(false);
      isSaving.current = false;
    }
  };

  // Update one editable line item in the scanned receipt review card.
  // Marks line items dirty so realtime bot/session drafts can't clobber edits.
  const updateScannedLineItem = (
    idx: number,
    field: 'description' | 'amount' | 'qty',
    value: string | number | undefined,
  ) => {
    dirtyFields.current.add('scannedLineItems');
    setScannedLineItems((prev) => prev?.map((item, i) => (i === idx ? { ...item, [field]: value } : item)));
  };

  const addScannedLineItem = () => {
    dirtyFields.current.add('scannedLineItems');
    haptic.trigger('selection');
    setScannedLineItems((prev) => [
      ...(prev ?? []),
      { description: '', amount: 0, category: scannedCategory, qty: 1 },
    ]);
  };

  const removeScannedLineItem = (idx: number) => {
    dirtyFields.current.add('scannedLineItems');
    haptic.trigger('light');
    setScannedLineItems((prev) => {
      if (!prev) return undefined;
      const next = prev.filter((_, i) => i !== idx);
      return next.length > 0 ? next : undefined;
    });
  };

  const scanConfidence = useMemo<ScanConfidenceMap>(() => {
    const amtNum = parseFloat(scannedAmount);
    return {
      amount: Number.isFinite(amtNum) && amtNum > 0 ? 'high' : 'review',
      merchant: scannedMerchant.trim().length >= 2 ? 'high' : 'review',
      date: /^\d{4}-\d{2}-\d{2}$/.test(scannedDate.trim()) ? 'high' : 'review',
    };
  }, [scannedAmount, scannedMerchant, scannedDate]);

  // Repeat Purchase "+" on the review card: the most recent prior expense
  // with the same merchant (case-insensitive) as the scanned receipt.
  const repeatCandidate = useMemo(() => {
    if (entrySource !== 'receipt') return undefined;
    return findRepeatCandidate(existingExpenses, scannedMerchant);
  }, [entrySource, scannedMerchant, existingExpenses]);

  // One-tap repeat of the matched purchase. Independent of Save: the review
  // card stays open so the user can still save the (edited) scan as new.
  const handleRepeatPurchase = async () => {
    if (!repeatCandidate) return;
    try {
      setLoading(true);
      const clone = await repeatExpense(repeatCandidate.id);
      if (clone) {
        setToast({
          show: true,
          message: `🔁 Repeated: ${clone.merchant} — ${clone.amount}`,
          type: 'success',
        });
      }
    } catch (err) {
      console.error('Repeat purchase failed:', err);
      setToast({
        show: true,
        message: `Repeat failed: ${err instanceof Error ? err.message : String(err)}`,
        type: 'error',
      });
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
    const { amount: amountVal, note: noteVal } = parseManualEntry(trimmed);

    try {
      setLoading(true);
      if (isExpense) {
        // Record Expense
        await addExpense({
          amount: amountVal,
          merchant: noteVal || 'Quick Expense',
          category: detectedCategory,
          date: new Date().toISOString().split('T')[0],
          source: entrySource,
          note: noteVal || undefined,
          lineItems: entrySource === 'receipt' ? scannedLineItems : undefined,
        });
        setToast({ show: true, message: t('successAdded'), type: 'success' });
        haptic.trigger('success');
        playSuccessChime();
      } else {
        // Record Income Log
        await addIncome({
          amount: amountVal,
          source: noteVal || 'Quick Income',
          category: incomeCategory,
          frequency: 'one_time',
          date: new Date().toISOString().split('T')[0],
          note: noteVal || undefined,
          entrySource: entrySource === 'import' ? 'import' : 'manual',
        });

        // Seed profile baseline monthly income only if currently unset/0 (prevents cumulative drift on one-time bonuses)
        if (profile && (!profile.answers?.income || profile.answers.income === 0)) {
          await saveProfile({
            ...profile,
            answers: {
              ...profile.answers,
              income: amountVal,
            },
          });
        }
        setToast({ show: true, message: t('successIncome'), type: 'success' });
      }

      // Reset form
      setInputText('');
      setDetectedCategory('other');
      setEntrySource('manual');
    } catch (err) {
      console.error(err);
      setToast({
        show: true,
        message: `Failed to record entry! ${err instanceof Error ? err.message : String(err)}`,
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  // Trigger camera file picker
  const triggerCamera = () => {
    fileInputRef.current?.click();
  };

  // Process raw receipt image blob (shared between file picker and camera frame grab)
  const processReceiptBlob = async (blob: Blob) => {
    haptic.trigger('light');
    setScanStage('optimizing');
    setLoading(true);
    setToast({ show: true, message: 'Scanning & scraping receipt photo...', type: 'success' });

    let workingBlob = blob;
    let previewUrl = '';

    // Apply adaptive contrast & dimension clamping preprocessor (max 1600px)
    try {
      const preprocessed = await preprocessReceiptImage(blob, {
        maxDimension: 1600,
        enhanceContrast: true,
      });
      workingBlob = preprocessed.processedBlob;
      previewUrl = preprocessed.previewUrl;
      setScanPreviewUrl(previewUrl);
    } catch (prepErr) {
      console.warn('Preprocessing failed, falling back to original blob:', prepErr);
      previewUrl = typeof URL !== 'undefined' && URL.createObjectURL ? URL.createObjectURL(blob) : '';
      setScanPreviewUrl(previewUrl);
    }

    const reader = new FileReader();
    reader.onerror = () => {
      setLoading(false);
      setScanStage('idle');
      haptic.trigger('error');
      setToast({
        show: true,
        message: 'Failed to read image data. Please try again or enter manually.',
        type: 'error',
      });
      if (fileInputRef.current) fileInputRef.current.value = '';
    };

    reader.onload = async () => {
      const dataUrl = reader.result as string;

      // Tier 1: send the photo to the TeacherBOY HuggingFace bot via the
      // Convex proxy (Gemini vision scrape). The proxy keeps CONVEX_SYNC_SECRET
      // server-side and the user is derived from the Convex Auth session.
      if (proxyReceiptScan && typeof navigator !== 'undefined' && navigator.onLine) {
        try {
          setScanStage('ai-vision');
          const res = await proxyReceiptScan({
            base64Image: dataUrl,
            idempotencyKey: `app_${crypto.randomUUID()}`,
            countryHint: profile?.locale?.includes('TH') ? 'TH' : profile?.locale?.includes('ZA') ? 'ZA' : undefined,
          });

          const fields = (res as { fields?: Record<string, { value?: unknown } | null> }).fields;
          if (res && fields) {
            setIsExpense(true);
            setEntrySource('receipt');
            const parsedTotal = (fields.total?.value as number) ?? '';
            setScannedAmount(String(parsedTotal));
            setScannedMerchant(String((fields.merchant?.value as string) ?? ''));
            setScannedCategory(mapCategory(String((fields.category?.value as string) ?? 'other')));
            setScannedDate(
              fields.date?.value != null ? String(fields.date.value) : new Date().toISOString().split('T')[0],
            );
            setScannedTax(fields.tax?.value != null ? String(fields.tax.value) : '');
            setScannedCurrency(fields.currency?.value != null ? String(fields.currency.value) : '');

            const items = Array.isArray((res as unknown as { lineItems?: unknown }).lineItems)
              ? (res as unknown as { lineItems: Array<{ description?: string; amount?: number; qty?: number; unit_price?: number }> })
                  .lineItems
              : [];
            const mappedItems: ReceiptLineItem[] = items.map((li) => ({
              description: String(li.description ?? ''),
              amount: Math.round((Number(li.amount) || 0) * 100) / 100,
              category: mapCategory(li.description),
              ...(Number.isFinite(li.qty) ? { qty: Number(li.qty) } : {}),
              ...(Number.isFinite(li.unit_price) ? { unitPrice: Number(li.unit_price) } : {}),
            }));
            setScannedLineItems(mappedItems.length > 0 ? mappedItems : undefined);

            const prefill = [
              String((fields.total?.value as number) ?? ''),
              String((fields.merchant?.value as string) ?? ''),
            ]
              .filter(Boolean)
              .join(' ')
              .trim();
            setInputText(prefill);

            setToast({
              show: true,
              message: `📸 Scanned: ${String((fields.merchant?.value as string) ?? 'Receipt')} — review & save`,
              type: 'success',
            });
            setScanStage('complete');
            haptic.trigger('success');
            setLoading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
          }
        } catch (botErr) {
          console.warn('HF bot scan failed, attempting Tier 2 direct Gemini parseReceipt:', botErr);
        }
      }

      // Tier 2: Direct Gemini 2.5 Flash parseReceipt fallback (if bot is unconfigured/asleep)
      if (parseReceiptAction && typeof navigator !== 'undefined' && navigator.onLine) {
        try {
          setScanStage('fallback-gemini');
          const directRes = await parseReceiptAction({ base64Image: dataUrl });
          if (directRes) {
            setIsExpense(true);
            setEntrySource('receipt');
            const totalAmt = directRes.amount > 0 ? String(directRes.amount) : '';
            setScannedAmount(totalAmt);
            setScannedMerchant(directRes.merchant || '');
            setScannedCategory(mapCategory(directRes.category || 'other'));
            setScannedDate(directRes.date || new Date().toISOString().split('T')[0]);
            setScannedTax('');
            setScannedCurrency((directRes as { currency?: string }).currency || '');

            const rawItems = Array.isArray(directRes.lineItems) ? directRes.lineItems : [];
            const mappedItems: ReceiptLineItem[] = rawItems.map((li) => ({
              description: String(li.description ?? ''),
              amount: Math.round((Number(li.amount) || 0) * 100) / 100,
              category: mapCategory(li.description),
            }));
            setScannedLineItems(mappedItems.length > 0 ? mappedItems : undefined);

            const prefill = [totalAmt, directRes.merchant].filter(Boolean).join(' ').trim();
            setInputText(prefill);

            setToast({
              show: true,
              message: `📸 Scanned: ${directRes.merchant || 'Receipt'} — review & save`,
              type: 'success',
            });
            setScanStage('complete');
            haptic.trigger('success');
            setLoading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
          }
        } catch (geminiErr) {
          console.warn('Direct Gemini parseReceipt failed, falling back to Tier 3 client OCR:', geminiErr);
        }
      }

      // Tier 3 Fallback: Client-side OCR + Pattern Scraper Engine
      const img = new Image();
      const objectUrl = URL.createObjectURL(workingBlob);
      img.onload = async () => {
        try {
          setScanStage('client-ocr');
          await scanImage(img, profile?.locale?.includes('TH') ? 'TH' : profile?.locale?.includes('ZA') ? 'ZA' : undefined);
          setIsExpense(true);
          setEntrySource('receipt');
          setScanStage('complete');
          haptic.trigger('success');
        } catch (err) {
          console.error('Receipt scanning failed:', err);
          setIsExpense(true);
          setEntrySource('receipt');
          setScanStage('idle');
          haptic.trigger('error');
          setToast({
            show: true,
            message:
              (err instanceof Error ? err.message : String(err)) ||
              'Failed to process receipt image. Please enter manually.',
            type: 'error',
          });
        } finally {
          setLoading(false);
          URL.revokeObjectURL(objectUrl);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      };
      img.onerror = () => {
        setLoading(false);
        setScanStage('idle');
        haptic.trigger('error');
        URL.revokeObjectURL(objectUrl);
        if (fileInputRef.current) fileInputRef.current.value = '';
        setToast({
          show: true,
          message: 'Could not decode receipt image. Please select a valid photo file (JPEG or PNG).',
          type: 'error',
        });
      };
      img.src = objectUrl;
    };

    reader.readAsDataURL(workingBlob);
  };

  // Process captured receipt image from file input
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      haptic.trigger('error');
      setToast({ show: true, message: 'Please select a valid image file.', type: 'error' });
      return;
    }

    await processReceiptBlob(file);
  };

  // Process frame snapshot from live camera viewfinder
  const handleCapturedFrame = async (blob: Blob) => {
    await processReceiptBlob(blob);
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
          note: 'Inbox SMS/Email',
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
          entrySource: 'import',
        });
        setToast({
          show: true,
          message: `📱 Verified & Saved Income: ${amount} @ ${merchant}`,
          type: 'success',
        });
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

  return {
    isExpense,
    setIsExpense,
    inputText,
    setInputText: setInputTextDirty,
    loading,
    detectedCategory,
    setDetectedCategory,
    entrySource,
    setEntrySource,
    scannedAmount,
    setScannedAmount: setScannedAmountDirty,
    scannedMerchant,
    setScannedMerchant: setScannedMerchantDirty,
    scannedCategory,
    setScannedCategory: setScannedCategoryDirty,
    scannedDate,
    setScannedDate: setScannedDateDirty,
    scannedTax,
    setScannedTax: setScannedTaxDirty,
    scannedCurrency,
    setScannedCurrency: setScannedCurrencyDirty,
    scannedLineItems,
    setScannedLineItems: setScannedLineItemsDirty,
    repeatCandidate,
    scanStage,
    scanPreviewUrl,
    scanConfidence,
    incomeCategory,
    setIncomeCategory,
    showPermModal,
    setShowPermModal,
    showSmsModal,
    setShowSmsModal,
    rememberCheck,
    setRememberCheck,
    rawSmsInput,
    setRawSmsInput,
    verifiedSmsData,
    setVerifiedSmsData,
    toast,
    setToast,
    fileInputRef,
    sampleNotifications,
    triggerCamera,
    handleFileChange,
    handleCapturedFrame,
    handleSaveScannedReceipt,
    updateScannedLineItem,
    addScannedLineItem,
    removeScannedLineItem,
    handleRepeatPurchase,
    handleSave,
    handleScrapeSms,
    handleConfirmVerifiedSms,
    triggerInboxFeature,
    handleGrantPermission,
    handleDenyPermission,
    answerQuestion,
    confirmDraft,
    draft,
    profile,
  };
}
