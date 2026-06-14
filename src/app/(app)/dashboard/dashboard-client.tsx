// app/(app)/dashboard/dashboard-client.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
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
  const t = useTranslations('dashboard');
  
  const { profile, loading: profileLoading, save: saveProfile } = useWizardProfile();
  const [wizardCompleted, setWizardCompleted] = useState(initialWizardCompleted);
  const [isLoading, setIsLoading] = useState(false);
  const [budgetsInitialized, setBudgetsInitialized] = useState(false);

  // Initialize budgets from wizard on first load
  useEffect(() => {
    if (profile?.completed && !budgetsInitialized) {
      initializeBudgets().then(() => setBudgetsInitialized(true));
    }
  }, [profile, budgetsInitialized]);

  const initializeBudgets = async () => {
    if (profile) {
      try {
        await initializeBudgetsFromWizard(profile);
        console.log('Budgets initialized from wizard');
      } catch (error) {
        console.error('Failed to initialize budgets:', error);
      }
    }
  };

  // Check if wizard is already completed (client-side fallback)
  useEffect(() => {
    if (!initialWizardCompleted) {
      checkWizardStatus();
    }
  }, []);

  const checkWizardStatus = useCallback(async () => {
    try {
      const wizardProfile = await getWizardProfile();
      if (wizardProfile?.completed) {
        setWizardCompleted(true);
        router.replace('/dashboard');
      }
    } catch (error) {
      console.error('Failed to check wizard status:', error);
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  if (isLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-amber-400 animate-spin" />
      </div>
    );
  }

  if (!wizardCompleted) {
    return null; // Will redirect
  }

  return <DashboardShell locale={locale} />;
}