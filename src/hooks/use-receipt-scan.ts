import { useState, useCallback } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { preprocessImage } from '../lib/receipt/preprocess';
import { runOcrScan } from '../lib/receipt/ocr-worker';
import { scrapeOffline } from '../lib/receipt/engine-client';
import { saveOfflineDraft } from '../lib/db/stores/receipt-drafts-store';
import { addExpense } from '../lib/db/stores/expenses-store';
import { generateId } from '../lib/db/local-db';
import { categorizeReceipt } from '../../convex/lib/receipt/categorize';
import type { ScrapeResult } from '../../convex/lib/receipt/types';

export function useReceiptScan() {
  const [isScanning, setIsScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [draft, setDraft] = useState<ScrapeResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const scrapeMutation = useMutation(api.receipts.scrape);
  const answerMutation = useMutation(api.receipts.answer);
  const confirmMutation = useMutation(api.receipts.confirm);

  const scanImage = useCallback(
    async (source: HTMLCanvasElement | HTMLImageElement, countryHint?: string) => {
      setIsScanning(true);
      setProgress(0.1);
      setError(null);

      try {
        // 1. Preprocess
        const { canvas } = await preprocessImage(source);
        setProgress(0.3);

        // 2. OCR Worker
        const payload = await runOcrScan(canvas, {
          countryHint,
          onProgress: (p) => setProgress(0.3 + p * 0.4),
        });
        setProgress(0.8);

        // 3. Online or Offline execution
        if (typeof navigator !== 'undefined' && navigator.onLine) {
          const res = await scrapeMutation({ payload });
          setDraft(res as unknown as ScrapeResult);
        } else {
          const offlineRes = scrapeOffline(payload);
          const clientDraftId = crypto.randomUUID();
          offlineRes.draftId = clientDraftId;

          await saveOfflineDraft({
            clientDraftId,
            payload,
            result: offlineRes,
            createdAt: Date.now(),
          });
          setDraft(offlineRes);
        }
        setProgress(1.0);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
      } finally {
        setIsScanning(false);
      }
    },
    [scrapeMutation]
  );

  const answerQuestion = useCallback(
    async (answers: Record<string, string>) => {
      if (!draft?.draftId) return;
      try {
        if (typeof navigator !== 'undefined' && navigator.onLine) {
          const updated = await answerMutation({
            draftId: draft.draftId as Id<'receipts'>,
            answers,
          });
          setDraft((previously) => (previously ? { ...previously, ...updated } : null));
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
      }
    },
    [draft, answerMutation]
  );

  // Persist the scanned receipt as a real local expense entry, then clear the draft.
  const confirmDraft = useCallback(
    async (overrides?: Record<string, string>) => {
      if (!draft) return;
      const amount = Number(draft.fields.total?.value ?? 0);
      const merchant = String(
        overrides?.merchant ?? draft.fields.merchant?.value ?? 'Receipt'
      ).trim() || 'Receipt';
      const rawCategory = overrides?.category ?? (draft.fields.category?.value as string | undefined);
      const category = categorizeReceipt(merchant, rawCategory);
      const date = draft.fields.date?.value
        ? String(draft.fields.date.value)
        : new Date().toISOString().split('T')[0];

      const entry = {
        id: generateId(),
        date,
        category,
        merchant,
        amount: Math.round(amount * 100) / 100,
        note: `Receipt scan${draft.draftId ? ` (draft ${draft.draftId})` : ''}`,
        source: 'receipt' as const,
      };

      try {
        // Write the local expense first so it lands even if the server confirm fails.
        await addExpense(entry);

        if (typeof navigator !== 'undefined' && navigator.onLine && draft.draftId) {
          await confirmMutation({
            draftId: draft.draftId as Id<'receipts'>,
            overrides,
          });
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
      } finally {
        setDraft(null);
      }
    },
    [draft, confirmMutation]
  );

  return {
    isScanning,
    progress,
    draft,
    error,
    scanImage,
    answerQuestion,
    confirmDraft,
  };
}
