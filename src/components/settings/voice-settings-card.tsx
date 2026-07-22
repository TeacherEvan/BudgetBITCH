'use client';

import { Volume2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Toggle } from '@/components/ui/toggle';
import { Slider } from '@/components/ui/slider';
import type { VoiceSettings } from '@/hooks/use-voice';

interface VoiceSettingsCardProps {
  locale: 'th' | 'en';
  voiceSettings: VoiceSettings;
  updateVoiceSettings: (settings: Partial<VoiceSettings>) => void;
  toggleVoice: () => void;
  isSupported: boolean;
}

export function VoiceSettingsCard({
  locale,
  voiceSettings,
  updateVoiceSettings,
  toggleVoice,
  isSupported,
}: VoiceSettingsCardProps) {
  const l = {
    th: {
      section: 'การตั้งค่าส่วนตัว',
      voice: 'เสียงช่วยแนะนำ',
      voiceRate: 'ความเร็วพูด',
      voicePitch: 'ระดับเสียง',
      supported: 'รองรับในเบราว์เซอร์นี้',
      notSupported: 'ไม่รองรับ',
    },
    en: {
      section: 'Preferences',
      voice: 'Voice Guidance',
      voiceRate: 'Speech Rate',
      voicePitch: 'Pitch',
      supported: 'Supported in this browser',
      notSupported: 'Not supported',
    },
  }[locale];

  return (
    <section id="settings-preferences" className="scroll-mt-24">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-amber-400 mb-4">
        {l.section}
      </h2>
      <Card className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Volume2 className="w-5 h-5 text-amber-400" />
            <div>
              <p className="font-medium text-white">{l.voice}</p>
              <p className="text-xs text-white/50">
                {isSupported ? l.supported : l.notSupported}
              </p>
            </div>
          </div>
          <Toggle
            checked={voiceSettings.enabled}
            onCheckedChange={toggleVoice}
            disabled={!isSupported}
          />
        </div>

        {voiceSettings.enabled && (
          <div className="space-y-4 pt-2 border-t border-white/10">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                {l.voiceRate}: {voiceSettings.rate.toFixed(1)}x
              </label>
              <Slider
                value={voiceSettings.rate}
                onValueChange={(v) => updateVoiceSettings({ rate: v })}
                min={0.5}
                max={2}
                step={0.1}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                {l.voicePitch}: {voiceSettings.pitch.toFixed(1)}x
              </label>
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
      </Card>
    </section>
  );
}
