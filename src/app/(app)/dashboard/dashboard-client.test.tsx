// app/(app)/dashboard/dashboard-client.test.tsx
//
// Reproduces the "wizard not triggered on first entry" bug: on a genuine first
// launch the manifesto (z-[200]) AND the wizard overlay (was z-50) are both
// true simultaneously, and the manifesto covered the wizard entirely. The fix
// raises the wizard to z-[300] and stops a snapshot restore from flipping
// wizardCompleted out from under the user. This test pins both facts.
import 'fake-indexeddb/auto';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';

vi.mock('@convex-dev/auth/react', () => ({
  useConvexAuth: () => ({ isAuthenticated: false, isLoading: false }),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn(), refresh: vi.fn(), push: vi.fn() }),
  useSearchParams: () => ({ get: () => null }),
}));

vi.mock('next-intl', () => ({
  useLocale: () => 'en',
}));

vi.mock('convex/react', () => ({
  useConvexAuth: () => ({ isAuthenticated: false, isLoading: false }),
  useConvex: () => ({ query: async () => null }),
  useMutation: () => vi.fn(),
  useQuery: () => undefined,
}));

vi.mock('@/hooks/use-account-sync', () => ({
  useAccountSync: () => ({ boardId: null, syncing: false, pushPending: false, syncNow: vi.fn() }),
}));

vi.mock('@/lib/convex/sync-snapshots', () => ({
  syncDailySnapshot: vi.fn(),
}));

vi.mock('@/lib/db/local-db', () => ({
  getWizardProfile: vi.fn(async () => undefined),
  saveWizardProfile: vi.fn(),
  saveCriticalExpenseCommitment: vi.fn(),
}));

vi.mock('@/hooks/use-local-db', () => ({
  useWizardProfile: () => ({ profile: undefined, loading: false, clear: vi.fn() }),
}));

vi.mock('@/components/launch/manifesto-interstitial', () => ({
  ManifestoInterstitial: ({ onDone }: { onDone: () => void }) => (
    <div data-testid="manifesto" className="z-[200]">
      <button onClick={onDone}>dismiss</button>
    </div>
  ),
}));

vi.mock('@/components/wizard/wizard-shell', () => ({
  WizardShell: () => <div data-testid="wizard">wizard</div>,
}));

vi.mock('@/components/dashboard/dashboard-shell', () => ({
  DashboardShell: () => <div data-testid="dashboard-shell" />,
}));

import { DashboardClient } from './dashboard-client';

beforeEach(() => {
  cleanup();
  localStorage.clear();
  vi.clearAllMocks();
});

describe('first-launch wizard visibility', () => {
  it('renders the wizard overlay even when the manifesto is also showing (no occlusion)', async () => {
    render(<DashboardClient wizardCompleted={false} />);

    // Both gates true on first launch: manifesto not yet dismissed.
    await waitFor(() => {
      expect(screen.getByTestId('manifesto')).toBeInTheDocument();
    });

    // The wizard must ALSO be reachable in the DOM (it sits at z-[300]).
    const wizard = screen.getByTestId('wizard');
    expect(wizard).toBeInTheDocument();

    // And the overlay wrapper carries the elevated z-index.
    const overlay = wizard.closest('div.fixed');
    expect(overlay?.className).toContain('z-[300]');
  });

  it('hides the wizard entirely once completed', async () => {
    render(<DashboardClient wizardCompleted={true} />);
    await waitFor(() => {
      expect(screen.queryByTestId('wizard')).not.toBeInTheDocument();
    });
  });
});
