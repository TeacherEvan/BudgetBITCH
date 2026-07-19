// app/(app)/dashboard/dashboard-client.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { WizardShell } from '@/components/wizard/wizard-shell';
import { useVoice } from '@/hooks/use-voice';
import { useWizardProfile } from '@/hooks/use-local-db';
import { initializeBudgetsFromWizard } from '@/lib/utils/budget-calculator';
import { getWizardProfile } from '@/lib/db/local-db';
import { Loader2 } from 'lucide-react';

interface DashboardClientProps {
  wizardCompleted: boolean;
}

export function DashboardClient({ wizardCompleted: initialWizardCompleted }: DashboardClientProps) {
  const router = useRouter();
  const locale = useLocale() as 'th' | 'en';
  
  const { profile, loading: profileLoading } = useWizardProfile();
  const [wizardCompleted, setWizardCompleted] = useState(initialWizardCompleted);
  const [isLoading, setIsLoading] = useState(false);
  const [budgetsInitialized, setBudgetsInitialized] = useState(false);
  const [wizardForced, setWizardForced] = useState(false);

  const voice = useVoice(locale === 'th' ? 'th-TH' : 'en-US');
  const voiceEnabled = voice.settings.enabled;

  const handleLocaleChange = useCallback(
    (nextLocale: 'th' | 'en') => {
      document.cookie = `bb-locale=${nextLocale}; path=/; max-age=31536000; samesite=lax`;
      router.refresh();
    },
    [router],
  );

  const initializeBudgets = useCallback(async () => {
    if (profile) {
      try {
        await initializeBudgetsFromWizard(profile);
        console.log('Budgets initialized from wizard');
      } catch (error) {
        console.error('Failed to initialize budgets:', error);
      }
    }
  }, [profile]);

  // Initialize budgets from wizard on first load
  useEffect(() => {
    if (profile?.completed && !budgetsInitialized) {
      initializeBudgets().then(() => setBudgetsInitialized(true));
    }
  }, [profile, budgetsInitialized, initializeBudgets]);

  const checkWizardStatus = useCallback(async () => {
    try {
      const wizardProfile = await getWizardProfile();
      if (wizardProfile?.completed) {
        setWizardCompleted(true);
      }
    } catch (error) {
      console.error('Failed to check wizard status:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Check if wizard is already completed (client-side fallback)
  useEffect(() => {
    if (!initialWizardCompleted) {
      // Defer to avoid setState in effect warning
      const timer = setTimeout(() => {
        checkWizardStatus();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [initialWizardCompleted, checkWizardStatus]);

  const handleWizardComplete = useCallback(async () => {
    setWizardCompleted(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    router.refresh();
  }, [router]);

  if (isLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-amber-400 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <DashboardShell
        locale={locale}
        onLocaleChange={handleLocaleChange}
        onVoiceToggle={voice.toggleVoice}
        voiceEnabled={voiceEnabled}
        onSetup={() => setWizardForced(true)}
      />
      
      {(!wizardCompleted || wizardForced) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <WizardShell
            locale={locale}
            onComplete={handleWizardComplete}
            voiceEnabled={voiceEnabled}
            speak={voice.speak}
            isModal={true}
          />
        </div>
      )}
    </>
  );
}