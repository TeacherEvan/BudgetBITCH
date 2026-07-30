// components/wizard/steps/step-transport.tsx
'use client';

import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { useCurrency } from '@/hooks/use-currency';

interface StepTransportProps {
  locale: string;
  value: number;
  onChange: (key: 'transport', value: number) => void;
  error?: string | null;
  disabled?: boolean;
}

export function StepTransport({ value, onChange, error, disabled }: StepTransportProps) {
  const fmt = useCurrency();
  const labels = {
    en: {
      title: 'Transport Cost',
      subtitle: 'BTS/MRT, bus, motorbike, fuel, Grab/Bolt',
      placeholder: 'e.g. 3000',
      helper: 'Monthly transport total',
    },
  };

  const l = labels.en;

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
          onChange={(e) => onChange('transport', Number(e.target.value) || 0)}
          placeholder={l.placeholder}
          disabled={disabled}
          error={error || undefined}
          className="text-2xl font-mono text-center"
        />

        <Slider
          label=""
          min={0}
          max={20000}
          step={500}
          value={value}
          onValueChange={(v) => onChange('transport', v)}
          disabled={disabled}
          showValue
          valueFormatter={(v) => fmt(v)}
        />

        <p className="text-xs text-white/50 text-center">
          {'Include BTS/MRT, bus, motorbike, fuel, Grab/Bolt'}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        {[
          { value: 0, label: 'Walk/WFH' },
          { value: 1500, label: 'BTS/Bus' },
          { value: 4000, label: 'Mixed' },
          { value: 10000, label: 'Car/Grab' },
        ].map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => onChange('transport', value)}
            disabled={disabled}
            className={`px-3 py-2 rounded-xl text-xs font-medium transition ${
              value === value 
                ? 'bg-amber-400 text-slate-950' 
                : 'bg-white/5 text-white/70 hover:bg-white/10'
            }`}
          >
            {fmt(value)}<br/>{label}
          </button>
        ))}
      </div>
    </div>
  );
}