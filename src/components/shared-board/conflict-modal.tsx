// components/shared-board/conflict-modal.tsx
'use client';

import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, CheckCircle2 } from 'lucide-react';

export interface ConflictData {
  localUpdatedAt: number;
  remoteUpdatedAt: number;
  localSummary?: string;
  remoteSummary?: string;
}

interface ConflictModalProps {
  isOpen: boolean;
  conflict: ConflictData | null;
  onResolve: (action: 'keep_local' | 'keep_remote' | 'merge') => void;
  onClose: () => void;
}

export function ConflictModal({
  isOpen,
  conflict,
  onResolve,
  onClose,
}: ConflictModalProps) {
  if (!isOpen || !conflict) return null;

  const formatDate = (ts: number) => {
    try {
      return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'Just now';
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Sync Conflict — Review Changes"
      description="Simultaneous updates detected on your shared couple budget."
      size="md"
      showCloseButton={false}
      closeOnOverlayClick={false}
      closeOnEscape={false}
    >
      <div className="space-y-5">
        <div className="bg-amber-400/10 border border-amber-400/30 rounded-2xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-6 h-6 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <h4 className="font-semibold text-amber-400">Concurrent Edits Detected</h4>
            <p className="mt-0.5 text-white/70">
              Both you and your partner updated the budget baseline at the same time. Choose how to resolve this collision to preserve your data.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="border border-white/10 rounded-xl p-3 bg-white/5 space-y-1">
            <span className="text-xs text-white/40 font-medium uppercase block">Your Version</span>
            <span className="font-mono text-amber-400 block">{formatDate(conflict.localUpdatedAt)}</span>
            <span className="text-xs text-white/70 block">{conflict.localSummary || 'Local edits on this device'}</span>
          </div>
          <div className="border border-white/10 rounded-xl p-3 bg-white/5 space-y-1">
            <span className="text-xs text-white/40 font-medium uppercase block">Partner&apos;s Version</span>
            <span className="font-mono text-emerald-400 block">{formatDate(conflict.remoteUpdatedAt)}</span>
            <span className="text-xs text-white/70 block">{conflict.remoteSummary || 'Remote edits from partner'}</span>
          </div>
        </div>

        <div className="space-y-2 pt-2">
          <Button
            variant="primary"
            className="w-full justify-between"
            onClick={() => onResolve('merge')}
          >
            <span className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              Merge Both Versions (Recommended)
            </span>
            <CheckCircle2 className="w-4 h-4 text-slate-950" />
          </Button>

          <Button
            variant="secondary"
            className="w-full justify-start"
            onClick={() => onResolve('keep_local')}
          >
            Keep My Local Version
          </Button>

          <Button
            variant="secondary"
            className="w-full justify-start"
            onClick={() => onResolve('keep_remote')}
          >
            Use Partner&apos;s Remote Version
          </Button>
        </div>
      </div>
    </Modal>
  );
}
