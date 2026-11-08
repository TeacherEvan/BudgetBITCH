'use client';

import { useMemo, useRef, useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import type { Doc } from '../../../convex/_generated/dataModel';
import { addExpense, addExpensesBulk } from '@/lib/db/stores/expenses-store';
import { generateId } from '@/lib/db/local-db';
import { useHaptic } from '@/hooks/use-haptic';
import { playPaperTearSound, playSuccessChime } from '@/lib/audio/sound-fx';
import { Plus, Trash2, CheckCircle2, AlertTriangle } from 'lucide-react';

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
const EMPTY_DRAFTS: DraftRow[] = [];

export function ReceiptDraftsList() {
  const draftsResult = useQuery(api.receipts.listReceipts, {
    source: 'line',
    status: 'draft',
    limit: 50,
  });
  const confirm = useMutation(api.receipts.confirm);
  const remove = useMutation(api.receipts.deleteReceipt);
  const haptic = useHaptic();

  // Local editable overrides keyed by draft id.
  const [overrides, setOverrides] = useState<
    Record<string, Partial<DraftRow> & { items?: ReceiptItem[] }>
  >({});
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inFlightIdsRef = useRef<Set<string>>(new Set());

  const drafts = useMemo<DraftRow[]>(
    () => draftsResult?.receipts ?? EMPTY_DRAFTS,
    [draftsResult],
  );

  if (draftsResult === undefined) {
    return (
      <div className="rounded-2xl border border-[var(--border-neutral)] bg-[var(--surface-layer-1)] p-4 text-sm text-[var(--text-muted)]">
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

  const getItems = (d: DraftRow): ReceiptItem[] => {
    if (overrides[d._id]?.items) {
      return overrides[d._id].items!;
    }
    if (Array.isArray(d.items) && d.items.length > 0) {
      return d.items as ReceiptItem[];
    }
    if (Array.isArray(d.lineItems) && d.lineItems.length > 0) {
      return d.lineItems.map((li) => {
        const itemObj = li as { description?: string; amount?: number; category?: string };
        return {
          title: itemObj.description ?? '',
          type: itemObj.category ?? 'other',
          amount: Number(itemObj.amount) || 0,
        };
      });
    }
    return [];
  };

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

  const addItem = (d: DraftRow) => {
    haptic.trigger('light');
    playPaperTearSound();
    const current = getItems(d);
    setItems(d, [
      ...current,
      {
        title: '',
        type: (get(d, 'category') as string) || 'other',
        amount: 0,
      },
    ]);
  };

  const removeItem = (d: DraftRow, idx: number) => {
    haptic.trigger('heavy');
    playPaperTearSound();
    const current = getItems(d);
    setItems(
      d,
      current.filter((_, i) => i !== idx),
    );
  };

  const getReconciliation = (d: DraftRow, items: ReceiptItem[]) => {
    if (items.length === 0) return null;
    const itemsSum =
      Math.round(
        items.reduce((acc, it) => acc + (Number(it.amount) || 0), 0) * 100
      ) / 100;
    const totalNum = Math.round((Number(get(d, 'amount')) || 0) * 100) / 100;
    const taxNum = Math.round((Number(get(d, 'tax')) || 0) * 100) / 100;
    const matchesTotal =
      totalNum > 0 &&
      (Math.abs(itemsSum - totalNum) <= 0.05 ||
        Math.abs(itemsSum + taxNum - totalNum) <= 0.05);

    return { itemsSum, totalNum, matchesTotal };
  };

  const handleSave = async (d: DraftRow) => {
    if (inFlightIdsRef.current.has(d._id)) return;
    inFlightIdsRef.current.add(d._id);
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

      // Confirm with the server FIRST before committing to local store
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

      if (expenseRows.length === 1) {
        await addExpense(expenseRows[0]);
      } else if (expenseRows.length > 1) {
        await addExpensesBulk(expenseRows);
      }

      haptic.trigger('success');
      playSuccessChime();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save receipt');
    } finally {
      inFlightIdsRef.current.delete(d._id);
      setSaving(null);
    }
  };

  const handleDiscard = async (d: DraftRow) => {
    if (inFlightIdsRef.current.has(d._id)) return;
    inFlightIdsRef.current.add(d._id);
    setSaving(d._id);
    setError(null);
    try {
      await remove({ receiptId: d._id });
      haptic.trigger('warning');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to discard receipt');
    } finally {
      inFlightIdsRef.current.delete(d._id);
      setSaving(null);
    }
  };

  return (
    <section className="rounded-2xl border border-[var(--gold-border-soft)] bg-[var(--surface-layer-1)] p-4 shadow-[var(--specular-top-subtle),var(--shadow-card)] bb-panel-safe">
      <div className="mb-3 flex items-center gap-2">
        <span className="rounded-full bg-[var(--accent)]/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--gold-bright)]">
          From your bot
        </span>
        <h2 className="text-sm font-semibold text-[var(--text-1)]">Receipts to review</h2>
        <span className="text-xs font-mono tabular-nums text-[var(--text-muted)]">({drafts.length})</span>
      </div>

      {error && (
        <p className="mb-3 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-300">{error}</p>
      )}

      <ul className="space-y-6">
        {drafts.map((d) => {
          const items = getItems(d);
          const reconciliation = getReconciliation(d, items);

          return (
            <li
              key={d._id}
              className="relative rounded-xl border-x border-[var(--gold-border-strong)] bg-[var(--surface-layer-2)] px-4 py-4 shadow-[var(--specular-top-subtle),var(--shadow-card)]"
            >
              {/* Top Perforated Sawtooth Thermal Edge */}
              <svg
                aria-hidden="true"
                className="pointer-events-none absolute -top-2 left-0 right-0 h-2 w-full text-[var(--surface-layer-2)]"
                preserveAspectRatio="none"
                viewBox="0 0 120 6"
              >
                <polygon
                  fill="currentColor"
                  points="0,6 5,0 10,6 15,0 20,6 25,0 30,6 35,0 40,6 45,0 50,6 55,0 60,6 65,0 70,6 75,0 80,6 85,0 90,6 95,0 100,6 105,0 110,6 115,0 120,6"
                />
              </svg>

              <div className="mb-2 flex items-center justify-between border-b border-dashed border-[var(--gold-border-soft)] pb-2 text-[11px] text-[var(--text-muted)]">
                <span className="font-mono tabular-nums">{formatDate(d._creationTime)}</span>
                <span className="uppercase tracking-wide">line bot</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <label className="flex flex-col text-[11px] text-[var(--text-muted)]">
                  Amount
                  <input
                    type="number"
                    step="0.01"
                    aria-label="Amount"
                    value={get(d, 'amount') ?? ''}
                    onChange={(e) => set(d, 'amount', e.target.value)}
                    className="mt-1 min-h-[44px] rounded-lg border border-[var(--border-neutral)] bg-[var(--surface-layer-3)] px-2 py-1.5 text-sm text-[var(--text-1)] outline-none focus:border-[var(--gold-bright)] font-mono tabular-nums"
                  />
                </label>

                <label className="flex flex-col text-[11px] text-[var(--text-muted)]">
                  Date
                  <input
                    type="date"
                    aria-label="Date"
                    value={get(d, 'date') ?? ''}
                    onChange={(e) => set(d, 'date', e.target.value)}
                    className="mt-1 min-h-[44px] rounded-lg border border-[var(--border-neutral)] bg-[var(--surface-layer-3)] px-2 py-1.5 text-sm text-[var(--text-1)] outline-none focus:border-[var(--gold-bright)] font-mono tabular-nums"
                  />
                </label>

                <label className="col-span-2 flex flex-col text-[11px] text-[var(--text-muted)]">
                  Merchant
                  <input
                    type="text"
                    aria-label="Merchant"
                    value={get(d, 'merchant') ?? ''}
                    onChange={(e) => set(d, 'merchant', e.target.value)}
                    className="mt-1 min-h-[44px] rounded-lg border border-[var(--border-neutral)] bg-[var(--surface-layer-3)] px-2 py-1.5 text-sm text-[var(--text-1)] outline-none focus:border-[var(--gold-bright)]"
                  />
                </label>

                <label className="col-span-2 flex flex-col text-[11px] text-[var(--text-muted)]">
                  Category
                  <select
                    aria-label="Category"
                    value={get(d, 'category') ?? 'other'}
                    onChange={(e) => set(d, 'category', e.target.value)}
                    className="mt-1 min-h-[44px] rounded-lg border border-[var(--border-neutral)] bg-[var(--surface-layer-3)] px-2 py-1.5 text-sm text-[var(--text-1)] outline-none focus:border-[var(--gold-bright)]"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c} className="bg-[#110D01] text-[var(--text-1)]">
                        {c}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="flex flex-col text-[11px] text-[var(--text-muted)]">
                  Currency
                  <input
                    type="text"
                    placeholder="e.g. THB"
                    value={get(d, 'currency') ?? ''}
                    onChange={(e) => set(d, 'currency', e.target.value)}
                    className="mt-1 min-h-[44px] rounded-lg border border-[var(--border-neutral)] bg-[var(--surface-layer-3)] px-2 py-1.5 text-sm uppercase text-[var(--text-1)] outline-none focus:border-[var(--gold-bright)] font-mono"
                  />
                </label>

                <label className="flex flex-col text-[11px] text-[var(--text-muted)]">
                  Tax
                  <input
                    type="number"
                    step="0.01"
                    value={get(d, 'tax') ?? ''}
                    onChange={(e) => set(d, 'tax', e.target.value)}
                    className="mt-1 min-h-[44px] rounded-lg border border-[var(--border-neutral)] bg-[var(--surface-layer-3)] px-2 py-1.5 text-sm text-[var(--text-1)] outline-none focus:border-[var(--gold-bright)] font-mono tabular-nums"
                  />
                </label>
              </div>

              {/* Itemized lines: editable title / type / amount with reconciliation badge */}
              <div className="mt-3 border-t border-dashed border-[var(--gold-border-soft)] pt-2 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-medium uppercase tracking-wide text-[var(--text-muted)]">
                    Items {items.length > 0 && <span className="font-mono tabular-nums">({items.length})</span>}
                  </span>

                  {reconciliation && (
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-mono tabular-nums font-semibold ${
                        reconciliation.matchesTotal
                          ? 'bg-emerald-500/15 text-[#40C87A] border border-emerald-500/30'
                          : 'bg-amber-500/15 text-[#E8A020] border border-amber-500/30'
                      }`}
                      data-testid={`line-items-reconciliation-badge-${d._id}`}
                    >
                      {reconciliation.matchesTotal ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Reconciled ({reconciliation.itemsSum.toFixed(2)})</span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-3 h-3" />
                          <span>
                            Items {reconciliation.itemsSum.toFixed(2)} / {reconciliation.totalNum.toFixed(2)}
                          </span>
                        </>
                      )}
                    </span>
                  )}
                </div>

                {items.length === 0 ? (
                  <p className="text-[11px] text-[var(--text-muted)]/60">
                    No line items detected — the receipt total will be saved as one expense.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {items.map((it, idx) => (
                      <li
                        key={idx}
                        className="rounded-lg border border-[var(--border-neutral)] bg-[var(--surface-layer-3)] p-2.5 space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">
                            Item {idx + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeItem(d, idx)}
                            aria-label={`Delete item ${idx + 1}`}
                            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-rose-500/10 hover:text-rose-400 transition-colors cursor-pointer"
                            data-testid={`remove-item-btn-${d._id}-${idx}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <input
                          type="text"
                          placeholder="Title"
                          aria-label={`Item ${idx + 1} title`}
                          value={it.title}
                          onChange={(e) => updateItem(d, idx, { title: e.target.value })}
                          className="min-h-[44px] w-full rounded-lg border border-[var(--border-neutral)] bg-[var(--surface-layer-2)] px-2 py-1.5 text-sm text-[var(--text-1)] outline-none focus:border-[var(--gold-bright)]"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            placeholder="Type"
                            aria-label={`Item ${idx + 1} type`}
                            value={it.type}
                            onChange={(e) => updateItem(d, idx, { type: e.target.value })}
                            className="min-h-[44px] rounded-lg border border-[var(--border-neutral)] bg-[var(--surface-layer-2)] px-2 py-1.5 text-sm text-[var(--text-1)] outline-none focus:border-[var(--gold-bright)]"
                          />
                          <input
                            type="number"
                            step="0.01"
                            placeholder="Amount"
                            aria-label={`Item ${idx + 1} amount`}
                            value={it.amount}
                            onChange={(e) => updateItem(d, idx, { amount: Number(e.target.value) })}
                            className="min-h-[44px] rounded-lg border border-[var(--border-neutral)] bg-[var(--surface-layer-2)] px-2 py-1.5 text-sm text-[var(--text-1)] outline-none focus:border-[var(--gold-bright)] font-mono tabular-nums"
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                )}

                <button
                  type="button"
                  onClick={() => addItem(d)}
                  className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg px-2 text-xs font-semibold text-[var(--gold-bright)] hover:bg-[var(--gold-border-soft)] transition-colors cursor-pointer"
                  data-testid={`add-item-btn-${d._id}`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add line item</span>
                </button>
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => handleSave(d)}
                  disabled={saving === d._id}
                  className="flex-1 min-h-[44px] rounded-xl bg-[var(--accent)] px-3 py-1.5 text-xs font-bold text-[var(--accent-ink)] transition-colors hover:brightness-110 active:duration-[25ms] active:translate-y-[1px] active:scale-[0.985] cursor-pointer disabled:opacity-50"
                >
                  {saving === d._id ? 'Saving…' : 'Save expense'}
                </button>
                <button
                  type="button"
                  onClick={() => handleDiscard(d)}
                  disabled={saving === d._id}
                  className="min-h-[44px] rounded-xl border border-[var(--border-neutral)] px-3 py-1.5 text-xs font-semibold text-[var(--text-muted)] transition-colors hover:border-red-400/40 hover:text-red-300 active:duration-[25ms] active:scale-[0.985] cursor-pointer disabled:opacity-50"
                >
                  Discard
                </button>
              </div>

              {/* Bottom Perforated Sawtooth Thermal Edge */}
              <svg
                aria-hidden="true"
                className="pointer-events-none absolute -bottom-2 left-0 right-0 h-2 w-full text-[var(--surface-layer-2)]"
                preserveAspectRatio="none"
                viewBox="0 0 120 6"
              >
                <polygon
                  fill="currentColor"
                  points="0,0 5,6 10,0 15,6 20,0 25,6 30,0 35,6 40,0 45,6 50,0 55,6 60,0 65,6 70,0 75,6 80,0 85,6 90,0 95,6 100,0 105,6 110,0 115,6 120,0"
                />
              </svg>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
