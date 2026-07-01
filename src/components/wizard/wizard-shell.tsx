// components/wizard/wizard-shell.tsx
'use client';

import { useState, useCallback, useEffect } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { WizardProfile } from '@/lib/types/budget';
import { saveWizardProfile } from '@/lib/db/local-db';
import { WizardProgress } from './wizard-progress';
import { VoiceToggle } from './voice-toggle';
import { StepIncome } from './steps/step-income';
import { StepRent } from './steps/step-rent';
import { StepTransport } from './steps/step-transport';
import { StepPhoneInternet } from './steps/step-phone-internet';
import { StepSubscriptions } from './steps/step-subscriptions';
import { StepEntertainment } from './steps/step-entertainment';
import { StepHealthcare } from './steps/step-healthcare';
import { StepSavingsRate } from './steps/step-savings-rate';
import { StepRiskTolerance } from './steps/step-risk-tolerance';
import { StepLocationConsent } from './steps/step-location-consent';
import { Button } from '@/components/ui/button';

export type WizardStepId = 
  | 'income' 
  | 'rent' 
  | 'transport' 
  | 'phoneInternet' 
  | 'subscriptions' 
  | 'entertainment' 
  | 'healthcare' 
  | 'savingsRatePct' 
  | 'riskTolerance' 
  | 'locationConsent';

const STEPS: WizardStepId[] = [
  'income', 'rent', 'transport', 'phoneInternet', 'subscriptions',
  'entertainment', 'healthcare', 'savingsRatePct', 'riskTolerance', 'locationConsent'
];

const STEP_LABELS: Record<WizardStepId, { th: string; en: string }> = {
  income: { th: 'รายได้', en: 'Income' },
  rent: { th: 'ค่าเช่า/ที่อยู่อาศัย', en: 'Rent / Housing' },
  transport: { th: 'ค่าเดินทาง', en: 'Transport' },
  phoneInternet: { th: 'โทรศัพท์/อินเตอร์เน็ต', en: 'Phone / Internet' },
  subscriptions: { th: 'สมัครสมาชิก', en: 'Subscriptions' },
  entertainment: { th: 'บันเทิง/ความบันเทิง', en: 'Entertainment' },
  healthcare: { th: 'สุขภาพ/ค่ายา', en: 'Healthcare' },
  savingsRatePct: { th: 'อัตราการออม', en: 'Savings Rate' },
  riskTolerance: { th: 'จุดรับความเสี่ยง', en: 'Risk Tolerance' },
  locationConsent: { th: 'ตำแหน่งที่ตั้ง', en: 'Location' },
};

// Voices for each step
const STEP_VOICE_PROMPTS: Record<WizardStepId, { th: string; en: string }> = {
  income: { 
    th: 'คุณได้รับรายได้เท่าไหร่ต่อเดือน', 
    en: 'How much do you make per month' 
  },
  rent: { 
    th: 'ค่าเช่าหรือค่าที่อยู่อาศัยเท่าไหร่', 
    en: 'How much is your rent or mortgage' 
  },
  transport: { 
    th: 'ค่าเดินทาง BTS รถเมล์ หรือน้ำมันเท่าไหร่', 
    en: 'How much for transport - BTS, bus, or fuel' 
  },
  phoneInternet: { 
    th: 'ค่าโทรศัพท์และอินเตอร์เน็ตเท่าไหร่', 
    en: 'How much for phone and internet' 
  },
  subscriptions: { 
    th: 'ค่าสมัครสมาชิก Netflix Spotify ฟิตเนส เท่าไหร่', 
    en: 'Subscriptions like Netflix, Spotify, gym' 
  },
  entertainment: { 
    th: 'เงินความบันเทิง หนัง กาแฟ เล่นเกม เท่าไหร่', 
    en: 'Entertainment - movies, coffee, games' 
  },
  healthcare: { 
    th: 'ค่ายา ค่าทันตกรรม ค่ารพตาล เท่าไหร่', 
    en: 'Healthcare - meds, dentist, hospital' 
  },
  savingsRatePct: { 
    th: 'อยากออมกี่เปอร์เซ็นต์ของรายได้', 
    en: 'What percentage of income to save' 
  },
  riskTolerance: { 
    th: 'รับความเสี่ยงได้น้อย กลาง หรือมาก', 
    en: 'Low, medium, or high risk tolerance' 
  },
  locationConsent: { 
    th: 'อนุญาตให้เข้าถึงตำแหน่งเพื่อรับข่าว และราคาน้ำมันในพื้นที่', 
    en: 'Allow location for local news and fuel prices' 
  },
};

interface WizardShellProps {
  locale: 'th' | 'en';
  onComplete: () => void;
  voiceEnabled: boolean;
  speak: (text: string) => void;
  isModal?: boolean;
}

export function WizardShell({ locale, onComplete, voiceEnabled, speak, isModal = false }: WizardShellProps) {
  const t = useTranslations('wizard');
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [stepValues, setStepValues] = useState<Partial<WizardProfile['answers']>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const currentStep = STEPS[currentStepIndex];
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === STEPS.length - 1;

  const handleNext = useCallback(async () => {
    const stepKey = STEPS[currentStepIndex] as keyof WizardProfile['answers'];
    const value = stepValues[stepKey];
    
    // Validation
    let isEmpty = false;
    if (value === undefined || value === null) {
      isEmpty = true;
    } else if (typeof value === 'string' && value.trim() === '') {
      isEmpty = true;
    } else if (typeof value === 'number' && isNaN(value)) {
      isEmpty = true;
    }
    
    if (isEmpty) {
      setErrorMessage(locale === 'th' ? 'กรุณากรอกข้อมูลก่อนดำเนินต่อ' : 'Please fill in this step');
      return;
    }

    setErrorMessage(null);

    if (isLastStep) {
      // All steps done - save profile
      setIsSubmitting(true);
      const profile: WizardProfile = {
        completed: true,
        completedAt: new Date().toISOString(),
        version: 1,
        locale,
        answers: stepValues as WizardProfile['answers'],
      };
      await saveWizardProfile(profile);
      setIsSubmitting(false);
      onComplete();
    } else {
      setCurrentStepIndex(prev => prev + 1);
      // Speak next step prompt
      if (voiceEnabled) {
        if (isLastStep) {
          // skip
        } else {
          const nextStep = STEPS[currentStepIndex + 1];
          const prompt = STEP_VOICE_PROMPTS[nextStep][locale];
          setTimeout(() => speak(prompt), 300);
        }
      }
    }
  }, [currentStepIndex, stepValues, isLastStep, locale, voiceEnabled, speak, onComplete]);

  const handleBack = useCallback(() => {
    if (!isFirstStep) {
      setCurrentStepIndex(prev => prev - 1);
      setErrorMessage(null);
    }
  }, [isFirstStep]);

  const handleValueChange = useCallback((key: keyof WizardProfile['answers'], value: WizardProfile['answers'][typeof key]) => {
    setStepValues(prev => ({ ...prev, [key]: value }));
    setErrorMessage(null);
  }, []);

  // Speak current step prompt on mount/step change
  useEffect(() => {
    if (voiceEnabled) {
      const prompt = STEP_VOICE_PROMPTS[currentStep][locale];
      speak(prompt);
    }
  }, [currentStep, voiceEnabled, locale, speak]);

  const renderStep = () => {
    switch (currentStep) {
      case 'income':
        return <StepIncome locale={locale} value={stepValues.income as number} onChange={handleValueChange} error={errorMessage} disabled={isSubmitting} />;
      case 'rent':
        return <StepRent locale={locale} value={stepValues.rent as number} onChange={handleValueChange} error={errorMessage} disabled={isSubmitting} />;
      case 'transport':
        return <StepTransport locale={locale} value={stepValues.transport as number} onChange={handleValueChange} error={errorMessage} disabled={isSubmitting} />;
      case 'phoneInternet':
        return <StepPhoneInternet locale={locale} value={stepValues.phoneInternet as number} onChange={handleValueChange} error={errorMessage} disabled={isSubmitting} />;
      case 'subscriptions':
        return <StepSubscriptions locale={locale} value={stepValues.subscriptions as number} onChange={handleValueChange} error={errorMessage} disabled={isSubmitting} />;
      case 'entertainment':
        return <StepEntertainment locale={locale} value={stepValues.entertainment as number} onChange={handleValueChange} error={errorMessage} disabled={isSubmitting} />;
      case 'healthcare':
        return <StepHealthcare locale={locale} value={stepValues.healthcare as number} onChange={handleValueChange} error={errorMessage} disabled={isSubmitting} />;
      case 'savingsRatePct':
        return <StepSavingsRate locale={locale} value={stepValues.savingsRatePct as number} onChange={handleValueChange} error={errorMessage} disabled={isSubmitting} />;
      case 'riskTolerance':
        return <StepRiskTolerance locale={locale} value={stepValues.riskTolerance as 'low' | 'medium' | 'high'} onChange={handleValueChange} error={errorMessage} disabled={isSubmitting} />;
      case 'locationConsent':
        return <StepLocationConsent locale={locale} value={stepValues.locationConsent as boolean} onChange={handleValueChange} error={errorMessage} disabled={isSubmitting} speak={speak} />;
      default:
        return null;
    }
  };

  return (
    <div className={isModal ? "w-full max-w-lg mx-auto bg-neutral-900 border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col relative overflow-hidden" : "min-h-screen bg-black flex flex-col"}>
      <WizardProgress 
        currentStep={currentStepIndex} 
        totalSteps={STEPS.length} 
        locale={locale} 
      />
      
      <main className="flex-1 flex flex-col p-2 md:p-4">
        <div className="max-w-md mx-auto w-full flex-1 flex flex-col">
          <div className="text-center mb-6 mt-2">
            <h1 className="text-xl md:text-2xl font-semibold text-white">
              {t('title') || 'Setup Your Budget'}
            </h1>
            <p className="mt-1 text-sm text-white/70">
              {t('description') || 'Answer 10 quick questions to build your budget baseline'}
            </p>
          </div>

          <div className="flex-1 flex flex-col min-h-[220px]">
            {renderStep()}
          </div>

          {errorMessage && (
            <p className="text-center text-rose-400 text-sm mt-4" role="alert">
              {errorMessage}
            </p>
          )}

          <div className="flex gap-3 mt-6">
            {!isFirstStep && (
              <Button 
                variant="secondary" 
                onClick={handleBack} 
                disabled={isSubmitting}
                className="flex-1"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                {locale === 'th' ? 'ย้อนกลับ' : 'Back'}
              </Button>
            )}
            <Button 
              variant="primary" 
              onClick={handleNext} 
              disabled={isSubmitting}
              isLoading={isSubmitting}
              className={isFirstStep ? 'flex-1' : 'flex-1'}
            >
              {isLastStep 
                ? (locale === 'th' ? 'เสร็จสิ้น' : 'Finish') 
                : (locale === 'th' ? 'ถัดไป' : 'Next')}
              {!isLastStep && <ArrowRight className="h-4 w-4 ml-2" />}
            </Button>
          </div>
        </div>
      </main>

      <div className="mt-4 flex justify-center">
        <VoiceToggle 
          enabled={voiceEnabled} 
          onToggle={() => {}} // Handled by parent
          locale={locale}
        />
      </div>
    </div>
  );
}