// components/layout/header-bar.tsx
'use client';

import { Globe, Wrench } from 'lucide-react';
import { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Toggle } from '@/components/ui/toggle';

interface HeaderBarProps {
  locale: 'th' | 'en';
  onLocaleChange: (locale: 'th' | 'en') => void;
  onSettingsOpen: () => void;
  voiceEnabled: boolean;
  onVoiceToggle: () => void;
}

export function HeaderBar({ locale, onLocaleChange, onSettingsOpen, voiceEnabled, onVoiceToggle }: HeaderBarProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Prefer the caller-supplied handler (e.g. dashboard mobile sheet); fall back
  // to the in-header settings modal when none is provided.
  const openSettings = () => {
    if (onSettingsOpen) {
      onSettingsOpen();
    } else {
      setSettingsOpen(true);
    }
  };

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between gap-3 px-4 py-3 bg-black/80 backdrop-blur-xl border-b border-white/10">
      {/* Left: Globe + Locale indicator */}
      <div className="flex items-center gap-2">
        <div className="relative group">
          <button
            onClick={() => onLocaleChange(locale === 'th' ? 'en' : 'th')}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
            aria-label={`Current language: ${locale === 'th' ? 'Thai' : 'English'}. Click to change.`}
          >
            <Globe className="h-5 w-5 text-white" />
          </button>
          <span className="absolute -top-2 -right-2 text-[10px] font-bold bg-amber-400 text-slate-950 px-1.5 py-0.5 rounded-full">
            {locale.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Center: App Title */}
      <h1 className="text-lg font-semibold text-white hidden sm:block">
        BudgetBITCH
      </h1>

      {/* Right: Voice Toggle + Settings */}
      <div className="flex items-center gap-2">
        <Toggle
          checked={voiceEnabled}
          onCheckedChange={onVoiceToggle}
          label="Voice"
          size="sm"
          className="hidden md:flex"
        />
        <Button
          variant="ghost"
          size="sm"
          onClick={openSettings}
          className="p-2"
          aria-label="Settings"
        >
          <Wrench className="h-5 w-5" />
        </Button>
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
            <h3 className="text-sm font-medium text-white/70 mb-3">Language</h3>
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
            <h3 className="text-sm font-medium text-white/70 mb-3">Voice Assistant</h3>
            <Toggle
              checked={voiceEnabled}
              onCheckedChange={onVoiceToggle}
              label="Enable voice guidance"
              description="Wizard will read questions aloud"
            />
          </section>

          <section>
            <h3 className="text-sm font-medium text-white/70 mb-3">Data</h3>
            <Button variant="secondary" className="w-full justify-start">
              Export Data (JSON)
            </Button>
            <Button variant="secondary" className="w-full justify-start mt-2">
              Export Data (CSV)
            </Button>
            <Button variant="danger" className="w-full justify-start mt-2">
              Reset All Data
            </Button>
          </section>

          <section>
            <h3 className="text-sm font-medium text-white/70 mb-3">Privacy</h3>
            <p className="text-sm text-white/70 mb-3">
              Your budget data stays on this device. Daily snapshots are sent to Convex for backup only.
            </p>
            <Button variant="secondary" className="w-full justify-start">
              View Privacy Disclaimer
            </Button>
          </section>
        </div>
      </Modal>
    </header>
  );
}