'use client';

import { useMemo, useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import type { Doc } from '../../../convex/_generated/dataModel';
import { addExpense } from '@/lib/db/stores/expenses-store';
import { generateId } from '@/lib/db/local-db';

// Canonical category set (mirrors convex/receipts.ts VALID_CATEGORIES).
const CATEGORIES = [
  'food',
  'transport',
  'shopping',
  'utilities',
  'entertainment',
  'medical',
  'housing',
  'personal',
  'education',
  'income',
  'other',
] as const;

type DraftRow = Doc<'receipts'>;

function normalizeCategory(cat: string): string {
  const c = cat.toLowerCase().trim();
  return (CATEGORIES as readonly string[]).includes(c) ? c : 'other';
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Lists receipt drafts pushed by the TeacherBOY / LINE receipt bot (source:
 * "line", status: "draft") and lets the user review/edit the extracted fields
 * before saving them as expenses. Saving writes the expense locally and
 * confirms the server draft; discarding deletes the server draft.
 */
export function ReceiptDraftsList() {
  const draftsResult = useQuery(api.receipts.listReceipts, {
    source: 'line',
    status: 'draft',
    limit: 50,
  });
  const confirm = useMutation(api.receipts.confirm);
  const remove = useMutation(api.receipts.deleteReceipt);

  // Local editable overrides keyed by draft id.
  const [overrides, setOverrides] = useState<Record<string, Partial<DraftRow>>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const drafts = useMemo<DraftRow[]>(
    () => draftsResult?.receipts ?? [],
    [draftsResult]
  );

  if (draftsResult === undefined) {
    return (
      <div className="rounded-2xl border border-white/10 bg-zinc-900/40 p-4 text-sm text-white/50">
        Loading bot receipts…
      </div>
    );
  }

  if (drafts.length === 0) {
    return null; // No bot drafts — render nothing so the dashboard stays clean.
  }

  const get = (d: DraftRow, key: 'amount' | 'merchant' | 'category' | 'date') =>
    (overrides[d._id]?.[key] as never) ?? (d[key] as never);

  const set = (d: DraftRow, key: 'amount' | 'merchant' | 'category' | 'date', value: string) =>
    setOverrides((prev) => ({ ...prev, [d._id]: { ...prev[d._id], [key]: value } }));

  const handleSave = async (d: DraftRow) => {
    setSaving(d._id);
    setError(null);
    try {
      const amount = Number(get(d, 'amount')) || 0;
      const merchant = String(get(d, 'merchant') || 'Unknown Merchant').slice(0, 200);
      const category = normalizeCategory(String(get(d, 'category') || 'other'));
      const date = String(get(d, 'date') || new Date().toISOString().slice(0, 10));

      await addExpense({
        id: generateId(),
        date,
        category: category as never,
        merchant,
        amount,
        source: 'receipt',
      });

      await confirm({ draftId: d._id, overrides: { amount, merchant, category, date } });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save receipt');
    } finally {
      setSaving(null);
    }
  };

  const handleDiscard = async (d: DraftRow) => {
    setSaving(d._id);
    setError(null);
    try {
      await remove({ receiptId: d._id });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to discard receipt');
    } finally {
      setSaving(null);
    }
  };

  return (
    <section className="rounded-2xl border border-amber-400/20 bg-amber-400/5 p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="rounded-full bg-amber-400/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-300">
          From your bot
        </span>
        <h2 className="text-sm font-semibold text-white/90">Receipts to review</h2>
        <span className="text-xs text-white/40">({drafts.length})</span>
      </div>

      {error && (
        <p className="mb-3 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-300">{error}</p>
      )}

      <ul className="space-y-3">
        {drafts.map((d) => (
          <li key={d._id} className="rounded-xl border border-white/10 bg-zinc-900/60 p-3">
            <div className="mb-2 flex items-center justify-between text-[11px] text-white/40">
              <span>{formatDate(d._creationTime)}</span>
              <span className="uppercase tracking-wide">line bot</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <label className="flex flex-col text-[11px] text-white/50">
                Amount
                <input
                  type="number"
                  step="0.01"
                  value={get(d, 'amount')}
                  onChange={(e) => set(d, 'amount', e.target.value)}
                  className="mt-1 rounded-lg border border-white/10 bg-zinc-950 px-2 py-1.5 text-sm text-white outline-none focus:border-amber-400/50"
                />
              </label>

              <label className="flex flex-col text-[11px] text-white/50">
                Date
                <input
                  type="date"
                  value={get(d, 'date') ?? ''}
                  onChange={(e) => set(d, 'date', e.target.value)}
                  className="mt-1 rounded-lg border border-white/10 bg-zinc-950 px-2 py-1.5 text-sm text-white outline-none focus:border-amber-400/50"
                />
              </label>

              <label className="col-span-2 flex flex-col text-[11px] text-white/50">
                Merchant
                <input
                  type="text"
                  value={get(d, 'merchant')}
                  onChange={(e) => set(d, 'merchant', e.target.value)}
                  className="mt-1 rounded-lg border border-white/10 bg-zinc-950 px-2 py-1.5 text-sm text-white outline-none focus:border-amber-400/50"
                />
              </label>

              <label className="col-span-2 flex flex-col text-[11px] text-white/50">
                Category
                <select
                  value={get(d, 'category')}
                  onChange={(e) => set(d, 'category', e.target.value)}
                  className="mt-1 rounded-lg border border-white/10 bg-zinc-950 px-2 py-1.5 text-sm text-white outline-none focus:border-amber-400/50"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => handleSave(d)}
                disabled={saving === d._id}
                className="flex-1 rounded-lg bg-amber-400 px-3 py-1.5 text-xs font-bold text-zinc-950 transition-colors hover:bg-amber-300 disabled:opacity-50"
              >
                {saving === d._id ? 'Saving…' : 'Save expense'}
              </button>
              <button
                type="button"
                onClick={() => handleDiscard(d)}
                disabled={saving === d._id}
                className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-semibold text-white/60 transition-colors hover:border-red-400/40 hover:text-red-300 disabled:opacity-50"
              >
                Discard
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
