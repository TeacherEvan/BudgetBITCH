// components/wizard/wizard-shell.tsx
'use client';

import { useState, useCallback } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { WizardProfile } from '@/lib/types/budget';
import { saveWizardProfile } from '@/lib/db/local-db';
import type { CurrencyCode } from '@/lib/utils/currency';
import { WizardProgress } from './wizard-progress';
import { StepIncome } from './steps/step-income';
import { StepLocationConsent } from './steps/step-location-consent';
import { StepReceiptScan } from './steps/step-receipt-scan';
import { Button } from '@/components/ui/button';

export type WizardStepId = 'income' | 'locationConsent' | 'receiptScan';

const STEPS: WizardStepId[] = ['income', 'locationConsent', 'receiptScan'];

interface WizardShellProps {
  locale: 'th' | 'en' | 'en-ZA' | 'en-TH' | string;
  onComplete: () => void;
  isModal?: boolean;
}

export function WizardShell({ locale, onComplete, isModal = false }: WizardShellProps) {
  const isThai = locale === 'th';
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [stepValues, setStepValues] = useState<Partial<WizardProfile['answers']>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const currentStep = STEPS[currentStepIndex];
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === STEPS.length - 1;

  const handleNext = useCallback(async () => {
    const stepId = STEPS[currentStepIndex];

    // Validation (income step requires numeric value; receiptScan is optional via skip)
    let isEmpty = false;
    if (stepId === 'income') {
      const incomeVal = stepValues.income;
      if (incomeVal === undefined || incomeVal === null || isNaN(Number(incomeVal))) {
        isEmpty = true;
      }
    }

    if (isEmpty) {
      setErrorMessage(isThai ? 'กรุณากรอกข้อมูลก่อนดำเนินต่อ' : 'Please fill in this step');
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
        locale: (['th', 'en', 'en-ZA', 'en-TH'].includes(locale) ? locale : 'en-ZA') as WizardProfile['locale'],
        answers: {
          income: stepValues.income ?? 0,
          locationConsent: stepValues.locationConsent ?? false,
          receiptScanned: stepValues.receiptScanned ?? false,
          currency: (locale === 'en-ZA' ? 'ZAR' : locale.includes('TH') || locale === 'th' ? 'THB' : 'USD') as CurrencyCode,
          ...stepValues,
        },
      };
      await saveWizardProfile(profile);
      setIsSubmitting(false);
      onComplete();
    } else {
      setCurrentStepIndex(prev => prev + 1);
    }
  }, [currentStepIndex, stepValues, isLastStep, locale, isThai, onComplete]);

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
            locale={locale}
            value={stepValues.income as number}
            onChange={handleValueChange}
            error={errorMessage}
            disabled={isSubmitting}
          />
        );
      case 'locationConsent':
        return (
          <StepLocationConsent
            locale={locale}
            value={stepValues.locationConsent as boolean}
            onChange={handleValueChange}
            error={errorMessage}
            disabled={isSubmitting}
          />
        );
      case 'receiptScan':
        return (
          <StepReceiptScan
            locale={locale}
            value={stepValues.receiptScanned as boolean}
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
    <div
      className={
        isModal
          ? 'w-full max-w-lg mx-auto bg-neutral-900 border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col relative overflow-hidden'
          : 'min-h-screen bg-black flex flex-col'
      }
    >
      <WizardProgress
        currentStep={currentStepIndex}
        totalSteps={STEPS.length}
        locale={isThai ? 'th' : 'en'}
      />

      <main className="flex-1 flex flex-col p-2 md:p-4">
        <div className="max-w-md mx-auto w-full flex-1 flex flex-col">
          <div className="text-center mb-6 mt-2">
            <h1 className="text-xl md:text-2xl font-semibold text-white">
              {isThai ? 'ตั้งค่ากระเป๋าเงินของคุณ' : 'Setup Your Budget'}
            </h1>
            <p className="mt-1 text-sm text-white/70">
              {isThai
                ? 'เริ่มต้นใน 3 ขั้นตอนง่ายๆ'
                : 'Get started in 3 fast, simple steps'}
            </p>
          </div>

          <div className="flex-1 flex flex-col min-h-[220px]">{renderStep()}</div>

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
                {isThai ? 'ย้อนกลับ' : 'Back'}
              </Button>
            )}
            <Button
              variant="primary"
              onClick={handleNext}
              disabled={isSubmitting}
              isLoading={isSubmitting}
              className="flex-1"
            >
              {isLastStep
                ? isThai
                  ? 'เสร็จสิ้น'
                  : 'Finish'
                : isThai
                  ? 'ถัดไป'
                  : 'Next'}
              {!isLastStep && <ArrowRight className="h-4 w-4 ml-2" />}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}