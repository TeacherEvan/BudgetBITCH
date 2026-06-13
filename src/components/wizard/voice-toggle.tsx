// components/wizard/voice-toggle.tsx
'use client';

import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { Toggle } from '@/components/ui/toggle';

interface VoiceToggleProps {
  enabled: boolean;
  onToggle: () => void;
  locale: 'th' | 'en';
}

export function VoiceToggle({ enabled, onToggle, locale }: VoiceToggleProps) {
  return (
    <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-30">
      <Toggle
        checked={enabled}
        onCheckedChange={onToggle}
        label={locale === 'th' ? 'เสียง' : 'Voice'}
        description={enabled 
          ? (locale === 'th' ? 'อ่านคำถามออกเสียง' : 'Reading questions aloud')
          : (locale === 'th' ? 'ปิดเสียงแล้ว' : 'Voice off')}
        size="md"
        className="bg-black/80 backdrop-blur-xl p-3 rounded-xl border border-white/10 shadow-xl"
      />
    </div>
  );
}