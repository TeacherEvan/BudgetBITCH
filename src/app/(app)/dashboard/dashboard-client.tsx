// app/(app)/dashboard/dashboard-client.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { WizardShell } from '@/components/wizard/wizard-shell';
import { ManifestoInterstitial } from '@/components/launch/manifesto-interstitial';
import { useWizardProfile } from '@/hooks/use-local-db';
import { useAccountSync } from '@/hooks/use-account-sync';
import { initializeBudgetsFromWizard } from '@/lib/utils/budget-calculator';
import { getWizardProfile, saveWizardProfile, saveCriticalExpenseCommitment } from '@/lib/db/local-db';
import { logUserAction } from '@/lib/utils/action-logger';
import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import type { CriticalExpenseKey } from '@/lib/types/budget';
import { syncDailySnapshot } from '@/lib/convex/sync-snapshots';

import { MoneySyncLoading } from '@/components/ui/money-sync-loading';

interface DashboardClientProps {
  wizardCompleted: boolean;
}

const MANIFESTO_KEY = 'bb:manifesto-v1';

export function DashboardClient({ wizardCompleted: initialWizardCompleted }: DashboardClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = useLocale() as 'th' | 'en';
  
  const { profile, loading: profileLoading } = useWizardProfile();
  const [wizardCompleted, setWizardCompleted] = useState(initialWizardCompleted);
  const [isLoading, setIsLoading] = useState(false);
  const [budgetsInitialized, setBudgetsInitialized] = useState(false);
  const [wizardForced, setWizardForced] = useState(false);

  // Check if wizard redo was explicitly requested via Settings or URL parameter
  const isRedo = searchParams?.get('redo') === 'true' || (typeof window !== 'undefined' && sessionStorage.getItem('bb:wizard-redo') === '1');

  useEffect(() => {
    if (isRedo) {
      setWizardForced(true);
      setWizardCompleted(false);
    }
  }, [isRedo]);

  const latestSnapshot = useQuery(api.snapshots.getLatestSnapshot);

  // Manifesto gate — shown once per account, before the dashboard is interactive
  const [showManifesto, setShowManifesto] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    let seen = false;
    try { seen = localStorage.getItem(MANIFESTO_KEY) === '1'; } catch { /* ignore */ }
    // Intentional post-mount check; keeps SSR HTML minimal and avoids hydration mismatch.
    if (!seen) setShowManifesto(true);
  }, []);

  const handleManifestoDone = () => {
    try { localStorage.setItem(MANIFESTO_KEY, '1'); } catch { /* ignore */ }
    setShowManifesto(false);
  };

  // Keep the active account's shared board in sync with Convex.
  useAccountSync();

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

  // Restore session snapshot upon login if local profile is uncompleted
  useEffect(() => {
    // While the wizard overlay is actually on screen, never let a snapshot
    // restore flip wizardCompleted out from under the user (the first-launch
    // z-order collision: manifesto + wizard both true at once).
    const wizardShowing = !wizardCompleted || wizardForced;
    if (wizardShowing) return;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    if (profileLoading || wizardForced || isRedo) return;
    if (profile && profile.completed) return; // already completed locally
    if (latestSnapshot === undefined || latestSnapshot === null) return; // loading or no snapshot

    // Only restore wizard profile if the snapshot itself has a completed wizard profile
    if (!latestSnapshot.wizardProfile?.completed) return;

    (async () => {
      try {
        console.log('Restoring completed wizard profile and settings from Convex snapshot...');
        setIsLoading(true);
        
        // Restore wizard profile
        await saveWizardProfile(latestSnapshot.wizardProfile);
        
        // Restore critical expense commitment if present
        if (latestSnapshot.criticalExpenseCommitment) {
          const currentMonth = new Date().toISOString().slice(0, 7);
          await saveCriticalExpenseCommitment({
            ...latestSnapshot.criticalExpenseCommitment,
            expenseKey: latestSnapshot.criticalExpenseCommitment.expenseKey as CriticalExpenseKey,
            status: latestSnapshot.criticalExpenseCommitment.status as 'active' | 'completed' | 'failed',
            month: currentMonth,
            committedAt: new Date(latestSnapshot.createdAt || Date.now()).toISOString(),
          });
        }

        // Trigger local recheck
        await checkWizardStatus();
        router.refresh();
      } catch (e) {
        console.error('Failed to restore Convex snapshot:', e);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [profile, profileLoading, latestSnapshot, checkWizardStatus, wizardForced, isRedo, router]);

  const handleWizardComplete = useCallback(async () => {
    setWizardCompleted(true);
    setWizardForced(false);
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('bb:wizard-redo');
    }
    logUserAction('Wizard completed');
    // Push the completed profile snapshot to Convex immediately
    await syncDailySnapshot();
    await new Promise(resolve => setTimeout(resolve, 300));
    router.replace('/dashboard');
    router.refresh();
  }, [router]);

  if (isLoading || profileLoading) {
    return <MoneySyncLoading locale={locale} />;
  }

  return (
    <>
      {/* Manifesto gate — full-screen, shown once after login. Dashboard renders underneath. */}
      {showManifesto && (
        <ManifestoInterstitial locale={locale} onDone={handleManifestoDone} />
      )}

      <DashboardShell
        locale={locale}
        onLocaleChange={handleLocaleChange}
        onSetup={() => setWizardForced(true)}
      />
      
      {(!wizardCompleted || wizardForced) && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <WizardShell
            locale={locale}
            onComplete={handleWizardComplete}
            isModal={true}
          />
        </div>
      )}
    </>
  );
}