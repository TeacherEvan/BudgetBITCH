import { useState, useCallback } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { preprocessImage } from '../lib/receipt/preprocess';
import { runOcrScan } from '../lib/receipt/ocr-worker';
import { scrapeOffline } from '../lib/receipt/engine-client';
import { saveOfflineDraft } from '../lib/db/stores/receipt-drafts-store';
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
          setDraft((prev) => (prev ? { ...prev, ...updated } : null));
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
      }
    },
    [draft, answerMutation]
  );

  const confirmDraft = useCallback(
    async (overrides?: Record<string, string>) => {
      if (!draft?.draftId) return;
      try {
        if (typeof navigator !== 'undefined' && navigator.onLine) {
          await confirmMutation({
            draftId: draft.draftId as Id<'receipts'>,
            overrides,
          });
        }
        setDraft(null);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
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
