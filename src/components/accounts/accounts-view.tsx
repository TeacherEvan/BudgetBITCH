// components/accounts/accounts-view.tsx
// Full Accounts management screen: list owned + joined accounts, create new,
// invite members (QR + code), switch active board, leave/remove, and delete.
'use client';

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Plus, Check, Copy, Users, ArrowRightLeft, LogOut, Trash2, ShieldAlert } from 'lucide-react';
import { useConvexAuth } from '@convex-dev/auth/react';
import { useAccounts } from '@/hooks/use-accounts';
import { useAccountSync } from '@/hooks/use-account-sync';
import {
  UMBRELLA_KEYS,
  UMBRELLAS,
  UMBRELLA_LABELS,
  UMBRELLA_TAGLINES,
  MAX_OWNED_ACCOUNTS,
  type UmbrellaKey,
} from '@/lib/types/accounts';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { HeaderBar } from '@/components/layout/header-bar';

interface AccountsViewProps {
  locale: 'th' | 'en';
  onLocaleChange?: (locale: 'th' | 'en') => void;
  voiceEnabled?: boolean;
  onVoiceToggle?: () => void;
}

export function AccountsView({ locale, onLocaleChange, voiceEnabled, onVoiceToggle }: AccountsViewProps) {
  const auth = useConvexAuth();
  const isAuthenticated = auth?.isAuthenticated ?? false;

  const {
    accounts,
    currentAccountId,
    loading,
    ready,
    createAccount,
    switchTo,
    createInviteToken,
    leaveAccount,
    deleteAccount,
  } = useAccounts();
  // Drive sync for the active board while this screen is mounted.
  useAccountSync();

  const [creating, setCreating] = useState(false);
  const [newUmbrella, setNewUmbrella] = useState<UmbrellaKey | null>(null);
  const [newName, setNewName] = useState('');
  const [busy, setBusy] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [expandedInvite, setExpandedInvite] = useState<string | null>(null);
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [generatingInvite, setGeneratingInvite] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const ownedCount = accounts.filter((a) => a.role === 'owner' && a.accountId !== 'personal').length;
  const canCreate = ownedCount < MAX_OWNED_ACCOUNTS;

  const t = (en: string, th: string) => (locale === 'th' ? th : en);

  const handleCreate = async () => {
    if (!newUmbrella || !newName.trim()) return;
    setErrorMsg(null);
    if (!isAuthenticated) {
      setErrorMsg(t('กรุณาเข้าสู่ระบบก่อนสร้างบัญชีร่วม', 'Please sign in to create or share accounts.'));
      return;
    }
    setBusy(true);
    try {
      await createAccount({ umbrella: newUmbrella, name: newName.trim() });
      setCreating(false);
      setNewUmbrella(null);
      setNewName('');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg.includes('Authentication required')
        ? t('กรุณาเข้าสู่ระบบก่อนสร้างบัญชีร่วม', 'Please sign in to create or share accounts.')
        : msg);
    } finally {
      setBusy(false);
    }
  };

  const handleInvite = async (accountId: string) => {
    setGeneratingInvite(true);
    try {
      const token = await createInviteToken(accountId);
      setInviteToken(token);
      setExpandedInvite(accountId);
    } finally {
      setGeneratingInvite(false);
    }
  };

  const handleCopy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };

  const handleDelete = async (accountId: string) => {
    setDeleting(true);
    try {
      await deleteAccount(accountId);
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const deleteName = deleteTarget
    ? accounts.find((a) => a.accountId === deleteTarget)?.name
    : undefined;

  const inviteUrl = (code: string) =>
    typeof window !== 'undefined' ? `${window.location.origin}/join?code=${code}` : `/join?code=${code}`;

  return (
    <div className="bb-viewport-fill bg-[var(--bg-base)]">
      <HeaderBar
        locale={locale}
        onLocaleChange={(l) => onLocaleChange?.(l)}
        voiceEnabled={voiceEnabled ?? false}
        onVoiceToggle={() => onVoiceToggle?.()}
      />
      <main className="bb-scroll-zone mx-auto w-full max-w-3xl px-4 py-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-[var(--text-1)]">{t('Accounts', 'บัญชี')}</h1>
            <p className="mt-1 text-sm text-[var(--text-2)]">
              {t('Run up to 5 independent budgets — family, business, trips & more.', 'จัดงบอิสระได้สูงสุด 5 บัญชี — ครอบครัว ธุรกิจ ทริป ฯลฯ')}
            </p>
          </div>
          <Button variant="primary" onClick={() => setCreating(true)} disabled={!canCreate || !ready}>
            <Plus className="mr-1.5 h-4 w-4" />
            {t('New account', 'บัญชีใหม่')}
          </Button>
        </div>

        <div className="mb-6 rounded-2xl border border-sky-400/20 bg-sky-400/5 p-4 text-xs">
          <div className="flex items-start gap-3">
            <Users className="h-5 w-5 text-sky-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1 space-y-1">
              <h3 className="font-semibold text-white">
                {t('Sharing & Collaboration Guidance', 'คำแนะนำในการแชร์และการทำงานร่วมกัน')}
              </h3>
              <p className="text-white/60 leading-relaxed">
                {t(
                  'Your default "Personal" board is fully private. To share a budget with family, friends, or co-workers, click "New account" above to create a shared board, open it, and then click "Invite" to generate an invitation link or QR code.',
                  'บอร์ด "ส่วนตัว" (Personal) จะเป็นบอร์ดส่วนตัวของคุณเท่านั้น หากต้องการใช้งานร่วมกันกับครอบครัว เพื่อน หรือเพื่อร่วมงาน ให้คลิก "บัญชีใหม่" ด้านบนเพื่อสร้างบอร์ดร่วมกัน จากนั้นสลับไปใช้งานบอร์ดนั้นและกด "เชิญ" เพื่อส่งลิงก์คำเชิญหรือ QR Code'
                )}
              </p>
            </div>
          </div>
        </div>

        {!ready || loading ? (
          <p className="py-10 text-center text-sm text-[var(--text-2)]">{t('Loading…', 'กำลังโหลด…')}</p>
        ) : (
          <div className="grid gap-3">
            {accounts.map((a) => {
              const isActive = a.accountId === currentAccountId;
              const emoji = a.umbrella === 'personal' ? '👤' : UMBRELLAS[a.umbrella as UmbrellaKey]?.emoji ?? '🏦';
              const tagline =
                a.umbrella === 'personal'
                  ? t('Your private board', 'บอร์ดส่วนตัวของคุณ')
                  : UMBRELLA_TAGLINES[a.umbrella as UmbrellaKey]?.[locale];
              return (
                <div
                  key={a.accountId}
                  className={`rounded-2xl border p-4 transition-colors ${
                    isActive
                      ? 'border-[var(--gold-border-strong)] bg-[var(--gold-base)]/10'
                      : 'border-[var(--gold-border-soft)] bg-[var(--bg-surface-1)]'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-3xl">{emoji}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-base font-semibold text-[var(--text-1)]">{a.name}</p>
                        {isActive && (
                          <span className="rounded-full bg-[var(--gold-base)]/20 px-2 py-0.5 text-[10px] font-bold uppercase text-[var(--gold-bright)]">
                            {t('Active', 'ใช้งาน')}
                          </span>
                        )}
                      </div>
                      <p className="truncate text-xs text-[var(--text-2)]">{tagline}</p>
                      <p className="mt-1 text-[11px] text-[var(--text-muted)]">
                        {a.role === 'owner'
                          ? t('Owner', 'เจ้าของ')
                          : t('Member', 'สมาชิก')}
                        {' · '}
                        {t(`${a.memberCount} member${a.memberCount === 1 ? '' : 's'}`, `${a.memberCount} สมาชิก`)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {!isActive && a.accountId !== 'personal' && (
                      <Button variant="secondary" onClick={() => switchTo(a.accountId)}>
                        <ArrowRightLeft className="mr-1.5 h-4 w-4" />
                        {t('Open', 'เปิด')}
                      </Button>
                    )}
                    {a.accountId === 'personal' && (
                      <Button variant="secondary" onClick={() => switchTo('personal')} disabled={isActive}>
                        {t('Open', 'เปิด')}
                      </Button>
                    )}

                    {a.role === 'owner' && a.accountId !== 'personal' && (
                      <Button
                        variant="secondary"
                        disabled={generatingInvite}
                        onClick={() => handleInvite(a.accountId)}
                      >
                        <Users className="mr-1.5 h-4 w-4" />
                        {t('Invite', 'เชิญ')}
                      </Button>
                    )}

                    {a.role === 'member' && (
                      <Button variant="ghost" onClick={() => leaveAccount(a.accountId)}>
                        <LogOut className="mr-1.5 h-4 w-4" />
                        {t('Leave', 'ออก')}
                      </Button>
                    )}
                    {a.role === 'owner' && a.accountId !== 'personal' && (
                      <Button variant="ghost" onClick={() => setDeleteTarget(a.accountId)}>
                        <Trash2 className="mr-1.5 h-4 w-4" />
                        {t('Delete', 'ลบ')}
                      </Button>
                    )}
                  </div>

                  {expandedInvite === a.accountId && (inviteToken || a.inviteCode) && (
                    <div className="mt-4 flex flex-col items-center gap-3 rounded-xl border border-[var(--gold-border-soft)] bg-[var(--bg-surface-2)] p-4">
                      {(() => {
                        const code = inviteToken ?? a.inviteCode!;
                        return (
                          <>
                            <QRCodeSVG value={inviteUrl(code)} size={148} bgColor="#080600" fgColor="#F5D742" level="M" />
                            <p className="text-xs text-[var(--text-2)]">{t('Scan to join, or share the link:', 'สแกนเพื่อเข้าร่วม หรือแชร์ลิงก์:')}</p>
                            <div className="flex w-full items-center gap-2">
                              <code className="flex-1 truncate rounded-lg bg-black/40 px-3 py-2 font-mono text-sm text-[var(--gold-bright)]">
                                {code}
                              </code>
                              <Button variant="secondary" onClick={() => handleCopy(code)}>
                                {copiedCode === code ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                              </Button>
                            </div>
                            <a
                              href={inviteUrl(code)}
                              className="w-full truncate text-center text-xs text-[var(--gold-bright)] underline"
                            >
                              {inviteUrl(code)}
                            </a>
                          </>
                        );
                      })()}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Create modal */}
      <Modal isOpen={creating} onClose={() => setCreating(false)} title={t('New account', 'บัญชีใหม่')} size="md">
        <div className="space-y-4">
          <p className="text-sm text-[var(--text-2)]">
            {t('Pick an umbrella, then name this account.', 'เลือกหมวด แล้วตั้งชื่อบัญชีนี้')}
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {UMBRELLA_KEYS.map((key) => {
              const u = UMBRELLAS[key];
              const selected = newUmbrella === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setNewUmbrella(key)}
                  className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition-all ${
                    selected
                      ? 'border-[var(--gold-border-strong)] bg-[var(--gold-base)]/15 text-[var(--gold-bright)]'
                      : 'border-[var(--gold-border-soft)] bg-[var(--bg-surface-1)] text-[var(--text-2)] hover:border-[var(--gold-border-soft)]'
                  }`}
                >
                  <span className="text-2xl">{u.emoji}</span>
                  <span className="text-xs font-semibold">{UMBRELLA_LABELS[key][locale]}</span>
                </button>
              );
            })}
          </div>
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder={t('Account name', 'ชื่อบัญชี')}
            aria-label={t('Account name', 'ชื่อบัญชี')}
            className="w-full rounded-xl border border-[var(--gold-border-soft)] bg-[var(--bg-surface-2)] px-4 py-3 text-sm text-[var(--text-1)] outline-none placeholder:text-[var(--text-muted)]"
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setCreating(false)}>
              {t('Cancel', 'ยกเลิก')}
            </Button>
            <Button variant="primary" onClick={handleCreate} disabled={!newUmbrella || !newName.trim() || busy}>
              {busy ? t('Creating…', 'กำลังสร้าง…') : t('Create', 'สร้าง')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete confirmation modal */}
      <Modal
        isOpen={deleteTarget !== null}
        onClose={() => !deleting && setDeleteTarget(null)}
        title={t('Delete account', 'ลบบัญชี')}
        size="sm"
        closeOnOverlayClick={!deleting}
        closeOnEscape={!deleting}
      >
        <p className="text-sm text-[var(--text-2)]">
          {t(
            `This permanently deletes "${deleteName ?? ''}" and its shared board, members, and invites. This cannot be undone.`,
            `การลบ "${deleteName ?? ''}" จะลบบอร์ดที่แชร์ สมาชิก และคำเชิญอย่างถาวร ไม่สามารถกู้คืนได้`,
          )}
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setDeleteTarget(null)} disabled={deleting}>
            {t('Cancel', 'ยกเลิก')}
          </Button>
          <Button
            variant="danger"
            onClick={() => deleteTarget && handleDelete(deleteTarget)}
            disabled={deleting}
          >
            {deleting ? t('Deleting…', 'กำลังลบ…') : t('Delete', 'ลบ')}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
