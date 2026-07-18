// components/shared-board/shared-board-sync.tsx
'use client';

import { useSharedBoard } from '@/hooks/use-shared-board';

/**
 * Side-effect-only component that drives couple-board sync (pull/push/offline).
 * Renders nothing; mount once app-wide inside the Convex provider so sync runs
 * on every page while the user is linked.
 */
export function SharedBoardSync() {
  useSharedBoard();
  return null;
}
