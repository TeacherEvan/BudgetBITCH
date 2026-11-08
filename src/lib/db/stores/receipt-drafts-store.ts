import { getDB } from '../local-db';

export type OcrPayload = {
  lines: Array<{
    text: string;
    conf?: number;
    y?: number;
    words?: unknown[];
  }>;
  width?: number;
  height?: number;
  lang?: string;
  engine?: string;
  capturedAt?: number;
  countryHint?: string | null;
  currencyHint?: string | null;
};

export type OfflineReceiptDraft = {
  clientDraftId: string;
  payload: OcrPayload;
  result: unknown;
  answers?: Record<string, string>;
  confirmed?: boolean;
  createdAt: number;
};

export async function saveOfflineDraft(draft: OfflineReceiptDraft): Promise<void> {
  const db = await getDB();
  await db.put('receiptDrafts', draft, draft.clientDraftId);
}

export async function getOfflineDraft(clientDraftId: string): Promise<OfflineReceiptDraft | undefined> {
  const db = await getDB();
  const draft = await db.get('receiptDrafts', clientDraftId);
  return draft as OfflineReceiptDraft | undefined;
}

export async function getAllOfflineDrafts(): Promise<OfflineReceiptDraft[]> {
  const db = await getDB();
  const drafts = await db.getAll('receiptDrafts');
  return drafts as OfflineReceiptDraft[];
}

export async function updateOfflineDraft(
  clientDraftId: string,
  update: Partial<Omit<OfflineReceiptDraft, 'clientDraftId'>>,
): Promise<void> {
  const existing = await getOfflineDraft(clientDraftId);
  if (!existing) return;

  const db = await getDB();
  await db.put(
    'receiptDrafts',
    { ...existing, ...update, clientDraftId },
    clientDraftId,
  );
}

export async function deleteOfflineDraft(clientDraftId: string): Promise<void> {
  const db = await getDB();
  await db.delete('receiptDrafts', clientDraftId);
}
