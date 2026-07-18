// app/settings/page.tsx
'use client';

import { useState } from 'react';
import { useLocale } from 'next-intl';
import { Globe, Volume2, Palette, Trash2, AlertCircle, Shield, Download, Upload } from 'lucide-react';
import { useConvexAuth } from '@convex-dev/auth/react';
import { useWizardProfile } from '@/hooks/use-local-db';
import { useVoice } from '@/hooks/use-voice';
import { useCriticalExpense } from '@/hooks/use-critical-expense';
import { useSharedBoard } from '@/hooks/use-shared-board';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Toggle } from '@/components/ui/toggle';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Modal } from '@/components/ui/modal';
import { LocaleSwitcher } from '@/components/i18n/locale-switcher';
import { USER_DATA_STORES, type UserDataStore, clearAllUserData, getDB } from '@/lib/db/local-db';
import { format } from 'date-fns';

type SettingsLocale = 'th' | 'en';

type Status = 'idle' | 'success' | 'error';

const labels = {
  th: {
    title: 'ตั้งค่า',
    sections: {
      general: 'ทั่วไป',
      preferences: 'การตั้งค่าส่วนตัว',
      data: 'ข้อมูล',
      privacy: 'ความเป็นส่วนตัว',
    },
    locale: 'ภาษา',
    voice: 'เสียงช่วยแนะนำ',
    voiceRate: 'ความเร็วพูด',
    voicePitch: 'ระดับเสียง',
    theme: 'ธีมสี',
    themeAmber: 'อำพรizes (ค่าเริ่มต้น)',
    themeDark: 'ดำเข้ม',
    themeGold: 'ทองวัดไทย',
    resetData: 'ล้างข้อมูลทั้งหมด',
    resetConfirmTitle: 'ยืนยันการล้างข้อมูล',
    resetConfirmBody: 'ลบข้อมูลทั้งหมด: โปรไฟล์, ค่าใช้จ่าย, งบประมาณ, เป้าหมาย ฯลฯ จะไม่สามารถกู้คืนได้',
    resetConfirmCancel: 'ยกเลิก',
    resetConfirmDestructive: 'ลบข้อมูลทั้งหมด',
    exportData: 'ส่งออกข้อมูล (JSON)',
    importing: 'กำลังนำเข้า...',
    exportSuccess: 'ส่งออกสำเร็จ',
    importSuccess: 'นำเข้าข้อมูลสำเร็จ',
    importError: 'ไฟล์ไม่ถูกต้อง',
    importData: 'นำเข้าข้อมูล (JSON)',
    lastSync: 'ซิงค์ล่าสุด',
    syncNow: 'ซิงค์ตอนนี้',
    syncing: 'กำลังซิงค์...',
    syncSuccess: 'ซิงค์ข้อมูลสำเร็จ',
    syncError: 'ซิงค์ล้มเหลว',
    privacyDisclaimer: 'ข้อความยอมรับความเป็นส่วนตัว',
    criticalExpense: 'ค่าใช้จ่ายที่ต้องลด',
    commitStatus: 'สถานะการยอมรับ',
    committed: 'ยอมรับแล้ว',
    notCommitted: 'ยังไม่ได้เลือก',
    neverSynced: 'ยังไม่เคยซิงค์',
    sharedBoard: 'แดชบอร์ดคู่',
    yourCode: 'โค้ดของคุณ',
    copyCode: 'คัดลอก',
    linkCode: 'เชื่อมต่อด้วยโค้ด',
    linkPlaceholder: 'วางโค้ดคู่ของคุณ',
    linkButton: 'เชื่อมต่อ',
    linkedWith: 'เชื่อมต่อกับคู่ของคุณแล้ว',
    unlink: 'ยกเลิกการเชื่อมต่อ',
    linking: 'กำลังเชื่อมต่อ...',
    linkError: 'ไม่พบโค้ดนี้',
    lastSynced: 'ซิงค์ล่าสุด',
  },
  en: {
    title: 'Settings',
    sections: {
      general: 'General',
      preferences: 'Preferences',
      data: 'Data',
      privacy: 'Privacy',
    },
    locale: 'Language',
    voice: 'Voice Guidance',
    voiceRate: 'Speech Rate',
    voicePitch: 'Pitch',
    theme: 'Theme',
    themeAmber: 'Amber (Default)',
    themeDark: 'Dark',
    themeGold: 'Thai Temple Gold',
    resetData: 'Reset All Data',
    resetConfirmTitle: 'Confirm Reset',
    resetConfirmBody: 'Delete ALL data: profile, expenses, budgets, goals, etc. This cannot be undone.',
    resetConfirmCancel: 'Cancel',
    resetConfirmDestructive: 'Delete All Data',
    exportData: 'Export Data (JSON)',
    importing: 'Importing...',
    exportSuccess: 'Export complete',
    importSuccess: 'Data imported successfully',
    importError: 'Invalid file',
    importData: 'Import Data (JSON)',
    lastSync: 'Last Sync',
    syncNow: 'Sync Now',
    syncing: 'Syncing...',
    syncSuccess: 'Sync complete',
    syncError: 'Sync failed',
    privacyDisclaimer: 'Privacy Disclaimer',
    criticalExpense: 'Cut One Expense',
    commitStatus: 'Commitment Status',
    committed: 'Committed',
    notCommitted: 'Not Selected',
    neverSynced: 'Never synced',
    sharedBoard: 'Shared Board',
    yourCode: 'Your Code',
    copyCode: 'Copy',
    linkCode: 'Link with code',
    linkPlaceholder: 'Paste your partner’s code',
    linkButton: 'Link',
    linkedWith: 'Linked with your partner',
    unlink: 'Unlink',
    linking: 'Linking...',
    linkError: 'Share code not found',
    lastSynced: 'Last synced',
  },
};

// LocalStorage keys managed by this app. Reset intentionally preserves
// `budgetbitch:theme`, `voiceSettings`, `bb-locale`, and the offline/board
// sync queues so a data reset never wipes preferences or queued writes.
const RESET_PRESERVE = [
  'budgetbitch:theme',
  'voiceSettings',
  'bb-locale',
  'budgetbitch:offlineQueue',
  'budgetbitch:boardQueue',
];

export default function SettingsPage() {
  const localeRaw = useLocale();
  const locale: SettingsLocale = localeRaw === 'th' ? 'th' : 'en';

  const auth = useConvexAuth();
  const { isAuthenticated, isLoading: authLoading } = auth ?? { isAuthenticated: false, isLoading: true };
  const { clear: clearProfile } = useWizardProfile();
  const { settings: voiceSettings, updateSettings: updateVoiceSettings, toggleVoice, isSupported } = useVoice(
    locale === 'th' ? 'th-TH' : 'en-US'
  );
  const { commitment } = useCriticalExpense();
  const shared = useSharedBoard();
  const [code, setCode] = useState('');
  const [linkError, setLinkError] = useState<string | null>(null);

  const [lastSync, setLastSync] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('budgetbitch:lastSync');
    }
    return null;
  });
  const [syncing, setSyncing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [exportStatus, setExportStatus] = useState<Status>('idle');
  const [importStatus, setImportStatus] = useState<Status>('idle');
  const [syncStatus, setSyncStatus] = useState<Status>('idle');

  const handleVoiceToggle = () => {
    toggleVoice();
  };

  const handleCopyCode = () => {
    const c = shared.myProfile?.shareCode;
    if (c && navigator.clipboard?.writeText) {
      void navigator.clipboard.writeText(c);
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

  const handleResetConfirm = async () => {
    setResetOpen(false);
    await clearAllUserData();
    clearProfile();
    // Only drop data-scoped keys; preserve theme, voice, locale, and sync queues.
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && !RESET_PRESERVE.includes(key)) {
        localStorage.removeItem(key);
      }
    }
    window.location.href = '/';
  };

  const handleExportData = async () => {
    setExporting(true);
    setExportStatus('idle');
    try {
      const db = await getDB();
      const allData: Record<string, unknown> = {};

      for (const store of USER_DATA_STORES) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        allData[store] = (await db.getAll(store)) as any;
      }

      const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `budgetbitch-backup-${format(new Date(), 'yyyy-MM-dd')}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setExportStatus('success');
    } catch {
      setExportStatus('error');
    } finally {
      setExporting(false);
    }
  };

  const handleImportData = (file: File) => {
    setImportStatus('idle');
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (typeof data !== 'object' || data === null) throw new Error('invalid');

        const db = await getDB();
        const putAny = (
          db as unknown as { put(store: string, value: unknown): Promise<IDBValidKey> }
        ).put.bind(db);

        for (const [store, items] of Object.entries(data)) {
          if (!USER_DATA_STORES.includes(store as UserDataStore)) continue;
          if (!Array.isArray(items)) continue;
          for (const item of items) {
            await putAny(store, item);
          }
        }
        setImportStatus('success');
        window.location.reload();
      } catch {
        setImportStatus('error');
      }
    };
    reader.readAsText(file);
  };

  const handleSyncNow = async () => {
    setSyncing(true);
    setSyncStatus('idle');
    try {
      await import('@/lib/convex/sync-snapshots').then(m => m.syncDailySnapshot());
      const now = new Date().toISOString();
      setLastSync(now);
      localStorage.setItem('budgetbitch:lastSync', now);
      setSyncStatus('success');
    } catch {
      setSyncStatus('error');
    } finally {
      setSyncing(false);
    }
  };

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-pulse text-amber-400">Loading...</div></div>;
  }

  if (!isAuthenticated) {
    return <div className="min-h-screen flex items-center justify-center text-white/50">Please sign in to access settings</div>;
  }

  const l = labels[locale];

  return (
    <div className="min-h-screen bg-black">
      <header className="sticky top-0 z-40 bg-black/95 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">{l.title}</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6 pb-24">
        {/* General Section */}
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-amber-400 mb-4">{l.sections.general}</h2>
          <Card className="p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">{l.locale} <Globe className="inline w-4 h-4 ml-1" /></label>
              <LocaleSwitcher />
            </div>
          </Card>
        </section>

        {/* Preferences Section */}
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-amber-400 mb-4">{l.sections.preferences}</h2>
          <Card className="p-4 space-y-4">
            {/* Voice */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Volume2 className="w-5 h-5 text-amber-400" />
                <div>
                  <p className="font-medium text-white">{l.voice}</p>
                  <p className="text-xs text-white/50">{isSupported ? (locale === 'th' ? 'รองรับในเบราว์เซอร์นี้' : 'Supported in this browser') : (locale === 'th' ? 'ไม่รองรับ' : 'Not supported')}</p>
                </div>
              </div>
              <Toggle checked={voiceSettings.enabled} onChange={handleVoiceToggle} disabled={!isSupported} />
            </div>

            {voiceSettings.enabled && (
              <div className="space-y-4 pt-2 border-t border-white/10">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">{l.voiceRate}: {voiceSettings.rate.toFixed(1)}x</label>
                  <Slider
                    value={voiceSettings.rate}
                    onValueChange={(v) => updateVoiceSettings({ rate: v })}
                    min={0.5}
                    max={2}
                    step={0.1}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">{l.voicePitch}: {voiceSettings.pitch.toFixed(1)}x</label>
                  <Slider
                    value={voiceSettings.pitch}
                    onValueChange={(v) => updateVoiceSettings({ pitch: v })}
                    min={0.5}
                    max={2}
                    step={0.1}
                  />
                </div>
              </div>
            )}

            {/* Theme */}
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">{l.theme} <Palette className="inline w-4 h-4 ml-1" /></label>
              <ThemeToggle />
            </div>
          </Card>
        </section>

        {/* Data Section */}
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-amber-400 mb-4">{l.sections.data}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <Download className="w-5 h-5 text-amber-400" />
                <h3 className="font-semibold text-white">{l.exportData}</h3>
              </div>
              <p className="text-sm text-white/50 mb-4">{locale === 'th' ? 'ดาวน์โหลดข้อมูลทั้งหมดเป็นไฟล์ JSON' : 'Download all data as JSON file'}</p>
              <Button variant="secondary" onClick={handleExportData} className="w-full" disabled={exporting}>
                {exporting ? l.syncing : l.exportData}
              </Button>
              {exportStatus === 'success' && <p className="mt-2 text-sm text-emerald-400">{l.exportSuccess}</p>}
              {exportStatus === 'error' && <p className="mt-2 text-sm text-rose-400">{l.importError}</p>}
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <Upload className="w-5 h-5 text-amber-400" />
                <h3 className="font-semibold text-white">{l.importData}</h3>
              </div>
              <p className="text-sm text-white/50 mb-4">{locale === 'th' ? 'นำเข้าข้อมูลจากไฟล์ JSON' : 'Import data from JSON file'}</p>
              <input
                type="file"
                accept=".json"
                aria-label={l.importData}
                onChange={(e) => e.target.files?.[0] && handleImportData(e.target.files[0])}
                className="w-full text-sm text-white/50 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-amber-400/20 file:text-amber-400 hover:file:bg-amber-400/30 cursor-pointer"
              />
              {importStatus === 'success' && <p className="mt-2 text-sm text-emerald-400">{l.importSuccess}</p>}
              {importStatus === 'error' && <p className="mt-2 text-sm text-rose-400">{l.importError}</p>}
            </Card>

            <Card className="p-4 sm:col-span-2">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-amber-400" />
                  <h3 className="font-semibold text-white">{l.syncNow}</h3>
                </div>
                <span className="text-xs text-white/50">
                  {lastSync
                    ? format(new Date(lastSync), locale === 'th' ? 'd MMM yyyy HH:mm' : 'MMM d, yyyy HH:mm')
                    : l.neverSynced}
                </span>
              </div>
              <p className="text-sm text-white/50 mb-4">{locale === 'th' ? 'ซิงค์ข้อมูลโปรไฟล์และสแนปช็อตไปยัง Convex' : 'Sync profile and daily snapshot to Convex'}</p>
              <Button variant="primary" onClick={handleSyncNow} disabled={syncing} className="w-full">
                {syncing ? l.syncing : l.syncNow}
              </Button>
              {syncStatus === 'success' && <p className="mt-2 text-sm text-emerald-400">{l.syncSuccess}</p>}
              {syncStatus === 'error' && <p className="mt-2 text-sm text-rose-400">{l.syncError}</p>}
            </Card>

            <Card className="p-4 sm:col-span-2 border-rose-400/30 bg-rose-400/5">
              <div className="flex items-center gap-3 mb-3">
                <Trash2 className="w-5 h-5 text-rose-400" />
                <h3 className="font-semibold text-white">{l.resetData}</h3>
              </div>
              <p className="text-sm text-rose-400/80 mb-4">{l.resetConfirmBody}</p>
              <Button
                variant="secondary"
                onClick={() => setResetOpen(true)}
                className="w-full bg-rose-400/10 hover:bg-rose-400/20 border-rose-400/30 text-rose-400"
              >
                {l.resetData}
              </Button>
            </Card>
          </div>
        </section>

        {/* Shared Board Section */}
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-amber-400 mb-4">{l.sharedBoard}</h2>
          <Card className="p-4 space-y-4">
            {shared.isLinked ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-amber-400" />
                  <div>
                    <p className="font-medium text-white">{l.linkedWith}</p>
                    <p className="text-xs text-white/50">{locale === 'th' ? `บอร์ด: ${shared.boardId}` : `Board: ${shared.boardId}`}</p>
                  </div>
                </div>
                {shared.lastSyncedAt && (
                  <p className="text-xs text-white/50">
                    {l.lastSynced}: {format(new Date(shared.lastSyncedAt), locale === 'th' ? 'd MMM yyyy HH:mm' : 'MMM d, yyyy HH:mm')}
                  </p>
                )}
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
                      {l.copyCode}
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
        </section>

        {/* Privacy Section */}
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-amber-400 mb-4">{l.sections.privacy}</h2>
          <Card className="p-4 space-y-4 border-emerald-400/30 bg-emerald-400/5">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-white mb-2">{l.privacyDisclaimer}</h3>
                <p className="text-sm text-white/70 leading-relaxed">
                  {locale === 'th'
                    ? 'เราใช้ข้อมูลตำแหน่งของคุณ เพื่อแสดงราคาน้ำมัน บิลล์ และโปรโมชั่นใกล้คุณเท่านั้น ไม่ได้เก็บหรือขายข้อมูลให้บุคคลที่สาม ไม่มีการติดตาม และไม่ใช้เพื่อการตลาดใดๆ'
                    : 'We use your location ONLY to show local fuel prices, bills, and deals near you. We never store, sell, or share your data with third parties. No tracking. No marketing. Ever.'}
                </p>
              </div>
            </div>

            {/* Critical Expense Commitment Status */}
            <div className="pt-4 border-t border-white/10">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-amber-400" />
                  <h3 className="font-semibold text-white">{l.criticalExpense}</h3>
                </div>
                <span className={`text-sm px-3 py-1 rounded-full ${commitment ? 'bg-emerald-400/20 text-emerald-400' : 'bg-amber-400/20 text-amber-400'}`}>
                  {commitment ? l.committed : l.notCommitted}
                </span>
              </div>
              {commitment && (
                <div className="bg-black/30 rounded-xl p-3 text-sm">
                  <p className="text-white/70">
                    {locale === 'th'
                      ? `คุณเลือกลด: ${commitment.expenseKey} | ประหยัดต่อเดือน: ${commitment.estimatedMonthlyCost.toLocaleString()} บาท`
                      : `You chose: ${commitment.expenseKey} | Monthly savings: ${commitment.estimatedMonthlyCost.toLocaleString()} THB`}
                  </p>
                </div>
              )}
            </div>
          </Card>
        </section>
      </main>

      <Modal
        isOpen={resetOpen}
        onClose={() => setResetOpen(false)}
        title={l.resetConfirmTitle}
        description={l.resetConfirmBody}
        size="sm"
        closeOnOverlayClick={false}
      >
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={() => setResetOpen(false)}>
            {l.resetConfirmCancel}
          </Button>
          <Button
            variant="secondary"
            onClick={handleResetConfirm}
            className="bg-rose-400/10 hover:bg-rose-400/20 border-rose-400/30 text-rose-400"
          >
            {l.resetConfirmDestructive}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
