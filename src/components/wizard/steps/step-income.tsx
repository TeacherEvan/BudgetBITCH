// components/wizard/steps/step-income.tsx
'use client';

import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';

interface StepIncomeProps {
  locale: 'th' | 'en';
  value: number;
  onChange: (key: 'income', value: number) => void;
  error?: string | null;
  disabled?: boolean;
}

export function StepIncome({ locale, value, onChange, error, disabled }: StepIncomeProps) {
  const t = useTranslations('wizard.income');

  const labels = {
    th: {
      title: 'รายได้ต่อเดือน',
      subtitle: 'เงินเดือน รายได้เสริม เงินทุน รวมทั้งหมด',
      placeholder: 'เช่น 35000',
      helper: 'กรอกรายได้รวมต่อเดือน (บาท)',
    },
    en: {
      title: 'Monthly Income',
      subtitle: 'Salary, side income, investments - all combined',
      placeholder: 'e.g. 35000',
      helper: 'Enter total monthly income (THB)',
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
          step="1000"
          value={value || ''}
          onChange={(e) => onChange('income', Number(e.target.value) || 0)}
          placeholder={l.placeholder}
          disabled={disabled}
          error={error || undefined}
          className="text-2xl font-mono text-center"
        />

        <Slider
          label=""
          min={5000}
          max={500000}
          step={1000}
          value={value}
          onValueChange={(v) => onChange('income', v)}
          disabled={disabled}
          showValue
          valueFormatter={(v) => `฿${v.toLocaleString()}`}
        />

        <p className="text-xs text-white/50 text-center">
          {locale === 'th' 
            ? 'เลื่อนเพื่อปรับ หรือพิมพ์ค่าที่แน่นอน' 
            : 'Slide to adjust or type exact amount'}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        {[
          { value: 15000, label: 'Entry' },
          { value: 35000, label: 'Average' },
          { value: 80000, label: 'Senior' },
        ].map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => onChange('income', value)}
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