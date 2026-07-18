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
  const [requesting, setRequesting] = useState(false);
  const [unsupported, setUnsupported] = useState(
    () => typeof navigator === 'undefined' || !('geolocation' in navigator)
  );

  const labels = {
    th: {
      title: 'ตำแหน่งที่ตั้ง',
      subtitle: 'อนุญาตให้เข้าถึงตำแหน่งเพื่อรับข่าว และราคา/โปรโมชั่นในพื้นที่',
      disclaimer: {
        icon: '🛡️',
        title: 'ข้อความเกี่ยวกับความเป็นส่วนตัว',
        points: [
          'เราใช้ตำแหน่งของคุณ เพื่อแสดงราคาน้ำมัน ข่าวเศรษฐกิจท้องถิ่น และโปรโมชั่นร้านค้าใกล้เคียงเท่านั้น',
          'ไม่เก็บข้อมูลตำแหน่งเพื่อการตลาด ไม่ขายข้อมูล ไม่ติดตามการเคลื่อนไหว',
          'ตำแหน่งของคุณไม่ออกจากเครื่องของคุณ เราดูแค่เมือง/พื้นที่ ไม่ใช่บ้านหรือถนนที่อยู่',
          'คุณปิดได้ทุกเมื่อ แตะไอคอนโลกที่เมนูด้านบน',
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
          'We use your location ONLY for local fuel prices, economic news, and nearby store deals',
          'No marketing use. We never sell your location. Ever.',
          'Your location never leaves your phone. We only check your city/area — not your exact street or home address.',
          'Turn it off anytime: tap the globe icon in the top menu.',
        ],
      },
      grantButton: 'Allow Location',
      skipButton: 'Skip for now',
      grantedText: 'Location allowed ✓',
    },
  };

  const l = labels[locale];

  const handleGrantLocation = () => {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      setUnsupported(true);
      speak(locale === 'th' ? 'เบราว์เซอร์นี้ไม่รองรับตำแหน่ง' : 'This browser does not support location');
      return;
    }
    setRequesting(true);
    // Call getCurrentPosition directly. This is the only Geolocation API
    // supported across Chrome, Firefox, Safari (macOS + iOS) and all mobile
    // browsers. It triggers the native permission prompt on its own.
    navigator.geolocation.getCurrentPosition(
      () => {
        setRequesting(false);
        setLocationGranted(true);
        onChange('locationConsent', true);
        const msg = locale === 'th' ? 'อนุญาตตำแหน่งแล้ว' : 'Location permission granted';
        speak(msg);
      },
      (err) => {
        setRequesting(false);
        let msg: string;
        switch (err.code) {
          case err.PERMISSION_DENIED:
            msg = locale === 'th' ? 'การเข้าถึงตำแหน่งถูกปฏิเสธ' : 'Location access denied';
            break;
          case err.POSITION_UNAVAILABLE:
            msg = locale === 'th' ? 'ไม่พบตำแหน่งปัจจุบัน' : 'Location unavailable';
            break;
          case err.TIMEOUT:
            msg = locale === 'th' ? 'หมดเวลาการเข้าถึงตำแหน่ง' : 'Location request timed out';
            break;
          default:
            msg = locale === 'th' ? 'ไม่สามารถเข้าถึงตำแหน่งได้' : 'Unable to access location';
        }
        speak(msg);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
    );
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
          disabled={disabled || unsupported || (!disclaimerRead && !value) || requesting}
          className="w-full"
          isLoading={requesting}
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

      {unsupported && (
        <p className="text-center text-amber-400 text-sm" role="alert">
          {locale === 'th'
            ? 'เบราว์เซอร์นี้ไม่รองรับตำแหน่ง คุณสามารถข้ามได้'
            : 'This browser does not support location. You can skip.'}
        </p>
      )}
    </div>
  );
}

import { Toggle } from '@/components/ui/toggle';
