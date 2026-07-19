// hooks/use-currency.test.tsx
import { renderHook, act } from '@testing-library/react';
import { useResolvedCurrency, useCurrency } from './use-currency';
import * as localDb from '@/lib/db/local-db';

// Silence console noise from the hook's cache read
vi.mock('@/lib/db/local-db', () => ({
  getLocationCache: vi.fn(),
}));

describe('useResolvedCurrency', () => {
  it('resolves TH country to THB after mount', async () => {
    vi.mocked(localDb.getLocationCache).mockResolvedValue({
      lat: 0,
      lon: 0,
      city: 'Bangkok',
      province: 'Bangkok',
      country: 'TH',
      timestamp: 0,
      timezone: 'Asia/Bangkok',
    });
    const { result } = renderHook(() => useResolvedCurrency());
    // initial render is null (SSR-safe)
    expect(result.current).toBeNull();
    await act(async () => {
      await Promise.resolve();
    });
    expect(result.current).toBe('THB');
  });

  it('resolves missing country to null (no symbol)', async () => {
    vi.mocked(localDb.getLocationCache).mockResolvedValue(undefined);
    const { result } = renderHook(() => useResolvedCurrency());
    await act(async () => {
      await Promise.resolve();
    });
    expect(result.current).toBeNull();
  });
});

describe('useCurrency', () => {
  it('returns a formatter with the same signature as formatCurrency', async () => {
    vi.mocked(localDb.getLocationCache).mockResolvedValue({
      lat: 0,
      lon: 0,
      city: 'X',
      province: 'Y',
      country: 'US',
      timestamp: 0,
      timezone: 'America/New_York',
    });
    const { result } = renderHook(() => useCurrency());
    // before cache resolves, default formatter (en/USD)
    await act(async () => {
      await Promise.resolve();
    });
    expect(typeof result.current).toBe('function');
    expect(result.current(12500, 'en')).toContain('12,500');
  });

  it('formats with no symbol when country unresolved', async () => {
    vi.mocked(localDb.getLocationCache).mockResolvedValue(undefined);
    const { result } = renderHook(() => useCurrency());
    await act(async () => {
      await Promise.resolve();
    });
    expect(result.current(12500, 'en')).toBe('12,500');
  });
});
