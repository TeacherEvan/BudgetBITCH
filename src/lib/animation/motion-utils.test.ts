import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prefersReducedMotion, getTransition, staggerContainer, staggerItem } from './motion-utils';

const mockMatchMedia = vi.fn().mockReturnValue({
  matches: false,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
});

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('matchMedia', mockMatchMedia);
});

describe('Motion Utils', () => {
  it('returns standard transition', () => {
    const t = getTransition();
    expect(t.duration).toBe(0.4);
    expect(t.ease).toEqual([0.25, 0.46, 0.45, 0.94]);
  });

  it('returns spring transition', () => {
    const t = getTransition('spring');
    expect(t.type).toBe('spring');
    expect(t.stiffness).toBe(260);
    expect(t.damping).toBe(20);
  });

  it('returns quick transition', () => {
    const t = getTransition('quick');
    expect(t.duration).toBe(0.15);
  });

  it('prefersReducedMotion returns false by default', () => {
    expect(prefersReducedMotion()).toBe(false);
  });

  it('prefersReducedMotion returns true when media query matches', () => {
    mockMatchMedia.mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
    expect(prefersReducedMotion()).toBe(true);
  });

  it('getTransition returns zero-duration when reduced motion preferred', () => {
    mockMatchMedia.mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
    const t = getTransition('easeOut');
    expect(t.duration).toBe(0.01);
    expect(t.ease).toBe('linear');
  });

  it('staggerContainer has correct variants', () => {
    expect(staggerContainer.hidden).toEqual({ opacity: 0 });
    expect(staggerContainer.visible.opacity).toBe(1);
    expect(staggerContainer.visible.transition.staggerChildren).toBe(0.1);
  });

  it('staggerItem returns correct variants with delay', () => {
    const item = staggerItem(2);
    expect(item.hidden).toEqual({ opacity: 0, y: 20 });
    expect(item.visible.opacity).toBe(1);
    expect(item.visible.y).toBe(0);
    expect(item.visible.transition.delay).toBe(0.2);
  });
});