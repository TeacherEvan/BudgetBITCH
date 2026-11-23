import { useState, useCallback, useEffect, useRef } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { preprocessImage } from '../lib/receipt/preprocess';
import { runOcrScan, resetOcrWorker } from '../lib/receipt/ocr-worker';
import { scrapeOffline } from '../lib/receipt/engine-client';
import {
  deleteOfflineDraft,
  getAllOfflineDrafts,
  getOfflineDraft,
  saveOfflineDraft,
  updateOfflineDraft,
  type OfflineReceiptDraft,
} from '../lib/db/stores/receipt-drafts-store';
import { addExpense } from '../lib/db/stores/expenses-store';
import { generateId } from '../lib/db/local-db';
import { categorizeReceipt } from '../../convex/lib/receipt/categorize';
import { mapCategory } from '../lib/receipt/map-category';
import type { ScrapeResult } from '../../convex/lib/receipt/types';
import type { ReceiptLineItem } from '@/lib/types/budget';
import { toISODate } from '@/lib/utils/date';

export function useReceiptScan() {
  const [isScanning, setIsScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [draft, setDraft] = useState<ScrapeResult | null>(null);
  // Mirror of `draft` kept in sync synchronously. The verification sheet awaits
  // an answer and then calls a `confirmDraft` reference captured before the
  // answer landed; reading state there would save the pre-correction draft.
  const draftRef = useRef<ScrapeResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const setDraftSync = useCallback((next: ScrapeResult | null) => {
    draftRef.current = next;
    setDraft(next);
  }, []);

  const scrapeMutation = useMutation(api.receipts.scrape);
  const answerMutation = useMutation(api.receipts.answer);
  const confirmMutation = useMutation(api.receipts.confirm);
  const syncOfflineDraftMutation = useMutation(api.receipts.syncOfflineDraft);
  const isFlushingOfflineDrafts = useRef(false);

  const flushOfflineDrafts = useCallback(async () => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) return;
    if (isFlushingOfflineDrafts.current) return;

    isFlushingOfflineDrafts.current = true;
    try {
      const queuedDrafts = await getAllOfflineDrafts();
      for (const queuedDraft of queuedDrafts) {
        try {
          const syncArgs = {
            clientDraftId: queuedDraft.clientDraftId,
            payload: queuedDraft.payload as OfflineReceiptDraft['payload'],
            ...(queuedDraft.answers ? { answers: queuedDraft.answers } : {}),
            ...(queuedDraft.confirmed !== undefined ? { confirmed: queuedDraft.confirmed } : {}),
          };
          await syncOfflineDraftMutation(syncArgs);
          await deleteOfflineDraft(queuedDraft.clientDraftId);
        } catch (error) {
          // Keep failed drafts queued for the next reconnect attempt, but log for visibility.
          console.error(
            'Failed to sync offline draft; it will remain queued for retry.',
            {
              clientDraftId: queuedDraft.clientDraftId,
              error,
            },
          );
        }
      }
    } finally {
      isFlushingOfflineDrafts.current = false;
    }
  }, [syncOfflineDraftMutation]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const onOnline = () => {
      void flushOfflineDrafts();
    };

    window.addEventListener('online', onOnline);
    window.addEventListener('budgetbitch:flushQueues', onOnline);
    if (typeof navigator === 'undefined' || navigator.onLine) {
      void flushOfflineDrafts();
    }

    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('budgetbitch:flushQueues', onOnline);
    };
  }, [flushOfflineDrafts]);

  // Release the cached Tesseract worker when the component unmounts so it
  // doesn't hold WASM memory / the lang blob across route changes.
  useEffect(() => {
    return () => {
      void resetOcrWorker();
    };
  }, []);

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
          setDraftSync(res as unknown as ScrapeResult);
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
          setDraftSync(offlineRes);
        }
        setProgress(1.0);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
        throw err;
      } finally {
        setIsScanning(false);
      }
    },
    [scrapeMutation, setDraftSync]
  );

  const answerQuestion = useCallback(
    async (answers: Record<string, string>): Promise<void> => {
      const current = draftRef.current;
      if (!current?.draftId) return;
      try {
        if (typeof navigator !== 'undefined' && navigator.onLine) {
          const updated = await answerMutation({
            draftId: current.draftId as Id<'receipts'>,
            answers,
          });
          // Fold into the ref synchronously: a caller awaiting this promise then
          // invoking confirmDraft must see the corrected fields even if React
          // has not re-rendered yet.
          const merged: ScrapeResult = {
            ...current,
            ...updated,
            fields: { ...current.fields, ...(updated.fields ?? {}) },
          };
          draftRef.current = merged;
          setDraft(merged);
        } else {
          const queuedDraft = await getOfflineDraft(current.draftId);
          if (queuedDraft) {
            await updateOfflineDraft(current.draftId, {
              answers: { ...(queuedDraft.answers ?? {}), ...answers },
            });
          }
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
      }
    },
    [answerMutation]
  );

  // Cancel/Skip in the verification sheet: abandon the draft without writing
  // an expense. Offline drafts stay queued for a later explicit action; there
  // is deliberately no confirm mutation here.
  const cancelDraft = useCallback(async (): Promise<void> => {
    draftRef.current = null;
    setDraft(null);
  }, []);

  // Persist the scanned receipt as a real local expense entry, then clear the draft.
  const confirmDraft = useCallback(
    async (
      overrides?: Record<string, string>,
      opts?: { skipLocalAdd?: boolean; draftId?: Id<'receipts'> | string }
    ) => {
      // Read the latest draft from the ref, never from a stale render closure.
      const currentDraft = draftRef.current;
      const targetDraftId = opts?.draftId ?? currentDraft?.draftId ?? null;
      if (!currentDraft && !targetDraftId) return;
      if (!opts?.skipLocalAdd && !currentDraft) return;

      const amount = Number(currentDraft?.fields?.total?.value ?? 0);
      const merchant = String(
        overrides?.merchant ?? currentDraft?.fields?.merchant?.value ?? 'Receipt'
      ).trim() || 'Receipt';
      const rawCategory =
        overrides?.category ?? (currentDraft?.fields?.category?.value as string | undefined);
      const category = categorizeReceipt(merchant, rawCategory);
      const date = currentDraft?.fields?.date?.value
        ? String(currentDraft.fields.date.value)
        : toISODate(new Date());

      const entry = {
        id: generateId(),
        date,
        category,
        merchant,
        amount: Math.round(amount * 100) / 100,
        note: `Receipt scan${targetDraftId ? ` (draft ${targetDraftId})` : ''}`,
        source: 'receipt' as const,
        lineItems: currentDraft?.lineItems?.length
          ? currentDraft.lineItems.map(
              (li): ReceiptLineItem => ({
                description: li.description ?? '',
                amount: Math.round((li.amount ?? 0) * 100) / 100,
                category: mapCategory(li.description),
              })
            )
          : undefined,
      };

      try {
        // Write the local expense first so it lands even if the server confirm fails.
        // Callers that already persisted the expense (e.g. Quick Add's manual Save)
        // pass skipLocalAdd to avoid a duplicate write.
        if (!opts?.skipLocalAdd) {
          await addExpense(entry);
        }

        if (typeof navigator !== 'undefined' && navigator.onLine && targetDraftId) {
          await confirmMutation({
            draftId: targetDraftId as Id<'receipts'>,
            overrides,
          });
        } else if (targetDraftId) {
          const queuedDraft = await getOfflineDraft(targetDraftId);
          if (queuedDraft) {
            await updateOfflineDraft(targetDraftId, { confirmed: true });
          }
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
      } finally {
        // Only an explicit draftId (server-side Tier-1/Tier-2 draft) must not
        // clear a session draft that happens to be in flight.
        if (!opts?.draftId) {
          draftRef.current = null;
          setDraft(null);
        }
      }
    },
    [confirmMutation]
  );

  return {
    isScanning,
    progress,
    draft,
    error,
    scanImage,
    answerQuestion,
    confirmDraft,
    cancelDraft,
  };
}
