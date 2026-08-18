// components/wizard/wizard-shell.tsx
'use client';

import { useState, useCallback } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { WizardProfile } from '@/lib/types/budget';
import { saveWizardProfile } from '@/lib/db/local-db';
import type { CurrencyCode } from '@/lib/utils/currency';
import { useCurrencyOverride } from '@/hooks/use-currency-override';
import { WizardProgress } from './wizard-progress';
import { StepIncome } from './steps/step-income';
import { StepRent } from './steps/step-rent';
import { StepPhoneInternet } from './steps/step-phone-internet';
import { StepHealthcare } from './steps/step-healthcare';
import { StepTransport } from './steps/step-transport';
import { StepEntertainment } from './steps/step-entertainment';
import { StepSubscriptions } from './steps/step-subscriptions';
import { StepSavingsRate } from './steps/step-savings-rate';
import { StepRiskTolerance } from './steps/step-risk-tolerance';
import { StepLocationConsent } from './steps/step-location-consent';
import { Button } from '@/components/ui/button';

export type WizardStepId =
  | 'income'
  | 'rent'
  | 'phoneInternet'
  | 'healthcare'
  | 'transport'
  | 'entertainment'
  | 'subscriptions'
  | 'savingsRate'
  | 'riskTolerance'
  | 'locationConsent';

const STEPS: WizardStepId[] = [
  'income',
  'rent',
  'phoneInternet',
  'healthcare',
  'transport',
  'entertainment',
  'subscriptions',
  'savingsRate',
  'riskTolerance',
  'locationConsent',
];

interface WizardShellProps {
  locale: string;
  onComplete: () => void;
  isModal?: boolean;
}

export function WizardShell({ locale, onComplete, isModal = false }: WizardShellProps) {
  const normLocale: string = locale || 'en';
  const { override: currencyOverride } = useCurrencyOverride();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [stepValues, setStepValues] = useState<Partial<WizardProfile['answers']>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const currentStep = STEPS[currentStepIndex];
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === STEPS.length - 1;

  const handleNext = useCallback(async () => {
    const stepId = STEPS[currentStepIndex];

    // Validation (income step requires numeric value)
    let isEmpty = false;
    if (stepId === 'income') {
      const incomeVal = stepValues.income;
      if (incomeVal === undefined || incomeVal === null || isNaN(Number(incomeVal))) {
        isEmpty = true;
      }
    }

    if (isEmpty) {
      setErrorMessage('Please fill in this step');
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
        locale: (locale || 'en') as WizardProfile['locale'],
        answers: {
          income: stepValues.income ?? 0,
          rent: stepValues.rent ?? 0,
          phoneInternet: stepValues.phoneInternet ?? 0,
          healthcare: stepValues.healthcare ?? 0,
          transport: stepValues.transport ?? 0,
          entertainment: stepValues.entertainment ?? 0,
          subscriptions: stepValues.subscriptions ?? 0,
          savingsRatePct: stepValues.savingsRatePct ?? 10,
          riskTolerance: stepValues.riskTolerance ?? 'medium',
          locationConsent: stepValues.locationConsent ?? false,
          receiptScanned: stepValues.receiptScanned ?? false,
          currency: (stepValues.currency ?? currencyOverride ?? (locale === 'en-ZA' ? 'ZAR' : 'USD')) as CurrencyCode,
          ...stepValues,
        },
      };
      await saveWizardProfile(profile);
      setIsSubmitting(false);
      onComplete();
    } else {
      setCurrentStepIndex(prev => prev + 1);
    }
  }, [currentStepIndex, stepValues, isLastStep, locale, currencyOverride, onComplete]);

  const handleBack = useCallback(() => {
    if (!isFirstStep) {
      setCurrentStepIndex(prev => prev - 1);
      setErrorMessage(null);
    }
  }, [isFirstStep]);

  const handleValueChange = useCallback(
    (key: keyof WizardProfile['answers'], value: WizardProfile['answers'][typeof key]) => {
      setStepValues(prev => ({ ...prev, [key]: value }));
      setErrorMessage(null);
    },
    []
  );

  const renderStep = () => {
    switch (currentStep) {
      case 'income':
        return (
          <StepIncome
            locale={normLocale}
            value={stepValues.income as number}
            onChange={handleValueChange}
            error={errorMessage}
            disabled={isSubmitting}
          />
        );
      case 'rent':
        return (
          <StepRent
            locale={normLocale}
            value={stepValues.rent as number}
            onChange={handleValueChange}
            error={errorMessage}
            disabled={isSubmitting}
          />
        );
      case 'phoneInternet':
        return (
          <StepPhoneInternet
            locale={normLocale}
            value={stepValues.phoneInternet as number}
            onChange={handleValueChange}
            error={errorMessage}
            disabled={isSubmitting}
          />
        );
      case 'healthcare':
        return (
          <StepHealthcare
            locale={normLocale}
            value={stepValues.healthcare as number}
            onChange={handleValueChange}
            error={errorMessage}
            disabled={isSubmitting}
          />
        );
      case 'transport':
        return (
          <StepTransport
            locale={normLocale}
            value={stepValues.transport as number}
            onChange={handleValueChange}
            error={errorMessage}
            disabled={isSubmitting}
          />
        );
      case 'entertainment':
        return (
          <StepEntertainment
            locale={normLocale}
            value={stepValues.entertainment as number}
            onChange={handleValueChange}
            error={errorMessage}
            disabled={isSubmitting}
          />
        );
      case 'subscriptions':
        return (
          <StepSubscriptions
            locale={normLocale}
            value={stepValues.subscriptions as number}
            onChange={handleValueChange}
            error={errorMessage}
            disabled={isSubmitting}
          />
        );
      case 'savingsRate':
        return (
          <StepSavingsRate
            locale={normLocale}
            value={stepValues.savingsRatePct as number}
            onChange={handleValueChange}
            error={errorMessage}
            disabled={isSubmitting}
          />
        );
      case 'riskTolerance':
        return (
          <StepRiskTolerance
            locale={normLocale}
            value={(stepValues.riskTolerance as 'low' | 'medium' | 'high') || 'medium'}
            onChange={handleValueChange}
            error={errorMessage}
            disabled={isSubmitting}
          />
        );
      case 'locationConsent':
        return (
          <StepLocationConsent
            locale={normLocale}
            value={stepValues.locationConsent as boolean}
            onChange={handleValueChange}
            error={errorMessage}
            disabled={isSubmitting}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className={`w-full max-w-xl mx-auto bg-black text-white rounded-3xl border border-white/10 overflow-hidden shadow-2xl ${isModal ? 'my-auto max-h-[90vh] overflow-y-auto' : 'min-h-screen flex flex-col'}`}>
      <WizardProgress
        currentStep={currentStepIndex}
        totalSteps={STEPS.length}
        locale={normLocale}
      />

      <div className="flex-1 p-6 md:p-8 space-y-6">
        {renderStep()}
      </div>

      <div className="p-6 border-t border-white/10 bg-black/60 flex items-center justify-between gap-4">
        <Button
          type="button"
          variant="secondary"
          onClick={handleBack}
          disabled={isFirstStep || isSubmitting}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          {'Back'}
        </Button>

        <Button
          type="button"
          variant="primary"
          onClick={handleNext}
          disabled={isSubmitting}
          className="gap-2 bg-amber-400 text-black hover:bg-amber-300 font-semibold"
        >
          {isLastStep ? ('Finish') : ('Next')}
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
