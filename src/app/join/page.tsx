// app/join/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { Check, X, QrCode } from 'lucide-react';
import { useAccounts } from '@/hooks/use-accounts';
import { HeaderBar } from '@/components/layout/header-bar';

type Status = 'idle' | 'working' | 'done' | 'error';

export default function JoinPage() {
  const locale = useLocale() as 'th' | 'en';
  const params = useSearchParams();
  const router = useRouter();
  const { redeemInviteToken } = useAccounts();

  const handleLocaleChange = (nextLocale: 'th' | 'en') => {
    document.cookie = `bb-locale=${nextLocale}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
  };

  const code = params.get('code') ?? '';
  const [status, setStatus] = useState<Status>(code ? 'working' : 'idle');
  const [error, setError] = useState<string>('');

  const t = (en: string, th: string) => (locale === 'th' ? th : en);

  useEffect(() => {
    if (!code || status !== 'working') return;
    let active = true;
    (async () => {
      try {
        await redeemInviteToken(code);
        if (!active) return;
        setStatus('done');
        // Head to the dashboard (now switched to the joined account).
        setTimeout(() => router.push('/dashboard'), 900);
      } catch (e) {
        if (!active) return;
        setStatus('error');
        setError(e instanceof Error ? e.message : t('Could not join', 'ไม่สามารถเข้าร่วมได้'));
      }
    })();
    return () => {
      active = false;
    };
  }, [code, status, redeemInviteToken, router, t]);

  return (
    <div className="bb-viewport-fill bg-[var(--bg-base)]">
      <HeaderBar
        locale={locale}
        onLocaleChange={handleLocaleChange}
      />
      <main className="mx-auto flex min-h-[60vh] w-full max-w-md flex-col items-center justify-center px-4 text-center">
        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-[var(--gold-border-strong)] bg-[var(--gold-base)]/10 text-[var(--gold-bright)]">
          <QrCode className="h-8 w-8" />
        </div>
        <h1 className="font-display text-2xl font-bold text-[var(--text-1)]">
          {t('Join an account', 'เข้าร่วมบัญชี')}
        </h1>

        {status === 'idle' && !code && (
          <p className="mt-3 text-sm text-[var(--text-2)]">
            {t('Open this link from a BudgetBITCH invite to join.', 'เปิดลิงก์นี้จากคำเชิญ BudgetBITCH เพื่อเข้าร่วม')}
          </p>
        )}

        {status === 'working' && (
          <p className="mt-3 text-sm text-[var(--text-2)]">
            {t('Joining…', 'กำลังเข้าร่วม…')}
          </p>
        )}

        {status === 'done' && (
          <div className="mt-4 flex flex-col items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
              <Check className="h-5 w-5" />
            </div>
            <p className="text-sm font-medium text-[var(--text-1)]">
              {t('You’re in! Opening your new account…', 'เข้าร่วมแล้ว! กำลังเปิดบัญชีใหม่…')}
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className="mt-4 flex flex-col items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-500/20 text-rose-400">
              <X className="h-5 w-5" />
            </div>
            <p className="text-sm font-medium text-[var(--text-1)]">{error}</p>
            <button
              type="button"
              onClick={() => router.push('/accounts')}
              className="rounded-xl border border-[var(--gold-border-soft)] bg-[var(--bg-surface-1)] px-4 py-2 text-sm font-medium text-[var(--text-1)] transition-colors hover:bg-[var(--bg-surface-2)]"
            >
              {t('Go to Accounts', 'ไปที่บัญชี')}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
