// components/dashboard/panels/voice-expense-input.test.tsx
import { describe, it, expect } from 'vitest';
import { parseExpenseFromText, parseThaiNumber } from './voice-expense-input';

describe('parseThaiNumber', () => {
  it('parses a direct arabic number', () => {
    expect(parseThaiNumber('150')).toBe(150);
  });

  it('parses a single Thai unit word', () => {
    expect(parseThaiNumber('สามร้อย')).toBe(300);
  });

  it('parses combined Thai number words', () => {
    expect(parseThaiNumber('หนึ่งพันสองร้อยห้าสิบ')).toBe(1250);
  });

  it('returns null when there is no number', () => {
    expect(parseThaiNumber('ไม่มีตัวเลข')).toBeNull();
  });
});

describe('parseExpenseFromText', () => {
  it('parses English "Paid Grab 150 baht"', () => {
    const result = parseExpenseFromText('Paid Grab 150 baht');
    expect(result).not.toBeNull();
    expect(result!.amount).toBe(150);
    expect(result!.merchant).toMatch(/grab/i);
    expect(result!.category).toBe('transport');
  });

  it('parses Thai "จ่ายแกร็บ 150 บาท"', () => {
    const result = parseExpenseFromText('จ่ายแกร็บ 150 บาท');
    expect(result).not.toBeNull();
    expect(result!.amount).toBe(150);
    expect(result!.category).toBe('transport');
  });

  it('parses Thai numerals "ซื้อข้าว สามร้อยบาท"', () => {
    const result = parseExpenseFromText('ซื้อข้าว สามร้อยบาท');
    expect(result).not.toBeNull();
    expect(result!.amount).toBe(300);
  });

  it('returns null when no amount is present', () => {
    expect(parseExpenseFromText('hello there')).toBeNull();
  });

  it('extracts an unknown merchant from remaining words', () => {
    const result = parseExpenseFromText('Lunch 80 baht');
    expect(result).not.toBeNull();
    expect(result!.merchant.toLowerCase()).toContain('lunch');
    expect(result!.amount).toBe(80);
  });

  it('attaches a voice note containing the transcript', () => {
    const result = parseExpenseFromText('Paid Grab 150 baht');
    expect(result!.note).toContain('Paid Grab 150 baht');
  });
});
