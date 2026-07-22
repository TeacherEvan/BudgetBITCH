'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Users } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface PartnerSharingCardProps {
  locale: 'th' | 'en';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  shared: any;
}

export function PartnerSharingCard({ locale, shared }: PartnerSharingCardProps) {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [linkError, setLinkError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [boardSyncing, setBoardSyncing] = useState(false);

  const handleCopyCode = () => {
    const c = shared.myProfile?.shareCode;
    if (c && navigator.clipboard?.writeText) {
      void navigator.clipboard.writeText(c);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleLink = async () => {
    setLinkError(null);
    const res = await shared.linkByCode(code);
    if (!res.ok) {
      setLinkError(res.error);
    } else {
      setCode('');
    }
  };

  const l = {
    th: {
      sharedBoard: 'แดชบอร์ดคู่',
      linkedWith: 'เชื่อมต่อกับคู่ของคุณแล้ว',
      lastSynced: 'ซิงค์ล่าสุด',
      syncBoardNow: 'ซิงค์ตอนนี้',
      partnerPending: 'รอซิงค์',
      syncing: 'กำลังซิงค์...',
      unlink: 'ยกเลิกการเชื่อมต่อ',
      yourCode: 'โค้ดของคุณ',
      copyCode: 'คัดลอก',
      copied: 'คัดลอกแล้ว!',
      linkCode: 'เชื่อมต่อด้วยโค้ด',
      linkPlaceholder: 'วางโค้ดคู่ของคุณ',
      linkButton: 'เชื่อมต่อ',
      linking: 'กำลังเชื่อมต่อ...',
    },
    en: {
      sharedBoard: 'Shared Board',
      linkedWith: 'Linked with your partner',
      lastSynced: 'Last synced',
      syncBoardNow: 'Sync now',
      partnerPending: 'Pending',
      syncing: 'Syncing...',
      unlink: 'Unlink',
      yourCode: 'Your Code',
      copyCode: 'Copy',
      copied: 'Copied!',
      linkCode: 'Link with code',
      linkPlaceholder: 'Paste your partner’s code',
      linkButton: 'Link',
      linking: 'Linking...',
    },
  }[locale];

  return (
    <section id="settings-shared" className="scroll-mt-24">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-amber-400 mb-4">
        {l.sharedBoard}
      </h2>
      <Card className="p-4 space-y-4">
        {shared.isLinked ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-amber-400" />
              <div>
                <p className="font-medium text-white">{l.linkedWith}</p>
                {shared.partnerName && (
                  <p className="text-xs text-white/60">{shared.partnerName}</p>
                )}
                <p className="text-xs text-white/50">
                  {locale === 'th' ? `บอร์ด: ${shared.boardId}` : `Board: ${shared.boardId}`}
                </p>
              </div>
            </div>
            {shared.lastSyncedAt && (
              <p className="text-xs text-white/50">
                {l.lastSynced}:{' '}
                {format(new Date(shared.lastSyncedAt), locale === 'th' ? 'd MMM yyyy HH:mm' : 'MMM d, yyyy HH:mm')}
              </p>
            )}
            <Button
              variant="primary"
              onClick={async () => {
                setBoardSyncing(true);
                try {
                  await shared.syncNow();
                } finally {
                  setBoardSyncing(false);
                }
              }}
              disabled={boardSyncing}
              className="w-full"
            >
              {boardSyncing ? l.syncing : l.syncBoardNow}
              {shared.pendingCount > 0 && (
                <span className="ml-2 rounded-full bg-amber-400/30 px-2 py-0.5 text-xs text-amber-300">
                  {shared.pendingCount} {l.partnerPending}
                </span>
              )}
            </Button>
            <Button
              variant="secondary"
              onClick={() => shared.unlink()}
              className="w-full bg-rose-400/10 hover:bg-rose-400/20 border-rose-400/30 text-rose-400"
            >
              {l.unlink}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">{l.yourCode}</label>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-black/40 rounded-lg px-3 py-2 text-amber-400 font-mono text-sm select-all">
                  {shared.myProfile?.shareCode ?? '—'}
                </code>
                <Button variant="secondary" onClick={handleCopyCode}>
                  {copied ? l.copied : l.copyCode}
                </Button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">{l.linkCode}</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder={l.linkPlaceholder}
                  aria-label={l.linkCode}
                  className="flex-1 bg-black/40 rounded-lg px-3 py-2 text-white text-sm border border-white/10 focus:outline-none focus:border-amber-400"
                />
                <Button variant="primary" onClick={handleLink} disabled={shared.resolving || !code.trim()}>
                  {shared.resolving ? l.linking : l.linkButton}
                </Button>
              </div>
              {linkError && <p className="mt-2 text-sm text-rose-400">{linkError}</p>}
            </div>
          </div>
        )}
      </Card>

      <Card className="p-4 border-amber-400/20 bg-amber-400/5 mt-4">
        <div className="flex items-start gap-3">
          <Users className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1 space-y-3">
            <div>
              <h3 className="font-semibold text-white">
                {locale === 'th' ? 'เชื่อมโยงกับครอบครัว เพื่อน หรือที่ทำงาน' : 'Link with Family, Friends, or Work'}
              </h3>
              <p className="text-xs text-white/60 leading-relaxed mt-1">
                {locale === 'th'
                  ? 'ระบบบอร์ดคู่รัก (Couple Board) ซิงค์ข้อมูลกับคู่รักได้ 1 คนเท่านั้น หากต้องการแชร์งบประมาณกับคนหลายคนในกลุ่มครอบครัว กลุ่มเพื่อน หรือที่ทำงาน ให้ไปที่เมนูจัดการบัญชีเพื่อสร้าง "บัญชีร่วมกัน" (Shared Account)'
                  : 'The Couple Board syncs with exactly one partner. To collaborate with multiple family members, friends, or co-workers, create a Shared Account under the Accounts manager.'}
              </p>
            </div>
            <Button
              variant="secondary"
              onClick={() => router.push('/accounts')}
              className="w-full sm:w-auto bg-amber-400/10 hover:bg-amber-400/20 border-amber-400/30 text-amber-300 text-xs py-1.5 h-auto"
            >
              {locale === 'th' ? 'จัดการบัญชีแชร์' : 'Manage Shared Accounts'}
            </Button>
          </div>
        </div>
      </Card>
    </section>
  );
}
