// hooks/use-quick-add-state.ts
'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { useAction } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useExpenses, useWizardProfile, useIncomes } from '@/hooks/use-local-db';
import { useReceiptScan } from '@/hooks/use-receipt-scan';
import { useInboxPermission } from '@/hooks/use-inbox-permission';
import { parseSMS, getBestCandidate } from '@/lib/sms-parser';
import { repeatExpense } from '@/lib/db/stores/expenses-store';
import { parseManualEntry, findRepeatCandidate } from '@/lib/quick-add/parse-entry';
import { mapCategory, reconcileLineItems } from '@/lib/receipt/map-category';
import type { ExpenseCategory, IncomeCategory, ReceiptLineItem } from '@/lib/types/budget';
import type { VerifiedSmsData } from '@/components/quick-add/sms-paste-modal';
import { useTranslations } from 'next-intl';

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
  scannedLineItems: ReceiptLineItem[] | undefined;
  setScannedLineItems: (v: ReceiptLineItem[] | undefined) => void;
  repeatCandidate: ReturnType<typeof findRepeatCandidate> | undefined;

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
  handleSaveScannedReceipt: () => Promise<void>;
  updateScannedLineItem: (
    idx: number,
    field: 'description' | 'amount' | 'qty',
    value: string | number | undefined,
  ) => void;
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
  const t = useTranslations('QuickAdd');
  const { add: addExpense } = useExpenses();
  const { add: addIncome } = useIncomes();
  const { profile, save: saveProfile } = useWizardProfile();
  // Existing expenses feed the Repeat Purchase "+" on the scanned-receipt
  // review card: when the scanned merchant matches a prior purchase, offer a
  // one-tap repeat alongside Save. (useExpenses exposes the full list.)
  const { expenses: existingExpenses } = useExpenses();

  const { draft, scanImage, answerQuestion, confirmDraft } = useReceiptScan();
  const { status: inboxPermStatus, grantPermission, denyPermission } = useInboxPermission();

  // Convex action references are created unconditionally; offline fallback is
  // handled at the call sites below rather than by conditionally invoking hooks.
  const parseMessageAction = useAction(api.receipts.parseMessage);
  const proxyReceiptScan = useAction(api.receipts.proxyReceiptScan);

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
  const [scannedTax, setScannedTax] = useState('');
  const [scannedLineItems, setScannedLineItems] = useState<ReceiptLineItem[] | undefined>(undefined);

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
        ...(Number.isFinite(li.unitPrice)
          ? { unitPrice: Math.round((Number(li.unitPrice) || 0) * 100) / 100 }
          : {}),
      }));
      setScannedLineItems(mappedItems.length > 0 ? mappedItems : undefined);

      // Pre-fill the combined amount+merchant input so the user can still edit
      // the free-text field if they prefer that path.
      const prefill = [amtVal > 0 ? String(amtVal) : '', merchVal].filter(Boolean).join(' ').trim();
      setInputText(prefill);

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
        tax: scannedTax ? parseFloat(scannedTax) || undefined : undefined,
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
      setToast({
        show: true,
        message: `📸 Saved receipt: ${amtVal} @ ${scannedMerchant || 'Photo Receipt'}`,
        type: 'success',
      });
      setScannedAmount('');
      setScannedMerchant('');
      setScannedDate('');
      setScannedTax('');
      setScannedLineItems(undefined);
      setInputText('');
      setDetectedCategory('other');
      setEntrySource('manual');
    } catch (err) {
      console.error('Failed to save scanned receipt:', err);
      setToast({
        show: true,
        message: `Failed to save: ${err instanceof Error ? err.message : String(err)}`,
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  // Update one editable line item in the scanned receipt review card.
  const updateScannedLineItem = (
    idx: number,
    field: 'description' | 'amount' | 'qty',
    value: string | number | undefined,
  ) => {
    setScannedLineItems((prev) => prev?.map((item, i) => (i === idx ? { ...item, [field]: value } : item)));
  };

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

        // Also update profile baseline monthly income
        if (profile) {
          const currentIncome = profile.answers?.income || 0;
          await saveProfile({
            ...profile,
            answers: {
              ...profile.answers,
              income: currentIncome + amountVal,
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

  // Process captured receipt image
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setToast({ show: true, message: 'Please select a valid image file.', type: 'error' });
      return;
    }

    setLoading(true);
    setToast({ show: true, message: 'Scanning & scraping receipt photo...', type: 'success' });

    const reader = new FileReader();
    reader.onerror = () => {
      setLoading(false);
      setToast({
        show: true,
        message: 'Failed to read image file. Please try again or enter manually.',
        type: 'error',
      });
      if (fileInputRef.current) fileInputRef.current.value = '';
    };

    reader.onload = async () => {
      const dataUrl = reader.result as string;

      // First attempt: send the photo to the TeacherBOY HuggingFace bot via the
      // Convex proxy (Gemini vision scrape). The proxy keeps CONVEX_SYNC_SECRET
      // server-side and the user is derived from the Convex Auth session.
      if (proxyReceiptScan && typeof navigator !== 'undefined' && navigator.onLine) {
        try {
          const res = await proxyReceiptScan({
            base64Image: dataUrl,
            idempotencyKey: `app_${crypto.randomUUID()}`,
            countryHint: profile?.locale?.includes('TH') ? 'TH' : profile?.locale?.includes('ZA') ? 'ZA' : undefined,
          });

          const fields = (res as { fields?: Record<string, { value?: unknown } | null> }).fields;
          if (res && fields) {
            setIsExpense(true);
            setEntrySource('receipt');
            setScannedAmount(String((fields.total?.value as number) ?? ''));
            setScannedMerchant(String((fields.merchant?.value as string) ?? ''));
            setScannedCategory(mapCategory(String((fields.category?.value as string) ?? 'other')));
            setScannedDate(
              fields.date?.value != null ? String(fields.date.value) : new Date().toISOString().split('T')[0],
            );
            setScannedTax(fields.tax?.value != null ? String(fields.tax.value) : '');

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
            setLoading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
          }
        } catch (botErr) {
          console.warn('HF bot scan failed, falling back to client OCR:', botErr);
        }
      }

      // Fallback: Client-side OCR + Pattern Scraper Engine
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = async () => {
        try {
          await scanImage(img, profile?.locale?.includes('TH') ? 'TH' : profile?.locale?.includes('ZA') ? 'ZA' : undefined);
          setEntrySource('receipt');
        } catch (err) {
          console.error('Receipt scanning failed:', err);
          setToast({
            show: true,
            message:
              (err instanceof Error ? err.message : String(err)) ||
              'Failed to process receipt image. Please enter manually.',
            type: 'error',
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
    setInputText,
    loading,
    detectedCategory,
    setDetectedCategory,
    entrySource,
    setEntrySource,
    scannedAmount,
    setScannedAmount,
    scannedMerchant,
    setScannedMerchant,
    scannedCategory,
    setScannedCategory,
    scannedDate,
    setScannedDate,
    scannedTax,
    setScannedTax,
    scannedLineItems,
    setScannedLineItems,
    repeatCandidate,
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
    handleSaveScannedReceipt,
    updateScannedLineItem,
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
  };
}
