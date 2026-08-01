// hooks/use-local-db.net-worth.test.tsx
//
// Guards regression: "Add Asset" / "Add Liability" did nothing at all for any
// user who had no net-worth snapshot yet (i.e. every new install). Both
// callbacks opened with `if (!snapshot) return;`, so the very first item a user
// tried to add was discarded silently with no error and no UI change.
//
// Fix (this commit): useNetWorth seeds an empty snapshot for today instead of
// bailing out, so the first add persists.

import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { clearAllData, getLatestNetWorthSnapshot } from '@/lib/db/local-db';
import { useNetWorth } from './use-local-db';

describe('useNetWorth — first add on a fresh install', () => {
  beforeEach(async () => {
    await clearAllData();
  });

  it('persists the FIRST asset even though no snapshot exists yet', async () => {
    expect(await getLatestNetWorthSnapshot()).toBeUndefined();

    const { result } = renderHook(() => useNetWorth());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.snapshot).toBeNull();

    await act(async () => {
      await result.current.addAsset({ id: '', name: 'Car', value: 5000, type: 'vehicle' });
    });

    const saved = await getLatestNetWorthSnapshot();
    expect(saved).toBeDefined();
    expect(saved!.assets).toHaveLength(1);
    expect(saved!.assets[0].name).toBe('Car');
    expect(result.current.totalAssets).toBe(5000);
  });

  it('persists the FIRST liability even though no snapshot exists yet', async () => {
    const { result } = renderHook(() => useNetWorth());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.addLiability({ id: '', name: 'Loan', value: 2000, type: 'personal_loan' });
    });

    const saved = await getLatestNetWorthSnapshot();
    expect(saved).toBeDefined();
    expect(saved!.liabilities).toHaveLength(1);
    expect(result.current.totalLiabilities).toBe(2000);
    expect(result.current.netWorth).toBe(-2000);
  });
});
