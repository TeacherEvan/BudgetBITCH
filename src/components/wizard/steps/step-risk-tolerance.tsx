// components/wizard/steps/step-risk-tolerance.tsx
'use client';

interface StepRiskToleranceProps {
  locale: 'th' | 'en';
  value: 'low' | 'medium' | 'high';
  onChange: (key: 'riskTolerance', value: 'low' | 'medium' | 'high') => void;
  error?: string | null;
  disabled?: boolean;
}

export function StepRiskTolerance({ locale, value, onChange, error, disabled }: StepRiskToleranceProps) {
  const labels = {
    th: {
      title: 'จุดรับความเสี่ยง',
      subtitle: 'คุณสบายใจกับความเสี่ยงของเงินได้แค่ไหน',
      options: {
        low: { label: 'ต่ำ', desc: 'อยากปลอดภัย ออมคงที่ ไม่อยากเสี่ยง', icon: '🛡️' },
        medium: { label: 'กลาง', desc: 'รับความเสี่ยงบ้าง เพื่อผลตอบแทนที่ดีกว่า', icon: '⚖️' },
        high: { label: 'สูง', desc: 'รับความเสี่ยงสูง เพื่อโอกาสผลตอบแทนสูง', icon: '🚀' },
      },
    },
    en: {
      title: 'Risk Tolerance',
      subtitle: 'How comfortable are you with financial risk?',
      options: {
        low: { label: 'Low', desc: 'Prefer safety, stable savings, avoid risk', icon: '🛡️' },
        medium: { label: 'Medium', desc: 'Accept some risk for better returns', icon: '⚖️' },
        high: { label: 'High', desc: 'Comfortable with high risk for high reward', icon: '🚀' },
      },
    },
  };

  const l = labels[locale];
  const options = ['low', 'medium', 'high'] as const;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-white">{l.title}</h2>
        <p className="mt-1 text-white/60">{l.subtitle}</p>
      </div>

      <div className="space-y-3">
        {options.map((opt) => {
          const option = l.options[opt];
          const isSelected = value === opt;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onChange('riskTolerance', opt)}
              disabled={disabled}
              className={`
                w-full p-4 rounded-xl border-2 transition-all text-left
                ${isSelected 
                  ? 'border-amber-400 bg-amber-400/10' 
                  : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              <div className="flex items-start gap-4">
                <span className="text-2xl mt-1">{option.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-white">{option.label}</span>
                    {isSelected && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-medium">
                        {locale === 'th' ? 'เลือกแล้ว' : 'Selected'}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-white/60">{option.desc}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {error && (
        <p className="text-center text-rose-400 text-sm" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}