// app/(app)/dashboard/page.tsx
import { getWizardProfile } from '@/lib/db/local-db';
import { DashboardClient } from './dashboard-client';
import { RequireAuth } from '@/components/auth/require-auth';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const profile = await getWizardProfile();
  
  if (profile?.completed) {
    return <RequireAuth><DashboardClient wizardCompleted={true} /></RequireAuth>;
  }

  return <RequireAuth><DashboardClient wizardCompleted={false} /></RequireAuth>;
}