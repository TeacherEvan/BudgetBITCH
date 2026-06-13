// components/wizard/steps/step-rent.tsx
'use client';

import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';

interface StepRentProps {
  locale: 'th' | 'en';
  value: number;
  onChange: (key: 'rent', value: number) => void;
  error?: string | null;
  disabled?: boolean;
}

export function StepRent({ locale, value, onChange, error, disabled }: StepRentProps) {
  const labels = {
    th: {
      title: 'ค่าเช่า / ค่าที่อยู่อาศัย',
      subtitle: 'คอนโด แป้ท์เมนท์ บ้าน หรือผ่อนบ้าน',
      placeholder: 'เช่น 12000',
      helper: 'ค่าเช่าหรือผ่อนบ้านต่อเดือน (บาท)',
    },
    en: {
      title: 'Rent / Housing Cost',
      subtitle: 'Condo, apartment, house rent or mortgage',
      placeholder: 'e.g. 12000',
      helper: 'Monthly rent or mortgage payment (THB)',
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
          step="500"
          value={value || ''}
          onChange={(e) => onChange('rent', Number(e.target.value) || 0)}
          placeholder={l.placeholder}
          disabled={disabled}
          error={error || undefined}
          className="text-2xl font-mono text-center"
        />

        <Slider
          label=""
          min={0}
          max={100000}
          step={500}
          value={value}
          onValueChange={(v) => onChange('rent', v)}
          disabled={disabled}
          showValue
          valueFormatter={(v) => `฿${v.toLocaleString()}`}
        />

        <p className="text-xs text-white/50 text-center">
          {locale === 'th' ? 'รวมค่าไฟฟ้า/น้ำได้หรือแยกต่างหากก็ได้' : 'Include utilities or keep separate'}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        {[
          { value: 0, label: 'Own/Free' },
          { value: 5000, label: 'Budget' },
          { value: 15000, label: 'Standard' },
          { value: 30000, label: 'Premium' },
        ].map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => onChange('rent', value)}
            disabled={disabled}
            className={`px-3 py-2 rounded-xl text-xs font-medium transition ${
              value === value 
                ? 'bg-amber-400 text-slate-950' 
                : 'bg-white/5 text-white/70 hover:bg-white/10'
            }`}
          >
            {value === 0 ? '🏠' : `฿${value.toLocaleString()}`}<br/>{label}
          </button>
        ))}
      </div>
    </div>
  );
}