'use client';

import { useMemo, useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import type { Doc } from '../../../convex/_generated/dataModel';
import { addExpense } from '@/lib/db/stores/expenses-store';
import { generateId } from '@/lib/db/local-db';

// Canonical category set (mirrors convex/receipts.ts VALID_CATEGORIES +
// src/lib/types/budget ExpenseCategory). Used for the per-item "type" select.
const CATEGORIES = [
  'housing',
  'transport',
  'food',
  'utilities',
  'phone_internet',
  'subscriptions',
  'entertainment',
  'healthcare',
  'insurance',
  'debt',
  'savings',
  'other',
] as const;

type DraftRow = Doc<'receipts'>;

type ReceiptItem = {
  title: string;
  type: string;
  amount: number;
};

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
 * — amount, merchant, category, date, currency, tax AND the itemized lines
 * (title/type/amount) — before saving them as expenses. Each line becomes its
 * own Expense row so it shows up in the Expenses list and the CSV/Excel export;
 * when there are no lines, the receipt total is saved as a single expense.
 * Saving writes the expense(s) locally and confirms the server draft;
 * discarding deletes the server draft.
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
  const [overrides, setOverrides] = useState<
    Record<string, Partial<DraftRow> & { items?: ReceiptItem[] }>
  >({});
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const drafts = useMemo<DraftRow[]>(
    () => draftsResult?.receipts ?? [],
    [draftsResult],
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

  const get = (
    d: DraftRow,
    key: 'amount' | 'merchant' | 'category' | 'date' | 'currency' | 'tax',
  ): string | number | undefined =>
    (overrides[d._id]?.[key] as never) ?? (d[key] as never);

  const set = (
    d: DraftRow,
    key: 'amount' | 'merchant' | 'category' | 'date' | 'currency' | 'tax',
    value: string,
  ) => setOverrides((prev) => ({ ...prev, [d._id]: { ...prev[d._id], [key]: value } }));

  const getItems = (d: DraftRow): ReceiptItem[] =>
    overrides[d._id]?.items ??
    ((d.items as ReceiptItem[] | undefined) ?? []);

  const setItems = (d: DraftRow, items: ReceiptItem[]) =>
    setOverrides((prev) => ({ ...prev, [d._id]: { ...prev[d._id], items } }));

  const updateItem = (
    d: DraftRow,
    idx: number,
    patch: Partial<ReceiptItem>,
  ) => {
    const items = getItems(d).map((it, i) => (i === idx ? { ...it, ...patch } : it));
    setItems(d, items);
  };

  const handleSave = async (d: DraftRow) => {
    setSaving(d._id);
    setError(null);
    try {
      const amount = Number(get(d, 'amount')) || 0;
      const merchant = String(get(d, 'merchant') || 'Unknown Merchant').slice(0, 200);
      const category = normalizeCategory(String(get(d, 'category') || 'other'));
      const date = String(get(d, 'date') || new Date().toISOString().slice(0, 10));
      const currency = get(d, 'currency') ? String(get(d, 'currency')) : undefined;
      const tax = get(d, 'tax') ? Number(get(d, 'tax')) : undefined;
      const items = getItems(d).map((it) => ({
        title: String(it.title || '').slice(0, 200),
        type: normalizeCategory(String(it.type || 'other')),
        amount: Number(it.amount) || 0,
      }));

      // Itemized expenses: one Expense per line so they show in the Expenses
      // list and the CSV/Excel export. Fall back to the receipt total when the
      // bot found no lines.
      const expenseRows =
        items.length > 0
          ? items.map((it) => ({
              id: generateId(),
              date,
              category: it.type as never,
              merchant: it.title || merchant,
              amount: it.amount,
              note: merchant,
              source: 'receipt' as const,
            }))
          : [
              {
                id: generateId(),
                date,
                category: category as never,
                merchant,
                amount,
                note: undefined,
                source: 'receipt' as const,
              },
            ];

      for (const row of expenseRows) {
        await addExpense(row);
      }

      await confirm({
        draftId: d._id,
        overrides: {
          amount,
          merchant,
          category,
          date,
          currency,
          tax,
          items: items.length > 0 ? items : undefined,
        },
      });
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
        {drafts.map((d) => {
          const items = getItems(d);
          return (
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
                    value={get(d, 'amount') ?? ''}
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
                    value={get(d, 'merchant') ?? ''}
                    onChange={(e) => set(d, 'merchant', e.target.value)}
                    className="mt-1 rounded-lg border border-white/10 bg-zinc-950 px-2 py-1.5 text-sm text-white outline-none focus:border-amber-400/50"
                  />
                </label>

                <label className="col-span-2 flex flex-col text-[11px] text-white/50">
                  Category
                  <select
                    value={get(d, 'category') ?? 'other'}
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

                <label className="flex flex-col text-[11px] text-white/50">
                  Currency
                  <input
                    type="text"
                    placeholder="e.g. THB"
                    value={get(d, 'currency') ?? ''}
                    onChange={(e) => set(d, 'currency', e.target.value)}
                    className="mt-1 rounded-lg border border-white/10 bg-zinc-950 px-2 py-1.5 text-sm uppercase text-white outline-none focus:border-amber-400/50"
                  />
                </label>

                <label className="flex flex-col text-[11px] text-white/50">
                  Tax
                  <input
                    type="number"
                    step="0.01"
                    value={get(d, 'tax') ?? ''}
                    onChange={(e) => set(d, 'tax', e.target.value)}
                    className="mt-1 rounded-lg border border-white/10 bg-zinc-950 px-2 py-1.5 text-sm text-white outline-none focus:border-amber-400/50"
                  />
                </label>
              </div>

              {/* Itemized lines: editable title / type / amount */}
              <div className="mt-3">
                <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-white/40">
                  Items {items.length > 0 && `(${items.length})`}
                </p>
                {items.length === 0 ? (
                  <p className="text-[11px] text-white/30">No line items detected — the receipt total will be saved as one expense.</p>
                ) : (
                  <ul className="space-y-2">
                    {items.map((it, idx) => (
                      <li key={idx} className="rounded-lg border border-white/10 bg-zinc-950/60 p-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] uppercase tracking-wide text-white/30">Item {idx + 1}</span>
                          <span className="text-[10px] text-white/30">
                            {normalizeCategory(String(it.type || 'other'))}
                          </span>
                        </div>
                        <input
                          type="text"
                          placeholder="Title"
                          value={it.title}
                          onChange={(e) => updateItem(d, idx, { title: e.target.value })}
                          className="mt-1 w-full rounded-lg border border-white/10 bg-zinc-950 px-2 py-1.5 text-sm text-white outline-none focus:border-amber-400/50"
                        />
                        <div className="mt-1 grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            placeholder="Type"
                            value={it.type}
                            onChange={(e) => updateItem(d, idx, { type: e.target.value })}
                            className="rounded-lg border border-white/10 bg-zinc-950 px-2 py-1.5 text-sm text-white outline-none focus:border-amber-400/50"
                          />
                          <input
                            type="number"
                            step="0.01"
                            placeholder="Amount"
                            value={it.amount}
                            onChange={(e) => updateItem(d, idx, { amount: Number(e.target.value) })}
                            className="rounded-lg border border-white/10 bg-zinc-950 px-2 py-1.5 text-sm text-white outline-none focus:border-amber-400/50"
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
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
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {Array.isArray(d.lineItems) && d.lineItems.length > 0 && (
              <div className="mt-3 rounded-lg border border-white/10 bg-zinc-950/60 p-2">
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-white/40">
                  Items ({d.lineItems.length})
                </p>
                <ul className="space-y-1">
                  {d.lineItems.map((li, i) => {
                    const desc = String((li as { description?: string }).description ?? '');
                    const amt = Number((li as { amount?: number }).amount ?? 0);
                    const cat = normalizeCategory(String((li as { category?: string }).category ?? 'other'));
                    return (
                      <li key={i} className="flex items-center justify-between gap-2 text-[11px] text-white/70">
                        <span className="truncate">{desc || 'Item'}</span>
                        <span className="flex shrink-0 items-center gap-2">
                          <span className="rounded bg-white/5 px-1.5 py-0.5 text-[9px] uppercase text-amber-300/80">{cat}</span>
                          <span className="tabular-nums">{amt.toFixed(2)}</span>
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

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
