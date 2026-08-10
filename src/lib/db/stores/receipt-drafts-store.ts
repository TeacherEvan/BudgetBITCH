import { getDB } from '../local-db';

export type OfflineReceiptDraft = {
  clientDraftId: string;
  payload: unknown;
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
  return db.get('receiptDrafts', clientDraftId);
}

export async function getAllOfflineDrafts(): Promise<OfflineReceiptDraft[]> {
  const db = await getDB();
  return db.getAll('receiptDrafts');
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
