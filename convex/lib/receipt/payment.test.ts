import { describe, it, expect } from 'vitest';
import { inferPaymentMethod } from './payment';

describe('payment — payment_method inference', () => {
  it('detects card from visa', () => {
    expect(inferPaymentMethod('VISA CARD')).toBe('card');
    expect(inferPaymentMethod('Visa')).toBe('card');
  });

  it('detects card from mastercard', () => {
    expect(inferPaymentMethod('MASTERCARD')).toBe('card');
    expect(inferPaymentMethod('MasterCard')).toBe('card');
  });

  it('detects card from amex', () => {
    expect(inferPaymentMethod('AMEX')).toBe('card');
    expect(inferPaymentMethod('American Express')).toBe('card');
  });

  it('detects card from apple pay', () => {
    expect(inferPaymentMethod('APPLE PAY')).toBe('card');
    expect(inferPaymentMethod('Apple Pay')).toBe('card');
  });

  it('detects card from generic "card"', () => {
    expect(inferPaymentMethod('PAID BY CARD')).toBe('card');
    expect(inferPaymentMethod('CARD PAYMENT')).toBe('card');
  });

  it('defaults to cash when no card indicator', () => {
    expect(inferPaymentMethod('CASH')).toBe('cash');
    expect(inferPaymentMethod('PAID CASH')).toBe('cash');
    expect(inferPaymentMethod('TOTAL 10.00')).toBe('cash');
    expect(inferPaymentMethod('')).toBe('cash');
  });

  it('is case insensitive', () => {
    expect(inferPaymentMethod('visa')).toBe('card');
    expect(inferPaymentMethod('Mastercard')).toBe('card');
    expect(inferPaymentMethod('amex')).toBe('card');
    expect(inferPaymentMethod('apple pay')).toBe('card');
  });
});