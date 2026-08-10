'use client';

import { Button } from '@/components/ui/button';
import { useSharedDeleteGuardContext } from './shared-delete-guard-provider';

const STORE_LABEL: Record<string, string> = {
  expenses: 'Expense',
  incomes: 'Income',
  bills: 'Bill',
};

function describeItem(p: {
  store: string;
  itemSnapshot?: Record<string, unknown> | null;
  itemId: string;
}) {
  const snap = p.itemSnapshot as Record<string, unknown> | null;
  if (snap) {
    const merchant = (snap.merchant as string) || (snap.name as string) || '';
    const amount = snap.amount ?? snap.amountDue ?? '';
    const label = [STORE_LABEL[p.store] ?? p.store, merchant, amount ? `(${amount})` : '']
      .filter(Boolean)
      .join(' ');
    return label || `${STORE_LABEL[p.store] ?? p.store} ${p.itemId}`;
  }
  return `${STORE_LABEL[p.store] ?? p.store} ${p.itemId}`;
}

/**
 * Renders the two-party delete-consent inbox. When the viewer is the partner of
 * a requester, each pending request shows Approve/Reject. When the viewer raised
 * the request, it shows an "awaiting partner approval" state.
 */
export function PendingDeletesInbox() {
  const guard = useSharedDeleteGuardContext();
  if (!guard || !guard.isShared) return null;

  const { pendingForMe, pendingByMe, approve, reject, loaded } = guard;

  if (!loaded) return null;
  if (pendingForMe.length === 0 && pendingByMe.length === 0) return null;

  return (
    <div className="mt-4 space-y-3 rounded-2xl border border-amber-400/20 bg-amber-400/5 p-4">
      <h3 className="text-sm font-semibold text-amber-300">Delete Approval</h3>

      {pendingForMe.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-white/60">Your partner requested to delete:</p>
          {pendingForMe.map((p) => (
            <div
              key={p.pendingId}
              className="flex items-center justify-between gap-3 rounded-lg bg-black/30 px-3 py-2"
            >
              <span className="text-sm text-white truncate">{describeItem(p)}</span>
              <div className="flex gap-2">
                <Button
                  variant="primary"
                  className="bg-emerald-500/20 hover:bg-emerald-500/30 border-emerald-500/30 text-emerald-300 text-xs py-1 h-auto"
                  onClick={() => void approve(p.pendingId)}
                >
                  Approve
                </Button>
                <Button
                  variant="secondary"
                  className="bg-rose-400/10 hover:bg-rose-400/20 border-rose-400/30 text-rose-400 text-xs py-1 h-auto"
                  onClick={() => void reject(p.pendingId)}
                >
                  Reject
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {pendingByMe.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-white/60">Awaiting partner approval to delete:</p>
          {pendingByMe.map((p) => (
            <div
              key={p.pendingId}
              className="flex items-center justify-between gap-3 rounded-lg bg-black/30 px-3 py-2"
            >
              <span className="text-sm text-white truncate">{describeItem(p)}</span>
              <Button
                variant="secondary"
                className="bg-white/5 hover:bg-white/10 border-white/10 text-white/60 text-xs py-1 h-auto"
                onClick={() => void reject(p.pendingId)}
              >
                Cancel
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
