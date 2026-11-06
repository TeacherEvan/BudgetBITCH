// src/components/dashboard/panels/contextual-insight-pill.tsx
'use client';

import { useState } from 'react';
import { Sparkles, X, Lightbulb } from 'lucide-react';

interface ContextualInsightPillProps {
  id: string;
  principle: string;
  insight: string;
  badge?: string;
  onAction?: () => void;
  actionLabel?: string;
}

export function ContextualInsightPill({
  id,
  principle,
  insight,
  badge = 'BEHAVIORAL INSIGHT',
  onAction,
  actionLabel,
}: ContextualInsightPillProps) {
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(`bb:insight-dismissed:${id}`) === 'true';
  });

  if (dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(`bb:insight-dismissed:${id}`, 'true');
    } catch {}
  };

  return (
    <div
      data-testid={`insight-pill-${id}`}
      className="relative overflow-hidden rounded-xl border border-amber-400/25 bg-gradient-to-r from-amber-500/10 via-neutral-900 to-amber-950/20 p-3 shadow-sm transition-all text-left"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5 min-w-0">
          <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-amber-400/20 text-amber-400">
            <Lightbulb className="h-3.5 w-3.5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-bold tracking-wider uppercase text-amber-400 flex items-center gap-1">
                <Sparkles className="h-2.5 w-2.5" />
                {badge}
              </span>
              <span className="text-[10px] text-white/50">• {principle}</span>
            </div>
            <p className="mt-1 text-xs text-white/90 leading-relaxed font-normal">
              {insight}
            </p>
            {onAction && actionLabel && (
              <button
                type="button"
                onClick={onAction}
                className="mt-2 text-[11px] font-bold text-amber-300 hover:text-amber-200 underline transition-colors"
              >
                {actionLabel} →
              </button>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss insight"
          className="shrink-0 p-1 text-white/40 hover:text-white transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
