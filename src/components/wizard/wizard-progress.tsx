// components/wizard/wizard-progress.tsx
'use client';

interface WizardProgressProps {
  currentStep: number;
  totalSteps: number;
  locale: 'th' | 'en';
}

export function WizardProgress({ currentStep, totalSteps, locale }: WizardProgressProps) {
  const progress = ((currentStep + 1) / totalSteps) * 100;

  return (
    <div className="px-4 py-4 border-b border-white/5 bg-black/50">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-white/70">
            {locale === 'th' ? 'ขั้นตอน' : 'Step'} {currentStep + 1} / {totalSteps}
          </span>
          <span className="text-sm font-mono text-amber-400">
            {Math.round(progress)}%
          </span>
        </div>
        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-white/50">
          {Array.from({ length: totalSteps }, (_, i) => (
            <span
              key={i}
              className={`flex-1 text-center transition-colors ${
                i <= currentStep ? 'text-amber-400 font-medium' : 'text-white/30'
              }`}
            >
              {i + 1}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}