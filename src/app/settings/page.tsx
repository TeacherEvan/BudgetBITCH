// app/settings/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import {
  Globe,
  Palette,
  Shield,
  Download,
  Users,
  Settings,
  ArrowLeft,
  User,
  Newspaper,
  LogOut,
} from 'lucide-react';
import { useAuthActions } from '@convex-dev/auth/react';
import { useWizardProfile } from '@/hooks/use-local-db';
import { useCriticalExpense } from '@/hooks/use-critical-expense';
import { useSharedBoard } from '@/hooks/use-shared-board';
import { useDisplayPrefs } from '@/hooks/use-display-prefs';
import { useNewsPrefs } from '@/hooks/use-news-prefs';
import { Button } from '@/components/ui/button';
import { RequireAuth } from '@/components/auth/require-auth';
import { useCurrencyOverride } from '@/hooks/use-currency-override';
import { AccountSettingsCard } from '@/components/settings/account-settings-card';
import { PreferenceSettingsCard } from '@/components/settings/preference-settings-card';
import { PartnerSharingCard } from '@/components/settings/partner-sharing-card';
import { DataBackupCard } from '@/components/settings/data-backup-card';

type SettingsLocale = 'th' | 'en';

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
  const { commitment } = useCriticalExpense();
  const shared = useSharedBoard();
  const { graphType, setGraphType, accentColor, setAccentColor } = useDisplayPrefs();
  const { isGenreEnabled, toggleGenre } = useNewsPrefs();
  const { override, setOverride } = useCurrencyOverride();

  const [lastSync, setLastSync] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('budgetbitch:lastSync');
    }
    return null;
  });

  return (
    <RequireAuth>
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
              <h1 className="text-xl font-bold text-white">
                {locale === 'th' ? 'ตั้งค่า' : 'Settings'}
              </h1>
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
          <nav
            aria-label="Settings sections"
            className="max-w-4xl mx-auto px-4 pb-3 flex gap-1 overflow-x-auto scrollbar-none"
          >
            {(
              [
                { id: 'general', label: { en: 'General', th: 'ทั่วไป' }, icon: <Globe className="w-3.5 h-3.5" /> },
                { id: 'profile', label: { en: 'Profile', th: 'โปรไฟล์' }, icon: <User className="w-3.5 h-3.5" /> },
                { id: 'display', label: { en: 'Display', th: 'การแสดงผล' }, icon: <Palette className="w-3.5 h-3.5" /> },
                { id: 'news', label: { en: 'News', th: 'ข่าวสาร' }, icon: <Newspaper className="w-3.5 h-3.5" /> },
                { id: 'preferences', label: { en: 'Preferences', th: 'การตั้งค่า' }, icon: <Settings className="w-3.5 h-3.5" /> },
                { id: 'data', label: { en: 'Data', th: 'ข้อมูล' }, icon: <Download className="w-3.5 h-3.5" /> },
                { id: 'shared', label: { en: 'Shared Board', th: 'บอร์ดคู่' }, icon: <Users className="w-3.5 h-3.5" /> },
                { id: 'privacy', label: { en: 'Privacy', th: 'ความเป็นส่วนตัว' }, icon: <Shield className="w-3.5 h-3.5" /> },
              ] as const
            ).map((tab) => (
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
          <PreferenceSettingsCard
            locale={locale}
            override={override}
            setOverride={setOverride}
            graphType={graphType}
            setGraphType={setGraphType}
            accentColor={accentColor}
            setAccentColor={setAccentColor}
            isGenreEnabled={isGenreEnabled}
            toggleGenre={toggleGenre}
          />

          <AccountSettingsCard
            locale={locale}
            profile={profile}
            override={override}
            clearProfile={clearProfile}
          />

          <PartnerSharingCard
            locale={locale}
            shared={shared}
          />

          <DataBackupCard
            locale={locale}
            lastSync={lastSync}
            setLastSync={setLastSync}
            clearProfile={clearProfile}
            commitment={commitment}
            profile={profile}
            override={override}
          />
        </main>
      </div>
    </RequireAuth>
  );
}
