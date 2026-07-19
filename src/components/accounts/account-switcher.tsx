// components/accounts/account-switcher.tsx
// Compact account switcher used in the dashboard sidebar (desktop) and the
// mobile sheet menu. Shows the active board and lets the user hop between
// Personal + their Accounts without leaving the dashboard.
'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { ChevronDown, Check, Plus } from 'lucide-react';
import { useAccounts } from '@/hooks/use-accounts';
import { umbrellaLabel } from '@/lib/types/accounts';

interface AccountSwitcherProps {
  locale: 'th' | 'en';
}

export function AccountSwitcher({ locale }: AccountSwitcherProps) {
  const { accounts, currentAccountId, switchTo } = useAccounts();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const active = accounts.find((a) => a.accountId === currentAccountId) ?? accounts[0];

  const handleSelect = async (accountId: string) => {
    setOpen(false);
    if (accountId !== currentAccountId) {
      await switchTo(accountId);
    }
  };

  if (!active) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-label={locale === 'th' ? 'สลับบัญชี' : 'Switch account'}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 rounded-xl border border-[var(--gold-border-strong)] bg-[var(--gold-base)]/10 p-3 text-left transition-colors hover:bg-[var(--gold-base)]/20"
      >
        <span className="text-2xl">
          {active.umbrella === 'personal' ? '👤' : '🏦'}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--gold-bright)]">
            {locale === 'th' ? 'บัญชีที่ใช้งาน' : 'Active account'}
          </p>
          <p className="truncate text-sm font-semibold text-[var(--text-1)]">
            {active.name}
          </p>
        </div>
        <ChevronDown className={`text-[var(--gold-bright)] transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-0 right-0 z-50 mt-2 overflow-hidden rounded-xl border border-[var(--gold-border-soft)] bg-[var(--bg-surface-2)] shadow-xl">
          {accounts.map((a) => (
            <button
              key={a.accountId}
              type="button"
              onClick={() => handleSelect(a.accountId)}
              className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-[var(--gold-base)]/15"
            >
              <span className="text-xl">{a.umbrella === 'personal' ? '👤' : '🏦'}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-[var(--text-1)]">{a.name}</p>
                <p className="truncate text-xs text-[var(--text-2)]">
                  {umbrellaLabel(a.umbrella, locale)}
                  {a.role === 'member' ? (locale === 'th' ? ' • สมาชิก' : ' • Member') : ''}
                </p>
              </div>
              {a.accountId === currentAccountId && <Check className="h-4 w-4 text-[var(--gold-bright)]" />}
            </button>
          ))}
          <Link
            href="/accounts"
            onClick={() => setOpen(false)}
            className="flex w-full items-center gap-3 border-t border-[var(--gold-border-soft)] px-3 py-2.5 text-left text-sm font-medium text-[var(--gold-bright)] transition-colors hover:bg-[var(--gold-base)]/15"
          >
            <Plus className="h-4 w-4" />
            {locale === 'th' ? 'จัดการบัญชีทั้งหมด' : 'Manage all accounts'}
          </Link>
        </div>
      )}
    </div>
  );
}
