// app/(app)/dashboard/page.tsx
import { DashboardClient } from './dashboard-client';
import { RequireAuth } from '@/components/auth/require-auth';

export const dynamic = 'force-dynamic';

// NOTE: We deliberately do NOT read getWizardProfile() here. The server render
// hits a dummy IndexedDB (DUMMY_SSR_DB) whose reads always resolve to
// `undefined`, so any server-side wizard check would be a constant `false` and
// functionally dead. The client (`dashboard-client.tsx`) is the single source of
// truth: it re-checks the real local profile on mount via checkWizardStatus().
export default function DashboardPage() {
  return (
    <RequireAuth>
      <DashboardClient wizardCompleted={false} />
    </RequireAuth>
  );
}
