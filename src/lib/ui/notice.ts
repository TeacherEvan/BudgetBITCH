// lib/ui/notice.ts
//
// Tiny app-wide notice bus. Plain (non-React) store functions and hooks can
// raise user-visible feedback without importing a React context. `NoticeHost`
// (mounted once in the root layout) renders whatever is dispatched here.
//
// This exists because several destructive actions (notably deletes routed
// through two-party consent) previously completed with NO visible effect,
// making working buttons look broken.

export const NOTICE_EVENT = 'budgetbitch:notice';

export type NoticeLevel = 'info' | 'success' | 'error';

export interface NoticeDetail {
  id: string;
  level: NoticeLevel;
  message: string;
}

export function notify(message: string, level: NoticeLevel = 'info'): void {
  if (typeof window === 'undefined') return;
  const detail: NoticeDetail = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    level,
    message,
  };
  window.dispatchEvent(new CustomEvent<NoticeDetail>(NOTICE_EVENT, { detail }));
}
