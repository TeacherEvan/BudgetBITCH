import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import { render, act } from '@testing-library/react';
import { useHaptic } from './use-haptic';
import { ThemeProvider } from '@/components/providers/theme-provider';

const renderWithProvider = (component: React.ReactNode) => render(<ThemeProvider>{component}</ThemeProvider>);

const mockNavigator = { vibrate: vi.fn() };

beforeAll(() => {
  vi.stubGlobal('navigator', mockNavigator);
  vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
});

function TestComponent({ onTrigger, type }: { onTrigger: (fn: () => void) => void; type: 'light' | 'medium' | 'heavy' | 'selection' | 'success' | 'warning' | 'error' }) {
  const { trigger } = useHaptic();
  onTrigger(() => trigger(type));
  return <div data-testid="test-component">Test</div>;
}

describe('useHaptic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigator.vibrate.mockClear();
  });

  it('returns trigger function', () => {
    let triggerFn: () => void;
    renderWithProvider(<TestComponent onTrigger={fn => { triggerFn = fn; }} type="light" />);
    expect(typeof triggerFn).toBe('function');
  });

  it('calls navigator.vibrate with pattern for light', () => {
    let triggerFn: () => void;
    renderWithProvider(<TestComponent onTrigger={fn => { triggerFn = fn; }} type="light" />);
    act(() => { triggerFn(); });
    expect(mockNavigator.vibrate).toHaveBeenCalledWith(10);
  });

  it('calls navigator.vibrate with pattern for medium', () => {
    let triggerFn: () => void;
    renderWithProvider(<TestComponent onTrigger={fn => { triggerFn = fn; }} type="medium" />);
    act(() => { triggerFn(); });
    expect(mockNavigator.vibrate).toHaveBeenCalledWith(20);
  });

  it('calls navigator.vibrate with pattern for heavy', () => {
    let triggerFn: () => void;
    renderWithProvider(<TestComponent onTrigger={fn => { triggerFn = fn; }} type="heavy" />);
    act(() => { triggerFn(); });
    expect(mockNavigator.vibrate).toHaveBeenCalledWith(40);
  });

  it('calls navigator.vibrate with pattern for selection', () => {
    let triggerFn: () => void;
    renderWithProvider(<TestComponent onTrigger={fn => { triggerFn = fn; }} type="selection" />);
    act(() => { triggerFn(); });
    expect(mockNavigator.vibrate).toHaveBeenCalledWith([5, 5, 5]);
  });

  it('calls navigator.vibrate with pattern for success', () => {
    let triggerFn: () => void;
    renderWithProvider(<TestComponent onTrigger={fn => { triggerFn = fn; }} type="success" />);
    act(() => { triggerFn(); });
    expect(mockNavigator.vibrate).toHaveBeenCalledWith([10, 50, 10]);
  });

  it('calls navigator.vibrate with pattern for warning', () => {
    let triggerFn: () => void;
    renderWithProvider(<TestComponent onTrigger={fn => { triggerFn = fn; }} type="warning" />);
    act(() => { triggerFn(); });
    expect(mockNavigator.vibrate).toHaveBeenCalledWith([20, 100, 20]);
  });

  it('calls navigator.vibrate with pattern for error', () => {
    let triggerFn: () => void;
    renderWithProvider(<TestComponent onTrigger={fn => { triggerFn = fn; }} type="error" />);
    act(() => { triggerFn(); });
    expect(mockNavigator.vibrate).toHaveBeenCalledWith([30, 30, 30, 30, 30]);
  });

  it('does nothing when vibration API unavailable', () => {
    vi.stubGlobal('navigator', {});
    let triggerFn: () => void;
    renderWithProvider(<TestComponent onTrigger={fn => { triggerFn = fn; }} type="medium" />);
    act(() => { triggerFn(); });
    expect(mockNavigator.vibrate).not.toHaveBeenCalled();
  });
});