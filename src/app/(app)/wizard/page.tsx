// app/(app)/wizard/page.tsx
import { getWizardProfile } from '@/lib/db/local-db';
import { WizardClient } from './wizard-client';

export const dynamic = 'force-dynamic';

export default async function WizardPage() {
  const profile = await getWizardProfile();
  
  if (profile?.completed) {
    // This will be handled client-side via redirect
    return <WizardClient wizardCompleted={true} />;
  }

  return <WizardClient wizardCompleted={false} />;
}