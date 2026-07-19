// components/layout/header-bar.tsx
'use client';

import { Wrench } from 'lucide-react';
import { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Toggle } from '@/components/ui/toggle';

interface HeaderBarProps {
  locale: 'th' | 'en';
  onLocaleChange: (locale: 'th' | 'en') => void;
  voiceEnabled: boolean;
  onVoiceToggle: () => void;
}

export function HeaderBar({ locale, onLocaleChange, voiceEnabled, onVoiceToggle }: HeaderBarProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);

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

      {/* Center: Gold gradient title */}
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

      {/* Right: Voice pill + Settings */}
      <div className="flex items-center gap-3">
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
          aria-label="Settings"
          className="flex h-9 w-9 items-center justify-center rounded-xl text-[rgba(248,243,232,0.7)] transition-transform duration-200 hover:rotate-90 hover:text-[#E8B020]"
        >
          <Wrench className="h-5 w-5" />
        </button>
      </div>

      {/* Settings Modal */}
      <Modal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        title="Settings"
        description="Manage your preferences"
        size="md"
      >
        <div className="space-y-6">
          <section>
            <h3 className="mb-3 text-sm font-medium text-white/70">Language</h3>
            <div className="flex gap-2">
              <Button
                variant={locale === 'th' ? 'primary' : 'secondary'}
                onClick={() => { onLocaleChange('th'); setSettingsOpen(false); }}
                className="flex-1"
              >
                🇹🇭 Thai
              </Button>
              <Button
                variant={locale === 'en' ? 'primary' : 'secondary'}
                onClick={() => { onLocaleChange('en'); setSettingsOpen(false); }}
                className="flex-1"
              >
                🇺🇸 English
              </Button>
            </div>
          </section>

          <section>
            <h3 className="mb-3 text-sm font-medium text-white/70">Voice Assistant</h3>
            <Toggle
              checked={voiceEnabled}
              onCheckedChange={onVoiceToggle}
              label="Enable voice guidance"
              description="Wizard will read questions aloud"
            />
          </section>

          <section>
            <h3 className="mb-3 text-sm font-medium text-white/70">Data</h3>
            <Button variant="secondary" className="w-full justify-start">Export Data (JSON)</Button>
            <Button variant="secondary" className="mt-2 w-full justify-start">Export Data (CSV)</Button>
            <Button variant="danger" className="mt-2 w-full justify-start">Reset All Data</Button>
          </section>

          <section>
            <h3 className="mb-3 text-sm font-medium text-white/70">Privacy</h3>
            <p className="mb-3 text-sm text-white/70">
              Your budget data stays on this device. Daily snapshots are sent to Convex for backup only.
            </p>
            <Button variant="secondary" className="w-full justify-start">View Privacy Disclaimer</Button>
          </section>
        </div>
      </Modal>
    </header>
  );
}
