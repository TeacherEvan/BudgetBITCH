// components/wizard/steps/step-phone-internet.tsx
'use client';

import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';

interface StepPhoneInternetProps {
  locale: 'th' | 'en';
  value: number;
  onChange: (key: 'phoneInternet', value: number) => void;
  error?: string | null;
  disabled?: boolean;
}

export function StepPhoneInternet({ locale, value, onChange, error, disabled }: StepPhoneInternetProps) {
  const labels = {
    th: {
      title: 'โทรศัพท์ / อินเตอร์เน็ต',
      subtitle: 'มือถือ เน็ตบ้าน เน็ตโทรศัพท์',
      placeholder: 'เช่น 800',
      helper: 'ค่าโทรศัพท์และอินเตอร์เน็ตต่อเดือน (บาท)',
    },
    en: {
      title: 'Phone / Internet',
      subtitle: 'Mobile plan, home internet, data',
      placeholder: 'e.g. 800',
      helper: 'Monthly phone and internet bill (THB)',
    },
  };

  const l = labels[locale];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-white">{l.title}</h2>
        <p className="mt-1 text-white/60">{l.subtitle}</p>
      </div>

      <div className="space-y-4">
        <Input
          label={l.helper}
          type="number"
          inputMode="decimal"
          min="0"
          step="100"
          value={value || ''}
          onChange={(e) => onChange('phoneInternet', Number(e.target.value) || 0)}
          placeholder={l.placeholder}
          disabled={disabled}
          error={error || undefined}
          className="text-2xl font-mono text-center"
        />

        <Slider
          label=""
          min={0}
          max={5000}
          step={100}
          value={value}
          onValueChange={(v) => onChange('phoneInternet', v)}
          disabled={disabled}
          showValue
          valueFormatter={(v) => `฿${v.toLocaleString()}`}
        />

        <p className="text-xs text-white/50 text-center">
          {locale === 'th' ? 'รวมโทรศัพท์มือถือ + เน็ตบ้าน' : 'Mobile plan + home internet combined'}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        {[
          { value: 0, label: 'Wifi Only' },
          { value: 500, label: 'Basic' },
          { value: 1000, label: 'Standard' },
          { value: 2000, label: 'Unlimited' },
        ].map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => onChange('phoneInternet', value)}
            disabled={disabled}
            className={`px-3 py-2 rounded-xl text-xs font-medium transition ${
              value === value 
                ? 'bg-amber-400 text-slate-950' 
                : 'bg-white/5 text-white/70 hover:bg-white/10'
            }`}
          >
            ฿{value.toLocaleString()}<br/>{label}
          </button>
        ))}
      </div>
    </div>
  );
}