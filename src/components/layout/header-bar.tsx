// components/layout/header-bar.tsx
'use client';

import { Wrench, Settings, BarChart2, PieChart, TrendingUp, Circle, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
import { Modal } from '@/components/ui/modal';
import { useDisplayPrefs, type GraphType } from '@/hooks/use-display-prefs';
import { useNewsPrefs, ALL_GENRES, type NewsGenre } from '@/hooks/use-news-prefs';
import { SyncStatusIndicator } from '@/components/ui/sync-status-indicator';

interface HeaderBarProps {
  locale: string;
  onLocaleChange: (locale: string) => void;
}

const GRAPH_OPTIONS: { type: GraphType; icon: React.ReactNode; label: { en: string } }[] = [
  { type: 'bar',    icon: <BarChart2 className="w-4 h-4" />,   label: { en: 'Bar' } },
  { type: 'line',   icon: <TrendingUp className="w-4 h-4" />,  label: { en: 'Line' } },
  { type: 'pie',    icon: <PieChart className="w-4 h-4" />,    label: { en: 'Pie' } },
  { type: 'donut',  icon: <Circle className="w-4 h-4" />,      label: { en: 'Donut' } },
];

const GENRE_LABELS: Record<NewsGenre, { en: string; emoji: string }> = {
  finance:  { en: 'Finance',  emoji: '📈' },
  economy:  { en: 'Economy',  emoji: '⚡' },
  local:    { en: 'Local',    emoji: '📍' },
  eco_tips: { en: 'Tips',     emoji: '💡' },
  fuel:     { en: 'Fuel',     emoji: '⛽' },
  deals:    { en: 'Deals',    emoji: '🛍️' },
};

const LANGUAGES: { code: string; flag: string; label: string; short: string }[] = [
  { code: 'en', flag: '🇺🇸', label: 'English',    short: 'EN' },
  { code: 'es', flag: '🇪🇸', label: 'Español',    short: 'ES' },
  { code: 'fr', flag: '🇫🇷', label: 'Français',   short: 'FR' },
  { code: 'de', flag: '🇩🇪', label: 'Deutsch',    short: 'DE' },
  { code: 'pt', flag: '🇵🇹', label: 'Português',  short: 'PT' },
  { code: 'zh', flag: '🇨🇳', label: '中文',        short: 'ZH' },
];

export function HeaderBar({ locale, onLocaleChange }: HeaderBarProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const activeLang = LANGUAGES.find((l) => l.code === locale) ?? LANGUAGES[0];
  const { graphType, setGraphType } = useDisplayPrefs();
  const { isGenreEnabled, toggleGenre } = useNewsPrefs();

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between gap-2 sm:gap-3 border-b border-[rgba(201,150,12,0.18)] bg-black/60 px-3 sm:px-4 py-3 backdrop-blur-[24px] [box-shadow:0_1px_0_rgba(201,150,12,0.08)]">
      {/* Left: language selector */}
      <div className="relative flex items-center">
        <button
          type="button"
          onClick={() => setLangOpen((o) => !o)}
          aria-expanded={langOpen}
          aria-haspopup="listbox"
          aria-label={'Select language'}
          className="flex min-h-[32px] items-center gap-1.5 rounded-full border border-[rgba(201,150,12,0.30)] bg-white/5 px-3 text-xs font-bold uppercase tracking-[0.08em] text-[#F8F3E8] transition-colors hover:border-[rgba(201,150,12,0.5)]"
        >
          <span>{activeLang.flag}</span>
          <span>{activeLang.short}</span>
          <span className="text-[9px] text-[rgba(248,243,232,0.5)]">▾</span>
        </button>
        {langOpen && (
          <div
            role="listbox"
            className="absolute left-0 top-full z-50 mt-1.5 w-44 overflow-hidden rounded-xl border border-[rgba(201,150,12,0.3)] bg-[#0d0a02] shadow-xl"
          >
            {LANGUAGES.map((l) => (
              <button
                key={l.code}
                type="button"
                role="option"
                aria-selected={locale === l.code}
                onClick={() => { onLocaleChange(l.code); setLangOpen(false); }}
                className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors ${
                  locale === l.code
                    ? 'bg-[#C9960C]/20 text-[#F5D742] font-semibold'
                    : 'text-white/70 hover:bg-white/5 hover:text-white'
                }`}
              >
                <span>{l.flag}</span>
                <span>{l.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Center: Gold gradient title — click to return Home (dashboard) */}
      <Link
        href="/dashboard"
        aria-label={'Budget-BOSS Home'}
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
          Budget-BOSS
        </h1>
      </Link>

      {/* Right: Sync Status + Quick Add + Settings wrench */}
      <div className="flex items-center gap-2.5">
        <SyncStatusIndicator locale={locale} />
        <Link
          href="/quick-add"
          aria-label={'Quick Add'}
          className="flex h-9 items-center gap-1.5 rounded-xl border border-[rgba(201,150,12,0.4)] bg-[rgba(201,150,12,0.15)] px-3 text-xs font-bold text-[#F5D742] transition-colors hover:bg-[rgba(201,150,12,0.3)]"
        >
          <span className="text-sm font-black">+</span>
          <span className="hidden sm:inline">{'Quick Add'}</span>
        </Link>
        <button
          type="button"
          onClick={() => setSettingsOpen(true)}
          aria-label={'Quick settings'}
          aria-expanded={settingsOpen}
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
        title={'Quick Settings'}
        description={'Adjust display & data preferences'}
        size="md"
      >
        <div className="space-y-6">

          {/* Language */}
          <section>
            <h3 className="mb-3 text-xs font-bold uppercase tracking-[0.15em] text-[#C9960C]">
              {'Language'}
            </h3>
            <div className="grid grid-cols-3 gap-1.5">
              {LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => { onLocaleChange(l.code); setSettingsOpen(false); }}
                  aria-pressed={locale === l.code}
                  className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-semibold transition-all ${
                    locale === l.code
                      ? 'bg-[#C9960C] text-[#080600]'
                      : 'bg-white/4 text-white/60 hover:text-white hover:bg-white/8'
                  }`}
                >
                  <span>{l.flag}</span>
                  <span>{l.short}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Chart Type */}
          <section>
            <h3 className="mb-3 text-xs font-bold uppercase tracking-[0.15em] text-[#C9960C]">
              {'Chart Style'}
            </h3>
            <div className="grid grid-cols-4 gap-1.5">
              {GRAPH_OPTIONS.map(({ type, icon, label }) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setGraphType(type)}
                  aria-pressed={graphType === type}
                  className={`flex flex-col items-center gap-1.5 rounded-xl border py-3 px-2 text-xs font-semibold transition-all ${
                    graphType === type
                      ? 'border-[#C9960C] bg-[#C9960C]/15 text-[#E8B020]'
                      : 'border-white/10 bg-white/4 text-white/50 hover:border-white/20 hover:text-white/80'
                  }`}
                >
                  {icon}
                  <span>{label.en}</span>
                </button>
              ))}
            </div>
          </section>

          {/* News Flow */}
          <section>
            <h3 className="mb-1 text-xs font-bold uppercase tracking-[0.15em] text-[#C9960C]">
              {'Market Watch Filter'}
            </h3>
            <p className="text-xs text-white/40 mb-3">
              {'Tap to hide categories'}
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
                    aria-pressed={enabled}
                    className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                      enabled
                        ? 'border-[rgba(201,150,12,0.4)] bg-[rgba(201,150,12,0.12)] text-[#E8B020]'
                        : 'border-white/10 bg-white/4 text-white/35 line-through'
                    }`}
                  >
                    <span>{meta.emoji}</span>
                    <span>{meta.en}</span>
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
                {'Accounts'}
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
                {'All Settings'}
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-white/30 group-hover:text-[#C9960C] transition-colors" />
            </Link>
          </div>
        </div>
      </Modal>
    </header>
  );
}
