// app/(app)/dashboard/page.tsx
import { getWizardProfile } from '@/lib/db/local-db';
import { DashboardClient } from './dashboard-client';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const profile = await getWizardProfile();
  
  if (profile?.completed) {
    return <DashboardClient wizardCompleted={true} />;
  }

  return <DashboardClient wizardCompleted={false} />;
}