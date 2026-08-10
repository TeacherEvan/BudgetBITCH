import { describe, expect, test } from 'vitest';
import { categorizeReceipt, normalizeCategory } from './categorize';

describe('categorizeReceipt', () => {
  test('passes through a valid explicit category', () => {
    expect(categorizeReceipt('Unknown Store', 'transport')).toBe('transport');
  });

  test('collapses invalid explicit category to "other"', () => {
    expect(categorizeReceipt('Some Shop', 'groceries')).toBe('other');
  });

  test('infers food from grocery merchants', () => {
    expect(categorizeReceipt('CHECKERS HYPER BRACKENFELL')).toBe('food');
    expect(categorizeReceipt('Woolworths')).toBe('food');
    expect(categorizeReceipt('SPAR')).toBe('food');
  });

  test('infers transport from fuel / ride merchants', () => {
    expect(categorizeReceipt('ENGEN')).toBe('transport');
    expect(categorizeReceipt('Uber')).toBe('transport');
    expect(categorizeReceipt('Bolt')).toBe('transport');
  });

  test('infers healthcare from pharmacy merchants', () => {
    expect(categorizeReceipt('DISCHEM')).toBe('healthcare');
    expect(categorizeReceipt('Clicks')).toBe('healthcare');
  });

  test('infers phone_internet from telecom merchants', () => {
    expect(categorizeReceipt('Vodacom')).toBe('phone_internet');
    expect(categorizeReceipt('Netflix')).toBe('subscriptions');
  });

  test('falls back to other when no signal', () => {
    expect(categorizeReceipt('XYZ RANDOM STORE')).toBe('other');
    expect(categorizeReceipt(undefined, undefined)).toBe('other');
  });
});

describe('normalizeCategory', () => {
  test('accepts valid categories', () => {
    expect(normalizeCategory('food')).toBe('food');
    expect(normalizeCategory('phone_internet')).toBe('phone_internet');
  });

  test('trims and lowercases', () => {
    expect(normalizeCategory('  FOOD ')).toBe('food');
  });

  test('invalid collapses to other', () => {
    expect(normalizeCategory('groceries')).toBe('other');
    expect(normalizeCategory('')).toBe('other');
  });
});
