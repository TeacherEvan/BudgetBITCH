'use client';

import { Button } from '@/components/ui/button';
import { ShieldCheck } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function PermissionModal({
  open,
  rememberCheck,
  onRememberChange,
  onDeny,
  onGrant,
}: {
  open: boolean;
  rememberCheck: boolean;
  onRememberChange: (v: boolean) => void;
  onDeny: () => void;
  onGrant: () => void;
}) {
  const t = useTranslations('QuickAdd');
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div
        className="w-full max-w-sm bg-neutral-900 border border-sky-400/30 rounded-3xl p-6 shadow-2xl space-y-4"
        data-testid="inbox-perm-modal"
      >
        <div className="flex items-center gap-3 text-sky-400">
          <div className="p-2.5 rounded-2xl bg-sky-400/10 border border-sky-400/20">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-white leading-tight">{t('permTitle')}</h3>
        </div>
        <p className="text-xs text-white/70 leading-relaxed">{t('permDesc')}</p>
        <label className="flex items-center gap-2.5 text-xs text-white/80 cursor-pointer pt-2 select-none">
          <input
            type="checkbox"
            checked={rememberCheck}
            onChange={(e) => onRememberChange(e.target.checked)}
            className="w-4 h-4 rounded border-white/20 bg-white/10 text-sky-500 focus:ring-0 cursor-pointer"
            data-testid="remember-perm-checkbox"
          />
          <span>{t('rememberChoice')}</span>
        </label>
        <div className="flex gap-2 pt-2">
          <Button
            variant="secondary"
            className="flex-1 py-2.5 rounded-xl text-xs"
            onClick={onDeny}
            data-testid="deny-perm-btn"
          >
            {t('deny')}
          </Button>
          <Button
            variant="primary"
            className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-sky-400 hover:bg-sky-300 text-slate-950"
            onClick={onGrant}
            data-testid="grant-perm-btn"
          >
            {t('allow')}
          </Button>
        </div>
      </div>
    </div>
  );
}
