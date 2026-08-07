// app/settings/line-link/page.tsx
'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle2, Link2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RequireAuth } from '@/components/auth/require-auth';
import { useLineLink } from '@/hooks/use-line-link';

export default function LineLinkPage() {
  const router = useRouter();
  const { status, error, lineUserId, link } = useLineLink();

  return (
    <RequireAuth>
      <div className="min-h-screen bg-black">
        <header className="sticky top-0 z-40 bg-black/95 backdrop-blur-xl border-b border-white/10">
          <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push('/settings')}
              aria-label="Back to settings"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 text-white/70 transition-colors hover:border-[rgba(201,150,12,0.4)] hover:text-[#E8B020]"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-xl font-bold text-white">Link LINE Account</h1>
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
          <section className="p-5 rounded-2xl border border-white/10 bg-white/5 space-y-4">
            <div className="flex items-start gap-3">
              <Link2 className="h-6 w-6 text-[#E8B020] mt-0.5" />
              <div>
                <h2 className="text-base font-semibold text-white">
                  Connect your LINE account
                </h2>
                <p className="mt-1 text-sm text-white/60">
                  Link LINE so you can forward receipt photos in chat and have them
                  land in Budget Boss automatically, tagged as a LINE upload.
                </p>
              </div>
            </div>

            {status === 'linked' ? (
              <div
                role="status"
                className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-emerald-300"
              >
                <CheckCircle2 className="h-5 w-5" />
                <span className="text-sm">
                  LINE account linked. You can now send receipts in LINE.
                </span>
              </div>
            ) : (
              <Button
                variant="primary"
                className="w-full gap-2 justify-center bg-amber-400 text-black hover:bg-amber-300 font-semibold"
                onClick={() => void link()}
                disabled={status === 'loading'}
              >
                {status === 'loading' ? 'Linking…' : 'Link my LINE account'}
              </Button>
            )}

            {status === 'error' && (
              <div
                role="alert"
                className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-rose-300"
              >
                <AlertTriangle className="h-5 w-5" />
                <span className="text-sm">{error ?? 'Failed to link LINE account.'}</span>
              </div>
            )}

            {lineUserId && status === 'linked' && (
              <p className="text-xs text-white/40">
                Linked LINE user: {lineUserId}
              </p>
            )}
          </section>
        </main>
      </div>
    </RequireAuth>
  );
}
