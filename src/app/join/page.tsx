// app/join/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useConvexAuth } from '@convex-dev/auth/react';
import { Check, X, QrCode } from 'lucide-react';
import { useAccounts } from '@/hooks/use-accounts';
import { HeaderBar } from '@/components/layout/header-bar';

type Status = 'idle' | 'working' | 'done' | 'error';

export default function JoinPage() {
  const locale = useLocale();
  const params = useSearchParams();
  const router = useRouter();
  const { redeemInviteToken } = useAccounts();
  const { isLoading: authLoading, isAuthenticated } = useConvexAuth();

  const handleLocaleChange = (nextLocale: string) => {
    document.cookie = `bb-locale=${nextLocale}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
  };

  const code = params.get('code') ?? '';
  const [status, setStatus] = useState<Status>(code ? 'working' : 'idle');
  const [error, setError] = useState<string>('');

  const t = useCallback((en: string) => en, []);

  // Invite links are opened while logged out (e.g. from a fresh browser tab).
  // Send the user to sign-in first, preserving the ?code= so they land back
  // here after authenticating.
  useEffect(() => {
    if (authLoading || isAuthenticated) return;
    const returnTo = code ? `/join?code=${encodeURIComponent(code)}` : '/join';
    const url = new URL('/sign-in', window.location.origin);
    url.searchParams.set('redirectTo', returnTo);
    router.replace(url.toString());
  }, [authLoading, isAuthenticated, code, router]);

  useEffect(() => {
    if (!code || status !== 'working') return;
    // Wait for auth to resolve; unauthenticated users are redirected above.
    if (authLoading || !isAuthenticated) return;
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
        setError(e instanceof Error ? e.message : t('Could not join'));
      }
    })();
    return () => {
      active = false;
    };
  }, [code, status, authLoading, isAuthenticated, redeemInviteToken, router, t]);

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
          {t('Join an account')}
        </h1>

        {status === 'idle' && !code && (
          <p className="mt-3 text-sm text-[var(--text-2)]">
            {t('Open this link from a Budget Boss invite to join.')}
          </p>
        )}

        {status === 'working' && (
          <p className="mt-3 text-sm text-[var(--text-2)]">
            {t('Joining…')}
          </p>
        )}

        {status === 'done' && (
          <div className="mt-4 flex flex-col items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
              <Check className="h-5 w-5" />
            </div>
            <p className="text-sm font-medium text-[var(--text-1)]">
              {t('You’re in! Opening your new account…')}
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
              {t('Go to Accounts')}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
