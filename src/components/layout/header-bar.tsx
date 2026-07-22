// components/layout/header-bar.tsx
'use client';

import { Wrench, Settings, BarChart2, PieChart, TrendingUp, Circle, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
import { Modal } from '@/components/ui/modal';
import { Toggle } from '@/components/ui/toggle';
import { useDisplayPrefs, type GraphType } from '@/hooks/use-display-prefs';
import { useNewsPrefs, ALL_GENRES, type NewsGenre } from '@/hooks/use-news-prefs';
import { SyncStatusIndicator } from '@/components/ui/sync-status-indicator';

interface HeaderBarProps {
  locale: 'th' | 'en';
  onLocaleChange: (locale: 'th' | 'en') => void;
  voiceEnabled?: boolean;
  onVoiceToggle?: () => void;
}

const GRAPH_OPTIONS: { type: GraphType; icon: React.ReactNode; label: { th: string; en: string } }[] = [
  { type: 'bar',    icon: <BarChart2 className="w-4 h-4" />,   label: { th: 'แท่ง',   en: 'Bar' } },
  { type: 'line',   icon: <TrendingUp className="w-4 h-4" />,  label: { th: 'เส้น',   en: 'Line' } },
  { type: 'pie',    icon: <PieChart className="w-4 h-4" />,    label: { th: 'วงกลม', en: 'Pie' } },
  { type: 'donut',  icon: <Circle className="w-4 h-4" />,      label: { th: 'โดนัท',  en: 'Donut' } },
];

const GENRE_LABELS: Record<NewsGenre, { th: string; en: string; emoji: string }> = {
  finance:  { th: 'การเงิน',     en: 'Finance',  emoji: '📈' },
  economy:  { th: 'เศรษฐกิจ',    en: 'Economy',  emoji: '⚡' },
  local:    { th: 'ท้องถิ่น',    en: 'Local',    emoji: '📍' },
  eco_tips: { th: 'เคล็ดลับ',    en: 'Tips',     emoji: '💡' },
  fuel:     { th: 'น้ำมัน',      en: 'Fuel',     emoji: '⛽' },
  deals:    { th: 'โปรโมชั่น',   en: 'Deals',    emoji: '🛍️' },
};

export function HeaderBar({ locale, onLocaleChange, voiceEnabled = false, onVoiceToggle }: HeaderBarProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { graphType, setGraphType } = useDisplayPrefs();
  const { isGenreEnabled, toggleGenre } = useNewsPrefs();

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-[rgba(201,150,12,0.18)] bg-black/60 px-4 py-3 backdrop-blur-[24px] [box-shadow:0_1px_0_rgba(201,150,12,0.08)]">
      {/* Left: TH | EN segmented control */}
      <div className="flex items-center">
        <div className="flex rounded-full border border-[rgba(201,150,12,0.30)] bg-white/5 p-0.5">
          {(['th', 'en'] as const).map((l) => {
            const active = locale === l;
            return (
              <button
                key={l}
                type="button"
                onClick={() => onLocaleChange(l)}
                aria-pressed={active}
                className={`min-h-[32px] rounded-full px-3 text-xs font-bold uppercase tracking-[0.08em] transition-colors ${
                  active ? 'bg-[#C9960C] text-[#080600]' : 'text-[rgba(248,243,232,0.6)] hover:text-[#F8F3E8]'
                }`}
              >
                {l === 'th' ? 'TH' : 'EN'}
              </button>
            );
          })}
        </div>
      </div>

      {/* Center: Gold gradient title — click to return Home (dashboard) */}
      <Link
        href="/dashboard"
        aria-label={locale === 'th' ? 'หน้าแรก' : 'Home'}
        className="no-underline"
      >
        <h1
          className="font-display text-sm sm:text-xl font-bold uppercase text-center"
          style={{
            letterSpacing: '0.2em',
            backgroundImage: 'linear-gradient(90deg, #C9960C, #F5D742)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
          }}
        >
          BudgetBITCH
        </h1>
      </Link>

      {/* Right: Sync Status + Voice pill + Settings wrench */}
      <div className="flex items-center gap-3">
        <SyncStatusIndicator locale={locale} />
        <div className="hidden items-center gap-2 md:flex">
          <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[rgba(248,243,232,0.5)]">Voice</span>
          <Toggle
            checked={voiceEnabled}
            onCheckedChange={onVoiceToggle}
            size="sm"
            aria-label="Toggle voice guidance"
          />
        </div>
        <button
          type="button"
          onClick={() => setSettingsOpen(true)}
          aria-label="Quick settings"
          id="header-settings-btn"
          className="flex h-9 w-9 items-center justify-center rounded-xl text-[rgba(248,243,232,0.7)] transition-transform duration-200 hover:rotate-90 hover:text-[#E8B020]"
        >
          <Wrench className="h-5 w-5" />
        </button>
      </div>

      {/* Quick Settings Modal */}
      <Modal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        title={locale === 'th' ? 'ตั้งค่าด่วน' : 'Quick Settings'}
        description={locale === 'th' ? 'ปรับแต่งการแสดงผลและข้อมูล' : 'Adjust display & data preferences'}
        size="md"
      >
        <div className="space-y-6">

          {/* Language */}
          <section>
            <h3 className="mb-3 text-xs font-bold uppercase tracking-[0.15em] text-[#C9960C]">
              {locale === 'th' ? 'ภาษา' : 'Language'}
            </h3>
            <div className="flex rounded-xl border border-[rgba(201,150,12,0.25)] bg-white/4 p-1 gap-1">
              {(['th', 'en'] as const).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => { onLocaleChange(l); setSettingsOpen(false); }}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                    locale === l
                      ? 'bg-[#C9960C] text-[#080600]'
                      : 'text-white/60 hover:text-white hover:bg-white/8'
                  }`}
                >
                  {l === 'th' ? '🇹🇭 ภาษาไทย' : '🇺🇸 English'}
                </button>
              ))}
            </div>
          </section>

          {/* Voice */}
          <section>
            <h3 className="mb-3 text-xs font-bold uppercase tracking-[0.15em] text-[#C9960C]">
              {locale === 'th' ? 'เสียงช่วยแนะนำ' : 'Voice Assistant'}
            </h3>
            <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/4 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-white">{locale === 'th' ? 'เปิดใช้เสียงช่วย' : 'Enable voice guidance'}</p>
                <p className="text-xs text-white/50 mt-0.5">{locale === 'th' ? 'วิซาร์ดจะอ่านคำถามออกเสียง' : 'Wizard reads questions aloud'}</p>
              </div>
              <Toggle checked={voiceEnabled} onCheckedChange={onVoiceToggle} size="sm" />
            </div>
          </section>

          {/* Chart Type */}
          <section>
            <h3 className="mb-3 text-xs font-bold uppercase tracking-[0.15em] text-[#C9960C]">
              {locale === 'th' ? 'รูปแบบกราฟ' : 'Chart Style'}
            </h3>
            <div className="grid grid-cols-4 gap-1.5">
              {GRAPH_OPTIONS.map(({ type, icon, label }) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setGraphType(type)}
                  className={`flex flex-col items-center gap-1.5 rounded-xl border py-3 px-2 text-xs font-semibold transition-all ${
                    graphType === type
                      ? 'border-[#C9960C] bg-[#C9960C]/15 text-[#E8B020]'
                      : 'border-white/10 bg-white/4 text-white/50 hover:border-white/20 hover:text-white/80'
                  }`}
                >
                  {icon}
                  <span>{label[locale]}</span>
                </button>
              ))}
            </div>
          </section>

          {/* News Flow */}
          <section>
            <h3 className="mb-1 text-xs font-bold uppercase tracking-[0.15em] text-[#C9960C]">
              {locale === 'th' ? 'กรองข่าว Market Watch' : 'Market Watch Filter'}
            </h3>
            <p className="text-xs text-white/40 mb-3">
              {locale === 'th' ? 'กดปิดหมวดที่ไม่ต้องการ' : 'Tap to hide categories'}
            </p>
            <div className="flex flex-wrap gap-2">
              {ALL_GENRES.map((genre) => {
                const enabled = isGenreEnabled(genre);
                const meta = GENRE_LABELS[genre];
                return (
                  <button
                    key={genre}
                    type="button"
                    onClick={() => toggleGenre(genre)}
                    className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                      enabled
                        ? 'border-[rgba(201,150,12,0.4)] bg-[rgba(201,150,12,0.12)] text-[#E8B020]'
                        : 'border-white/10 bg-white/4 text-white/35 line-through'
                    }`}
                  >
                    <span>{meta.emoji}</span>
                    <span>{meta[locale]}</span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Divider + Accounts + Full Settings links */}
          <div className="border-t border-white/10 pt-4 space-y-2">
            <Link
              href="/accounts"
              onClick={() => setSettingsOpen(false)}
              className="flex w-full items-center justify-between rounded-xl border border-[rgba(201,150,12,0.25)] bg-[rgba(201,150,12,0.10)] px-4 py-3 text-sm font-medium text-white/80 transition-colors hover:border-[rgba(201,150,12,0.45)] hover:text-white group"
            >
              <div className="flex items-center gap-2">
                <span className="text-[#E8B020]">🏦</span>
                {locale === 'th' ? 'บัญชี' : 'Accounts'}
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-white/30 group-hover:text-[#C9960C] transition-colors" />
            </Link>
            <Link
              href="/settings"
              onClick={() => setSettingsOpen(false)}
              className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/4 px-4 py-3 text-sm font-medium text-white/70 transition-colors hover:border-[rgba(201,150,12,0.3)] hover:text-white group"
            >
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-[#C9960C]" />
                {locale === 'th' ? 'การตั้งค่าทั้งหมด' : 'All Settings'}
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-white/30 group-hover:text-[#C9960C] transition-colors" />
            </Link>
          </div>
        </div>
      </Modal>
    </header>
  );
}
