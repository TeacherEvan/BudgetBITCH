// components/shared-board/shared-board-sync.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSharedBoard } from '@/hooks/use-shared-board';
import { ConflictModal, ConflictData } from './conflict-modal';
import { notify } from '@/lib/ui/notice';

/**
 * Side-effect-only component that drives couple-board sync (pull/push/offline)
 * and renders conflict resolution modal when concurrent edits collide.
 */
export function SharedBoardSync() {
  const { syncNow } = useSharedBoard();
  const [conflictData, setConflictData] = useState<ConflictData | null>(null);

  useEffect(() => {
    const handleConflict = (e: Event) => {
      const customEvent = e as CustomEvent<ConflictData>;
      if (customEvent.detail) {
        setConflictData(customEvent.detail);
      }
    };

    window.addEventListener('budgetbitch:syncConflict', handleConflict);
    return () => window.removeEventListener('budgetbitch:syncConflict', handleConflict);
  }, []);

  const handleResolve = async (action: 'keep_local' | 'keep_remote' | 'merge') => {
    setConflictData(null);
    if (action === 'keep_local' || action === 'merge') {
      try {
        await syncNow();
      } catch (e) {
        console.error('Conflict resolution sync failed:', e);
        notify('Sync failed while resolving the conflict. Your local data is safe.', 'error');
      }
    }
  };

  return (
    <ConflictModal
      isOpen={!!conflictData}
      conflict={conflictData}
      onResolve={handleResolve}
      onClose={() => setConflictData(null)}
    />
  );
}
