// app/settings/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Globe, Volume2, Palette, Trash2, AlertCircle, Check, Shield, Download, Upload } from 'lucide-react';
import { useConvexAuth } from '@convex-dev/auth/react';
import { useWizardProfile } from '@/hooks/use-local-db';
import { useVoice } from '@/hooks/use-voice';
import { useCriticalExpense } from '@/hooks/use-critical-expense';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Toggle } from '@/components/ui/toggle';
import { format } from 'date-fns';

interface SettingsPageProps {
  locale: 'th' | 'en';
}

export function SettingsPage({ locale = 'en' }: SettingsPageProps) {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const { clear: clearProfile } = useWizardProfile();
  const { settings: voiceSettings, updateSettings: updateVoiceSettings, toggleVoice, isSupported } = useVoice(
    locale === 'th' ? 'th-TH' : 'en-US'
  );
  const { commitment } = useCriticalExpense();
  
  const [theme, setTheme] = useState<'amber' | 'dark' | 'gold'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('budgetbitch:theme') as 'amber' | 'dark' | 'gold') || 'amber';
    }
    return 'amber';
  });

  const [lastSync, setLastSync] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('budgetbitch:lastSync');
    }
    return null;
  });
  const [syncing, setSyncing] = useState(false);

  // Apply theme
  useEffect(() => {
    document.documentElement.classList.remove('theme-amber', 'theme-dark', 'theme-gold');
    document.documentElement.classList.add(`theme-${theme}`);
    localStorage.setItem('budgetbitch:theme', theme);
  }, [theme]);

  const handleLocaleChange = (newLocale: 'th' | 'en') => {
    localStorage.setItem('budgetbitch:locale', newLocale);
    window.location.href = window.location.pathname;
  };

  const handleVoiceToggle = () => {
    toggleVoice();
  };

  const handleThemeChange = (newTheme: 'amber' | 'dark' | 'gold') => {
    setTheme(newTheme);
  };

  const handleResetData = () => {
    if (confirm(locale === 'th' ? 'ลบข้อมูลทั้งหมด? จะไม่สามารถกู้คืนได้' : 'Delete all data? This cannot be undone')) {
      clearProfile();
      localStorage.clear();
      window.location.href = '/';
    }
  };

  const handleExportData = async () => {
    const db = await import('@/lib/db/local-db').then(m => m.getDB());
    const allData: Record<string, unknown> = {};

    const stores = ['wizardProfile', 'expenses', 'budgets', 'bills', 'savingsGoals', 'netWorthSnapshots', 'debts', 'criticalExpenseCommitments'] as const;

    for (const store of stores) {
      allData[store] = await db.getAll(store);
    }
    
    const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `budgetbitch-backup-${format(new Date(), 'yyyy-MM-dd')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportData = (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        const db = await import('@/lib/db/local-db').then(m => m.getDB());

        for (const [store, items] of Object.entries(data)) {
          const validStores = ['wizardProfile', 'expenses', 'budgets', 'bills', 'savingsGoals', 'netWorthSnapshots', 'debts', 'criticalExpenseCommitments'] as const;
          if (validStores.includes(store as typeof validStores[number])) {
            for (const item of items as unknown[]) {
              // @ts-expect-error - dynamic store/item type from import
              await db.put(store as typeof validStores[number], item);
            }
          }
        }
        alert(locale === 'th' ? 'นำเข้าข้อมูลสำเร็จ!' : 'Data imported successfully!');
        window.location.reload();
      } catch {
        alert(locale === 'th' ? 'ไฟล์ไม่ถูกต้อง' : 'Invalid file');
      }
    };
    reader.readAsText(file);
  };

  const handleSyncNow = async () => {
    setSyncing(true);
    try {
      await import('@/lib/convex/sync-snapshots').then(m => m.syncDailySnapshot());
      const now = new Date().toISOString();
      setLastSync(now);
      localStorage.setItem('budgetbitch:lastSync', now);
      alert(locale === 'th' ? 'ซิงค์ข้อมูลสำเร็จ!' : 'Sync complete!');
    } catch {
      alert(locale === 'th' ? 'ซิงค์ล้มเหลว' : 'Sync failed');
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
      themeAmber: 'อำพรises (ค่าเริ่มต้น)',
      themeDark: 'ดำเข้ม',
      themeGold: 'ทองวัดไทย',
      resetData: 'ล้างข้อมูลทั้งหมด',
      exportData: 'ส่งออกข้อมูล (JSON)',
      importData: 'นำเข้าข้อมูล (JSON)',
      lastSync: 'ซิงค์ล่าสุด',
      syncNow: 'ซิงค์ตอนนี้',
      privacyDisclaimer: 'ข้อความยอมรับความเป็นส่วนตัว',
      criticalExpense: 'ค่าใช้จ่ายที่ต้องลด',
      commitStatus: 'สถานะการยอมรับ',
      committed: 'ยอมรับแล้ว',
      notCommitted: 'ยังไม่ได้เลือก',
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
      exportData: 'Export Data (JSON)',
      importData: 'Import Data (JSON)',
      lastSync: 'Last Sync',
      syncNow: 'Sync Now',
      privacyDisclaimer: 'Privacy Disclaimer',
      criticalExpense: 'Cut One Expense',
      commitStatus: 'Commitment Status',
      committed: 'Committed',
      notCommitted: 'Not Selected',
    },
  };

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
              <Select
                value={locale}
                onChange={(e) => handleLocaleChange(e.target.value as 'th' | 'en')}
                options={[
                  { value: 'th', label: 'ไทย 🇹🇭' },
                  { value: 'en', label: 'English 🇺🇸' },
                ]}
              />
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
              <div className="grid gap-3 sm:grid-cols-3">
                <Button
                  variant={theme === 'amber' ? 'primary' : 'secondary'}
                  onClick={() => handleThemeChange('amber')}
                  className="text-left"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-amber-400" />
                    <span className="font-medium">{l.themeAmber}</span>
                    {theme === 'amber' && <Check className="w-4 h-4 ml-auto text-amber-400" />}
                  </div>
                </Button>
                <Button
                  variant={theme === 'dark' ? 'primary' : 'secondary'}
                  onClick={() => handleThemeChange('dark')}
                  className="text-left"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gray-900 border border-white/20" />
                    <span className="font-medium">{l.themeDark}</span>
                    {theme === 'dark' && <Check className="w-4 h-4 ml-auto text-amber-400" />}
                  </div>
                </Button>
                <Button
                  variant={theme === 'gold' ? 'primary' : 'secondary'}
                  onClick={() => handleThemeChange('gold')}
                  className="text-left"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-r from-amber-400 to-yellow-600" />
                    <span className="font-medium">{l.themeGold}</span>
                    {theme === 'gold' && <Check className="w-4 h-4 ml-auto text-amber-400" />}
                  </div>
                </Button>
              </div>
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
              <Button variant="secondary" onClick={handleExportData} className="w-full" disabled={syncing}>
                {syncing ? (locale === 'th' ? 'กำลังซิงค์...' : 'Syncing...') : l.exportData}
              </Button>
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
                onChange={(e) => e.target.files?.[0] && handleImportData(e.target.files[0])}
                className="w-full text-sm text-white/50 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-amber-400/20 file:text-amber-400 hover:file:bg-amber-400/30 cursor-pointer"
              />
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
                    : (locale === 'th' ? 'ยังไม่เคยซิงค์' : 'Never synced')}
                </span>
              </div>
              <p className="text-sm text-white/50 mb-4">{locale === 'th' ? 'ซิงค์ข้อมูลโปรไฟล์และสแนปช็อตไปยัง Convex' : 'Sync profile and daily snapshot to Convex'}</p>
              <Button variant="primary" onClick={handleSyncNow} disabled={syncing} className="w-full">
                {syncing ? (locale === 'th' ? 'กำลังซิงค์...' : 'Syncing...') : l.syncNow}
              </Button>
            </Card>

            <Card className="p-4 sm:col-span-2 border-rose-400/30 bg-rose-400/5">
              <div className="flex items-center gap-3 mb-3">
                <Trash2 className="w-5 h-5 text-rose-400" />
                <h3 className="font-semibold text-white">{l.resetData}</h3>
              </div>
              <p className="text-sm text-rose-400/80 mb-4">{locale === 'th' ? 'ลบข้อมูลทั้งหมด: โปรไฟล์, ค่าใช้จ่าย, งบประมาณ, เป้าหมาย, ฯลฯ จะไม่สามารถกู้คืนได้' : 'Delete ALL data: profile, expenses, budgets, goals, etc. This cannot be undone.'}</p>
              <Button variant="secondary" onClick={handleResetData} className="w-full bg-rose-400/10 hover:bg-rose-400/20 border-rose-400/30 text-rose-400">
                {l.resetData}
              </Button>
            </Card>
          </div>
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
    </div>
  );
}