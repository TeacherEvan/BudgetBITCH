import { describe, it, expect } from 'vitest';
import { getCategoryColor, CATEGORY_COLORS, getCategoryColors } from './category-colors';

describe('Category Colors', () => {
  it('returns consistent color for each category', () => {
    expect(getCategoryColor('food')).toBe('#f59e0b');
    expect(getCategoryColor('transport')).toBe('#3b82f6');
    expect(getCategoryColor('entertainment')).toBe('#8b5cf6');
    expect(getCategoryColor('utilities')).toBe('#06b6d4');
    expect(getCategoryColor('healthcare')).toBe('#ef4444');
    expect(getCategoryColor('phone_internet')).toBe('#ec4899');
    expect(getCategoryColor('shopping')).toBe('#f97316');
    expect(getCategoryColor('other')).toBe('#6b7280');
  });

  it('falls back to default for unknown category', () => {
    expect(getCategoryColor('unknown')).toBe('#6b7280');
    expect(getCategoryColor('')).toBe('#6b7280');
  });

  it('exports all category colors as array for Recharts', () => {
    expect(CATEGORY_COLORS).toHaveLength(8);
    expect(CATEGORY_COLORS).toContain('#f59e0b');
    expect(CATEGORY_COLORS).toContain('#3b82f6');
    expect(CATEGORY_COLORS).toContain('#8b5cf6');
    expect(CATEGORY_COLORS).toContain('#06b6d4');
    expect(CATEGORY_COLORS).toContain('#ef4444');
    expect(CATEGORY_COLORS).toContain('#ec4899');
    expect(CATEGORY_COLORS).toContain('#f97316');
    expect(CATEGORY_COLORS).toContain('#6b7280');
  });

  it('getCategoryColors returns array of colors for given categories', () => {
    const colors = getCategoryColors(['food', 'transport', 'entertainment']);
    expect(colors).toEqual(['#f59e0b', '#3b82f6', '#8b5cf6']);
  });
});