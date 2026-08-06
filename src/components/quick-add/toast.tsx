'use client';

import { Loader2, Check, AlertCircle } from 'lucide-react';

export function Toast({
  toast,
  loadingLabel,
}: {
  toast: { show: boolean; message: string; type: 'success' | 'error' };
  loadingLabel: string;
}) {
  if (!toast.show) return null;

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-down">
      <div
        className={`
          px-4 py-3 rounded-2xl flex items-center gap-2.5 shadow-2xl backdrop-blur-xl border text-sm max-w-xs font-medium
          ${toast.type === 'success'
            ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-300'
            : 'bg-rose-950/90 border-rose-500/30 text-rose-300'
          }
        `}
      >
        {loadingLabel && toast.message === loadingLabel ? (
          <Loader2 className="w-4 h-4 animate-spin text-amber-400 flex-shrink-0" />
        ) : toast.type === 'success' ? (
          <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
        ) : (
          <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
        )}
        <span className="leading-tight">{toast.message}</span>
      </div>
    </div>
  );
}
