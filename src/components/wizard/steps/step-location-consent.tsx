// components/wizard/steps/step-location-consent.tsx
'use client';

import { useState } from 'react';
import { MapPin, Shield, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface StepLocationConsentProps {
  locale: 'th' | 'en';
  value: boolean;
  onChange: (key: 'locationConsent', value: boolean) => void;
  error?: string | null;
  disabled?: boolean;
  speak: (text: string) => void;
}

export function StepLocationConsent({ locale, value, onChange, error, disabled, speak }: StepLocationConsentProps) {
  const [disclaimerRead, setDisclaimerRead] = useState(false);
  const [locationGranted, setLocationGranted] = useState(false);

  const labels = {
    th: {
      title: 'ตำแหน่งที่ตั้ง',
      subtitle: 'อนุญาตให้เข้าถึงตำแหน่งเพื่อรับข่าว และราคา/โปรโมชั่นในพื้นที่',
      disclaimer: {
        icon: '🛡️',
        title: 'ข้อความเกี่ยวกับความเป็นส่วนตัว',
        points: [
          'เราใช้ตำแหน่งของคุณ เพื่อแสดงราคาน้ำมัน ข่าวเศรษฐกิจท้องถิ่น และโปรโมชั่น 7-Eleven ใกล้บ้านเท่านั้น',
          'ไม่เก็บข้อมูลตำแหน่งเพื่อการตลาด ไม่ขายข้อมูล ไม่ติดตามการเคลื่อนไหว',
          'ข้อมูลตำแหน่งเก็บอยู่เครื่องเท่านั้น ส่งขึ้น Convex เฉพาะ snapshot รายวัน (ไม่มีพิกัด)',
          'คุณสามารถปิดการเข้าถึงตำแหน่งได้ทุกเมื่อใน Settings (ไอคอนโลกด้านบน)',
        ],
      },
      grantButton: 'อนุญาตตำแหน่ง',
      skipButton: 'ข้ามขั้นตอนนี้',
      grantedText: 'อนุญาตแล้ว ✓',
    },
    en: {
      title: 'Location Permission',
      subtitle: 'Allow location for local fuel prices, news, and nearby deals',
      disclaimer: {
        icon: '🛡️',
        title: 'Privacy Disclaimer',
        points: [
          'We use your location ONLY for local fuel prices, economic news, and nearby 7-Eleven deals',
          'No marketing use. No data selling. No tracking.',
          'Location data stays on device. Only daily snapshots (no coordinates) sent to Convex.',
          'You can revoke location access anytime in Settings (globe icon in header).',
        ],
      },
      grantButton: 'Allow Location',
      skipButton: 'Skip for now',
      grantedText: 'Location allowed ✓',
    },
  };

  const l = labels[locale];

  const handleGrantLocation = async () => {
    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
      if (permission.state === 'granted') {
        setLocationGranted(true);
        onChange('locationConsent', true);
        if (value !== true) {
          const msg = locale === 'th' ? 'อนุญาตตำแหน่งแล้ว' : 'Location permission granted';
          speak(msg);
        }
      } else if (permission.state === 'prompt') {
        navigator.geolocation.getCurrentPosition(
          () => {
            setLocationGranted(true);
            onChange('locationConsent', true);
            const msg = locale === 'th' ? 'อนุญาตตำแหน่งแล้ว' : 'Location permission granted';
            speak(msg);
          },
          (err) => {
            const msg = locale === 'th' ? 'ไม่สามารถเข้าถึงตำแหน่งได้' : 'Unable to access location';
            speak(msg);
          }
        );
      } else {
        const msg = locale === 'th' ? 'การเข้าถึงตำแหน่งถูกปฏิเสธ' : 'Location access denied';
        speak(msg);
      }
    } catch (err) {
      const msg = locale === 'th' ? 'เกิดข้อผิดพลาด' : 'Error occurred';
      speak(msg);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-white">{l.title}</h2>
        <p className="mt-1 text-white/60">{l.subtitle}</p>
      </div>

      {/* Privacy Disclaimer */}
      <div className="bg-amber-400/10 border border-amber-400/30 rounded-xl p-4 space-y-3">
        <div className="flex items-start gap-3">
          <span className="text-2xl">{l.disclaimer.icon}</span>
          <div>
            <h3 className="font-semibold text-amber-400">{l.disclaimer.title}</h3>
            <ul className="mt-2 space-y-1.5 text-sm text-white/80">
              {l.disclaimer.points.map((point, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-amber-400">•</span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        <Toggle
          checked={disclaimerRead}
          onCheckedChange={setDisclaimerRead}
          label={locale === 'th' ? 'ฉันอ่านและเข้าใจข้อความด้านบนแล้ว' : 'I have read and understand the above'}
          disabled={disabled}
        />
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <Button
          variant={value ? 'primary' : (disclaimerRead ? 'primary' : 'secondary')}
          onClick={handleGrantLocation}
          disabled={disabled || (!disclaimerRead && !value)}
          className="w-full"
          isLoading={!value && !locationGranted}
        >
          <MapPin className="h-5 w-5 mr-2" />
          {value ? l.grantedText : l.grantButton}
        </Button>

        <Button
          variant="ghost"
          onClick={() => {
            onChange('locationConsent', false);
            const msg = locale === 'th' ? 'ข้ามการอนุญาตตำแหน่ง' : 'Skipping location permission';
            speak(msg);
          }}
          disabled={disabled}
          className="w-full"
        >
          <Shield className="h-5 w-5 mr-2" />
          {l.skipButton}
        </Button>
      </div>

      {/* Status */}
      {value && (
        <div className="flex items-center justify-center gap-2 p-3 bg-emerald-400/10 border border-emerald-400/30 rounded-xl">
          <CheckCircle className="h-5 w-5 text-emerald-400" />
          <span className="text-sm font-medium text-emerald-400">
            {locale === 'th' ? 'อนุญาตตำแหน่งแล้ว - จะใช้สำหรับข่าวและราคาในพื้นที่' : 'Location allowed - used for local news and prices'}
          </span>
        </div>
      )}

      {error && (
        <p className="text-center text-rose-400 text-sm" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

import { Toggle } from '@/components/ui/toggle';