'use client';

import { Globe, Palette, BarChart2, TrendingUp, PieChart, Circle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import type { CurrencyOverride } from '@/hooks/use-currency-override';
import type { GraphType } from '@/hooks/use-display-prefs';
import { ALL_GENRES, type NewsGenre } from '@/hooks/use-news-prefs';

const CURRENCY_OPTIONS: { code: CurrencyOverride; label: { en: string } }[] = [
  { code: null,      label: { en: 'Auto (from location)' } },
  { code: 'USD',     label: { en: 'US Dollar (USD)' } },
  { code: 'GBP',     label: { en: 'British Pound (GBP)' } },
  { code: 'EUR',     label: { en: 'Euro (EUR)' } },
  { code: 'JPY',     label: { en: 'Japanese Yen (JPY)' } },
  { code: 'SGD',     label: { en: 'Singapore Dollar (SGD)' } },
  { code: 'AUD',     label: { en: 'Australian Dollar (AUD)' } },
  { code: 'MYR',     label: { en: 'Malaysian Ringgit (MYR)' } },
  { code: 'CAD',     label: { en: 'Canadian Dollar (CAD)' } },
  { code: 'INR',     label: { en: 'Indian Rupee (INR)' } },
  { code: 'CNY',     label: { en: 'Chinese Yuan (CNY)' } },
  { code: 'ZAR',     label: { en: 'South African Rand (ZAR)' } },
  { code: 'BRL',     label: { en: 'Brazilian Real (BRL)' } },
  { code: 'INR',     label: { en: 'Indian Rupee (INR)' } },
  { code: 'CHF',     label: { en: 'Swiss Franc (CHF)' } },
  { code: 'KRW',     label: { en: 'Korean Won (KRW)' } },
];

interface PreferenceSettingsCardProps {
  locale: string;
  override: CurrencyOverride;
  setOverride: (code: CurrencyOverride) => void;
  graphType: GraphType;
  setGraphType: (type: GraphType) => void;
  accentColor: 'gold' | 'amber' | 'emerald';
  setAccentColor: (color: 'gold' | 'amber' | 'emerald') => void;
  isGenreEnabled: (genre: NewsGenre) => boolean;
  toggleGenre: (genre: NewsGenre) => void;
}

export function PreferenceSettingsCard({
  override,
  setOverride,
  graphType,
  setGraphType,
  accentColor,
  setAccentColor,
  isGenreEnabled,
  toggleGenre,
}: PreferenceSettingsCardProps) {
  return (
    <>
      {/* General Section */}
      <section id="settings-general" className="scroll-mt-24">
        <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-[#C9960C] mb-4">
          {'General'}
        </h2>
        <Card className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              {'Language'} <Globe className="inline w-4 h-4 ml-1" />
            </label>
            <p className="text-sm text-white/60">
              {'Set once on first launch'}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              {'Currency'}{' '}
              <span className="text-white/40 text-xs ml-1">
                {'(manual override)'}
              </span>
            </label>
            <p className="text-xs text-white/40 mb-3">
              {'Auto uses your detected location — or pin a currency to display everywhere'}
            </p>
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
                  <span>{opt.label.en}</span>
                </button>
              ))}
            </div>
          </div>
        </Card>
      </section>

      {/* Display Section */}
      <section id="settings-display" className="scroll-mt-24">
        <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-[#C9960C] mb-4">
          {'Display'}
        </h2>
        <Card className="p-4 space-y-6">
          {/* Graph Type */}
          <div>
            <p className="text-sm font-medium text-white mb-1">
              {'Chart Style'}
            </p>
            <p className="text-xs text-white/40 mb-3">
              {'Applied to the Budget Overview panel'}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {([
                { type: 'bar' as GraphType, icon: <BarChart2 className="w-5 h-5" />, label: { en: 'Bar' } },
                { type: 'line' as GraphType, icon: <TrendingUp className="w-5 h-5" />, label: { en: 'Line' } },
                { type: 'pie' as GraphType, icon: <PieChart className="w-5 h-5" />, label: { en: 'Pie' } },
                { type: 'donut' as GraphType, icon: <Circle className="w-5 h-5" />, label: { en: 'Donut' } },
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
                  <span>{label.en}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Accent Color */}
          <div>
            <p className="text-sm font-medium text-white mb-1">
              {'Accent Color'}
            </p>
            <p className="text-xs text-white/40 mb-3">
              {'Changes theme color instantly'}
            </p>
            <div className="flex gap-3">
              {([
                { color: 'gold' as const, hex: '#C9960C', label: { en: 'Gold' } },
                { color: 'amber' as const, hex: '#E8A020', label: { en: 'Amber' } },
                { color: 'emerald' as const, hex: '#2DB870', label: { en: 'Emerald' } },
              ]).map(({ color, hex, label }) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setAccentColor(color)}
                  title={label.en}
                  className={`flex flex-col items-center gap-1.5 rounded-xl border px-4 py-3 text-xs font-medium transition-all ${
                    accentColor === color
                      ? 'border-white/60 ring-2 ring-offset-1 ring-offset-black'
                      : 'border-white/15 hover:border-white/30'
                  }`}
                >
                  <span className="w-6 h-6 rounded-full block" style={{ backgroundColor: hex }} />
                  <span className="text-white/70">{label.en}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Theme */}
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              {'Theme'} <Palette className="inline w-4 h-4 ml-1" />
            </label>
            <ThemeToggle />
          </div>
        </Card>
      </section>

      {/* News Flow Section */}
      <section id="settings-news" className="scroll-mt-24">
        <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-[#C9960C] mb-4">
          {'News Flow — Market Watch'}
        </h2>
        <Card className="p-4">
          <p className="text-sm text-white/60 mb-4">
            {'Choose which news categories appear in Market Watch. Tap to disable.'}
          </p>
          <div className="flex flex-wrap gap-2">
            {ALL_GENRES.map((genre: NewsGenre) => {
              const enabled = isGenreEnabled(genre);
              const meta: Record<NewsGenre, { en: string; emoji: string }> = {
                finance:  { en: 'Finance',  emoji: '📈' },
                economy:  { en: 'Economy',  emoji: '⚡' },
                local:    { en: 'Local',    emoji: '📍' },
                eco_tips: { en: 'Tips',     emoji: '💡' },
                fuel:     { en: 'Fuel',     emoji: '⛽' },
                deals:    { en: 'Deals',    emoji: '🛍️' },
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
                  <span>{meta[genre].en}</span>
                </button>
              );
            })}
          </div>
        </Card>
      </section>
    </>
  );
}
