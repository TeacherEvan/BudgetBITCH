// app/(app)/wizard/wizard-client.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { WizardShell } from '@/components/wizard/wizard-shell';
import { useVoice } from '@/hooks/use-voice';
import { getWizardProfile } from '@/lib/db/local-db';
import { Loader2 } from 'lucide-react';

interface WizardClientProps {
  wizardCompleted: boolean;
}

export function WizardClient({ wizardCompleted: initialWizardCompleted }: WizardClientProps) {
  const router = useRouter();
  const locale = useLocale() as 'th' | 'en';
  
  const [wizardCompleted, setWizardCompleted] = useState(initialWizardCompleted);
  const [isLoading, setIsLoading] = useState(false);
  const [voiceEnabled] = useState(false);
  
  const { speak } = useVoice(locale === 'th' ? 'th-TH' : 'en-US');

  const checkWizardStatus = useCallback(async () => {
    try {
      const profile = await getWizardProfile();
      if (profile?.completed) {
        setWizardCompleted(true);
        router.replace('/dashboard');
      }
    } catch (error) {
      console.error('Failed to check wizard status:', error);
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  // Check if wizard is already completed (client-side fallback)
  useEffect(() => {
    if (!initialWizardCompleted) {
      checkWizardStatus();
    }
  }, [initialWizardCompleted, checkWizardStatus]);

  const handleWizardComplete = useCallback(async () => {
    setWizardCompleted(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    router.push('/dashboard');
    router.refresh();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-amber-400 animate-spin" />
      </div>
    );
  }

  if (wizardCompleted) {
    return null; // Will redirect
  }

  return (
    <WizardShell
      locale={locale}
      onComplete={handleWizardComplete}
      voiceEnabled={voiceEnabled}
      speak={speak}
    />
  );
}