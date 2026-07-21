// app/settings/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { Globe, Volume2, Palette, Trash2, AlertCircle, Shield, Download, Upload, BarChart2, TrendingUp, PieChart, Circle, User, Newspaper, Users, Settings, ArrowLeft, KeyRound, LogOut } from 'lucide-react';
import { useAuthActions } from '@convex-dev/auth/react';
import { useWizardProfile } from '@/hooks/use-local-db';
import { useVoice } from '@/hooks/use-voice';
import { useCriticalExpense } from '@/hooks/use-critical-expense';
import { useSharedBoard } from '@/hooks/use-shared-board';
import { useDisplayPrefs, type GraphType } from '@/hooks/use-display-prefs';
import { useNewsPrefs, ALL_GENRES, type NewsGenre } from '@/hooks/use-news-prefs';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Toggle } from '@/components/ui/toggle';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Modal } from '@/components/ui/modal';
import { LocaleSwitcher } from '@/components/i18n/locale-switcher';
import { useCurrencyOverride, type CurrencyOverride } from '@/hooks/use-currency-override';
import { USER_DATA_STORES, type UserDataStore, clearAllUserData, getDB } from '@/lib/db/local-db';
import { formatMoney } from '@/lib/utils/currency';
import { format } from 'date-fns';

type SettingsLocale = 'th' | 'en';

type Status = 'idle' | 'success' | 'error';

/** Manual currency options. `null` = AUTO (use resolved location). */
const CURRENCY_OPTIONS: { code: CurrencyOverride; label: { th: string; en: string } }[] = [
  { code: null,      label: { th: 'อัตโนมัติ (ตามตำแหน่ง)', en: 'Auto (from location)' } },
  { code: 'THB',     label: { th: 'บาทไทย (THB)', en: 'Thai Baht (THB)' } },
  { code: 'USD',     label: { th: 'ดอลลาร์สหรัฐ (USD)', en: 'US Dollar (USD)' } },
  { code: 'GBP',     label: { th: 'ปอนด์อังกฤษ (GBP)', en: 'British Pound (GBP)' } },
  { code: 'EUR',     label: { th: 'ยูโร (EUR)', en: 'Euro (EUR)' } },
  { code: 'JPY',     label: { th: 'เยนญี่ปุ่น (JPY)', en: 'Japanese Yen (JPY)' } },
  { code: 'SGD',     label: { th: 'ดอลลาร์สิงคโปร์ (SGD)', en: 'Singapore Dollar (SGD)' } },
  { code: 'AUD',     label: { th: 'ดอลลาร์ออสเตรเลีย (AUD)', en: 'Australian Dollar (AUD)' } },
  { code: 'MYR',     label: { th: 'ริงกิตมาเลเซีย (MYR)', en: 'Malaysian Ringgit (MYR)' } },
  { code: 'CAD',     label: { th: 'ดอลลาร์แคนาดา (CAD)', en: 'Canadian Dollar (CAD)' } },
  { code: 'INR',     label: { th: 'รูปีอินเดีย (INR)', en: 'Indian Rupee (INR)' } },
  { code: 'CNY',     label: { th: 'หยวนจีน (CNY)', en: 'Chinese Yuan (CNY)' } },
];

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
    partnerPending: 'รอซิงค์',
    syncBoard: 'ซิงค์บอร์ดคู่',
    syncBoardNow: 'ซิงค์ตอนนี้',
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
    partnerPending: 'Pending',
    syncBoard: 'Sync couple board',
    syncBoardNow: 'Sync now',
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
  const router = useRouter();
  const { signOut } = useAuthActions();

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/');
    } catch (e) {
      console.error('Sign out failed:', e);
    }
  };

  const { profile, clear: clearProfile } = useWizardProfile();
  const { settings: voiceSettings, updateSettings: updateVoiceSettings, toggleVoice, isSupported } = useVoice(
    locale === 'th' ? 'th-TH' : 'en-US'
  );
  const { commitment } = useCriticalExpense();
  const shared = useSharedBoard();
  const { graphType, setGraphType, accentColor, setAccentColor } = useDisplayPrefs();
  const { isGenreEnabled, toggleGenre } = useNewsPrefs();
  const { override, setOverride } = useCurrencyOverride();
  const [code, setCode] = useState('');
  const [linkError, setLinkError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

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
  const [boardSyncing, setBoardSyncing] = useState(false);

  const handleVoiceToggle = () => {
    toggleVoice();
  };

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

  const l = labels[locale];

  return (
    <div className="min-h-screen bg-black">
      <header className="sticky top-0 z-40 bg-black/95 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              aria-label={locale === 'th' ? 'กลับ' : 'Back'}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 text-white/70 transition-colors hover:border-[rgba(201,150,12,0.4)] hover:text-[#E8B020]"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-xl font-bold text-white">{l.title}</h1>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleSignOut}
            className="flex items-center gap-1.5 border-rose-500/30 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300"
          >
            <LogOut className="h-4 w-4" />
            <span>{locale === 'th' ? 'ออกจากระบบ' : 'Sign Out'}</span>
          </Button>
        </div>
        {/* Section nav tabs */}
        <nav aria-label="Settings sections" className="max-w-4xl mx-auto px-4 pb-3 flex gap-1 overflow-x-auto scrollbar-none">
          {([
            { id: 'general',     label: { en: 'General',  th: 'ทั่วไป' },      icon: <Globe className="w-3.5 h-3.5" /> },
            { id: 'profile',     label: { en: 'Profile',  th: 'โปรไฟล์' },    icon: <User className="w-3.5 h-3.5" /> },
            { id: 'display',     label: { en: 'Display',  th: 'การแสดงผล' }, icon: <Palette className="w-3.5 h-3.5" /> },
            { id: 'news',        label: { en: 'News',     th: 'ข่าวสาร' },    icon: <Newspaper className="w-3.5 h-3.5" /> },
            { id: 'preferences', label: { en: 'Preferences', th: 'การตั้งค่า' }, icon: <Settings className="w-3.5 h-3.5" /> },
            { id: 'data',        label: { en: 'Data',     th: 'ข้อมูล' },     icon: <Download className="w-3.5 h-3.5" /> },
            { id: 'shared',      label: { en: 'Shared Board', th: 'บอร์ดคู่' }, icon: <Users className="w-3.5 h-3.5" /> },
            { id: 'privacy',     label: { en: 'Privacy',  th: 'ความเป็นส่วนตัว' }, icon: <Shield className="w-3.5 h-3.5" /> },
          ] as const).map(tab => (
            <a
              key={tab.id}
              href={`#settings-${tab.id}`}
              className="flex items-center gap-1.5 whitespace-nowrap rounded-full border border-white/10 px-3 py-1.5 text-xs font-medium text-white/60 transition-colors hover:border-[rgba(201,150,12,0.4)] hover:text-[#E8B020] flex-shrink-0"
            >
              {tab.icon}
              {tab.label[locale]}
            </a>
          ))}
        </nav>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-10 pb-24">
        {/* General Section */}
        <section id="settings-general" className="scroll-mt-24">
          <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-[#C9960C] mb-4">{l.sections.general}</h2>
          <Card className="p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">{l.locale} <Globe className="inline w-4 h-4 ml-1" /></label>
              <LocaleSwitcher />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">{locale === 'th' ? 'สกุลเงิน' : 'Currency'} <span className="text-white/40 text-xs ml-1">{locale === 'th' ? '(คัดเลือกด้วยตนเอง)' : '(manual override)'}</span></label>
              <p className="text-xs text-white/40 mb-3">{locale === 'th' ? 'คัดเลือกอัตโนมัติจะใช้ตำแหน่งของคุณ — หรือคัดเลือกสกุลเงินที่จะแสดง' : 'Auto uses your detected location — or pin a currency to display everywhere'}</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {CURRENCY_OPTIONS.map((opt) => (
                  <button
                    key={opt.code ?? 'auto'}
                    type="button"
                    onClick={() => setOverride(opt.code)}
                    className={`flex items-center justify-center rounded-xl border px-3 py-2 text-sm font-medium transition-all ${
                      override === opt.code
                        ? 'border-[#C9960C] bg-[rgba(201,150,12,0.15)] text-[#E8B020]'
                        : 'border-white/10 bg-white/4 text-white/50 hover:border-white/20 hover:text-white/80'
                    }`}
                  >
                    <span>{opt.label[locale]}</span>
                  </button>
                ))}
              </div>
            </div>
          </Card>
        </section>

        {/* ── PROFILE SECTION ── */}
        <section id="settings-profile" className="scroll-mt-24">
          <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-[#C9960C] mb-4">
            {locale === 'th' ? 'โปรไฟล์' : 'Profile'}
          </h2>
          <Card className="p-4 space-y-4">
            {profile?.answers ? (
              <>
                <div className="flex items-center gap-3 p-3 bg-white/4 rounded-xl border border-white/8">
                  <div className="w-10 h-10 rounded-full bg-[#C9960C]/20 flex items-center justify-center text-[#E8B020] font-bold text-lg flex-shrink-0">
                    💰
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-white truncate">
                      {override ?? profile.answers.currency ?? 'THB'} {locale === 'th' ? 'โปรไฟล์' : 'Profile'}
                    </p>
                    <p className="text-xs text-white/50 mt-0.5">
                      {locale === 'th' ? 'รายรับต่อเดือน: ' : 'Monthly income: '}
                      <span className="text-[#E8B020] font-mono">
                        {typeof profile.answers.income === 'number' ? profile.answers.income.toLocaleString() : '—'}
                      </span>
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm text-white/50">{locale === 'th' ? 'ยังไม่ได้ตั้งค่าโปรไฟล์' : 'No profile set up yet'}</p>
            )}
            <button
              type="button"
              onClick={() => { clearProfile?.(); router.push('/dashboard'); }}
              className="flex w-full items-center gap-2 rounded-xl border border-[rgba(201,150,12,0.3)] bg-[rgba(201,150,12,0.08)] px-4 py-3 text-sm font-medium text-[#E8B020] transition-colors hover:bg-[rgba(201,150,12,0.15)]"
            >
              🔄 {locale === 'th' ? 'เริ่มวิซาร์ดตั้งค่าใหม่อีกครั้ง' : 'Re-run Setup Wizard'}
            </button>
          </Card>
        </section>

        {/* ── DISPLAY SECTION ── */}
        <section id="settings-display" className="scroll-mt-24">
          <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-[#C9960C] mb-4">
            {locale === 'th' ? 'การแสดงผล' : 'Display'}
          </h2>
          <Card className="p-4 space-y-6">
            {/* Graph Type */}
            <div>
              <p className="text-sm font-medium text-white mb-1">{locale === 'th' ? 'รูปแบบกราฟ' : 'Chart Style'}</p>
              <p className="text-xs text-white/40 mb-3">{locale === 'th' ? 'ใช้กับแผงภาพรวมงบประมาณ' : 'Applied to the Budget Overview panel'}</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {([
                  { type: 'bar'   as GraphType, icon: <BarChart2 className="w-5 h-5" />,  label: { th: 'แท่ง',   en: 'Bar'   } },
                  { type: 'line'  as GraphType, icon: <TrendingUp className="w-5 h-5" />, label: { th: 'เส้น',   en: 'Line'  } },
                  { type: 'pie'   as GraphType, icon: <PieChart className="w-5 h-5" />,   label: { th: 'วงกลม', en: 'Pie'   } },
                  { type: 'donut' as GraphType, icon: <Circle className="w-5 h-5" />,     label: { th: 'โดนัท',  en: 'Donut' } },
                ]).map(({ type, icon, label }) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setGraphType(type)}
                    className={`flex flex-col items-center gap-2 rounded-xl border py-4 px-2 text-sm font-semibold transition-all ${
                      graphType === type
                        ? 'border-[#C9960C] bg-[rgba(201,150,12,0.15)] text-[#E8B020]'
                        : 'border-white/10 bg-white/4 text-white/50 hover:border-white/20 hover:text-white/80'
                    }`}
                  >
                    {icon}
                    <span>{label[locale]}</span>
                  </button>
                ))}
              </div>
            </div>
            {/* Accent Color */}
            <div>
              <p className="text-sm font-medium text-white mb-1">{locale === 'th' ? 'สีหลัก' : 'Accent Color'}</p>
              <p className="text-xs text-white/40 mb-3">{locale === 'th' ? 'เปลี่ยนสีธีมทันที' : 'Changes theme color instantly'}</p>
              <div className="flex gap-3">
                {([
                  { color: 'gold'    as const, hex: '#C9960C', label: { th: 'ทอง',    en: 'Gold'    } },
                  { color: 'amber'   as const, hex: '#E8A020', label: { th: 'อำพัน',  en: 'Amber'   } },
                  { color: 'emerald' as const, hex: '#2DB870', label: { th: 'มรกต',   en: 'Emerald' } },
                ]).map(({ color, hex, label }) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setAccentColor(color)}
                    title={label[locale]}
                    className={`flex flex-col items-center gap-1.5 rounded-xl border px-4 py-3 text-xs font-medium transition-all ${
                      accentColor === color
                        ? 'border-white/60 ring-2 ring-offset-1 ring-offset-black'
                        : 'border-white/15 hover:border-white/30'
                    }`}
                  >
                    <span className="w-6 h-6 rounded-full block" style={{ backgroundColor: hex }} />
                    <span className="text-white/70">{label[locale]}</span>
                  </button>
                ))}
              </div>
            </div>
          </Card>
        </section>

        {/* ── NEWS FLOW SECTION ── */}
        <section id="settings-news" className="scroll-mt-24">
          <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-[#C9960C] mb-4">
            {locale === 'th' ? 'กรองข่าว Market Watch' : 'News Flow — Market Watch'}
          </h2>
          <Card className="p-4">
            <p className="text-sm text-white/60 mb-4">
              {locale === 'th'
                ? 'เลือกหมวดข่าวที่ต้องการแสดงในแผง Market Watch กดปิดหมวดที่ไม่ต้องการ'
                : 'Choose which news categories appear in Market Watch. Tap to disable.'}
            </p>
            <div className="flex flex-wrap gap-2">
              {ALL_GENRES.map((genre: NewsGenre) => {
                const enabled = isGenreEnabled(genre);
                const meta: Record<NewsGenre, { th: string; en: string; emoji: string }> = {
                  finance:  { th: 'การเงิน',     en: 'Finance',  emoji: '📈' },
                  economy:  { th: 'เศรษฐกิจ',    en: 'Economy',  emoji: '⚡' },
                  local:    { th: 'ท้องถิ่น',    en: 'Local',    emoji: '📍' },
                  eco_tips: { th: 'เคล็ดลับ',    en: 'Tips',     emoji: '💡' },
                  fuel:     { th: 'น้ำมัน',      en: 'Fuel',     emoji: '⛽' },
                  deals:    { th: 'โปรโมชั่น',   en: 'Deals',    emoji: '🛍️' },
                };
                return (
                  <button
                    key={genre}
                    type="button"
                    onClick={() => toggleGenre(genre)}
                    className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all ${
                      enabled
                        ? 'border-[rgba(201,150,12,0.4)] bg-[rgba(201,150,12,0.12)] text-[#E8B020]'
                        : 'border-white/10 bg-white/4 text-white/35 line-through'
                    }`}
                  >
                    <span>{meta[genre].emoji}</span>
                    <span>{meta[genre][locale]}</span>
                  </button>
                );
              })}
            </div>
          </Card>
        </section>

        {/* Preferences Section */}
        <section id="settings-preferences" className="scroll-mt-24">
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
              <Toggle checked={voiceSettings.enabled} onCheckedChange={handleVoiceToggle} disabled={!isSupported} />
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
        <section id="settings-data" className="scroll-mt-24">
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
              <p className="text-sm text-white/50 mb-4">{locale === 'th' ? 'ซิงค์โปรไฟล์และสแนปช็อตของคุณไปยังระบบคลาวด์ (ไม่ใช่บอร์ดคู่)' : 'Sync your profile & daily snapshot to the cloud (not the couple board)'}</p>
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
        <section id="settings-shared" className="scroll-mt-24">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-amber-400 mb-4">{l.sharedBoard}</h2>
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
                    <p className="text-xs text-white/50">{locale === 'th' ? `บอร์ด: ${shared.boardId}` : `Board: ${shared.boardId}`}</p>
                  </div>
                </div>
                {shared.lastSyncedAt && (
                  <p className="text-xs text-white/50">
                    {l.lastSynced}: {format(new Date(shared.lastSyncedAt), locale === 'th' ? 'd MMM yyyy HH:mm' : 'MMM d, yyyy HH:mm')}
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
                      {copied ? (locale === 'th' ? 'คัดลอกแล้ว!' : 'Copied!') : l.copyCode}
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

          <Card className="p-4 border-amber-400/20 bg-amber-400/5">
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

        {/* Privacy Section */}
        <section id="settings-privacy" className="scroll-mt-24">
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
              {commitment && profile && (
                <div className="bg-black/30 rounded-xl p-3 text-sm">
                  <p className="text-white/70">
                    {locale === 'th'
                      ? `คุณเลือกลด: ${commitment.expenseKey} | ประหยัดต่อเดือน: ${formatMoney(commitment.estimatedMonthlyCost, override ?? profile.answers.currency ?? 'THB', 'th')}`
                      : `You chose: ${commitment.expenseKey} | Monthly savings: ${formatMoney(commitment.estimatedMonthlyCost, override ?? profile.answers.currency ?? 'THB', 'en')}`}
                  </p>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-white/10">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-amber-400" />
                  <p className="text-sm font-medium text-white">{locale === 'th' ? 'รหัสผ่าน' : 'Password'}</p>
                </div>
                <button
                  type="button"
                  onClick={() => router.push('/reset')}
                  className="text-xs font-semibold text-amber-400 hover:text-amber-300"
                >
                  {locale === 'th' ? 'เปลี่ยนรหัสผ่าน' : 'Change password'}
                </button>
              </div>
              <p className="text-xs text-white/50">
                {locale === 'th'
                  ? 'รีเซ็ตรหัสผ่านด้วยลิงก์ในหน้าสign-in หรือใช้ฟอร์มด้านล่าง'
                  : 'Reset via the sign-in reset flow, or use the form below.'}
              </p>
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
