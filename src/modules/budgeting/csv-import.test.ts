import { describe, expect, it } from 'vitest';
import {
  parseCsv,
  detectColumns,
  normalizeAmount,
  normalizeDate,
  mapCategory,
  parseImport,
  type ParsedExpense,
} from './csv-import';

describe('parseCsv', () => {
  it('parses simple comma rows', () => {
    expect(parseCsv('a,b,c\n1,2,3')).toEqual([
      ['a', 'b', 'c'],
      ['1', '2', '3'],
    ]);
  });

  it('handles quoted fields containing commas', () => {
    expect(parseCsv('date,merchant,amount\n2026-01-01,"Grab, Bangkok",120')).toEqual([
      ['date', 'merchant', 'amount'],
      ['2026-01-01', 'Grab, Bangkok', '120'],
    ]);
  });

  it('handles CRLF line endings', () => {
    expect(parseCsv('a,b\r\n1,2')).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ]);
  });

  it('handles quoted fields spanning newlines', () => {
    const out = parseCsv('a,b\n1,"line\ntwo"');
    expect(out[1]).toEqual(['1', 'line\ntwo']);
  });

  it('tolerates trailing empty lines', () => {
    expect(parseCsv('a,b\n1,2\n\n')).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ]);
  });
});

describe('detectColumns', () => {
  it('maps english headers to field keys', () => {
    expect(detectColumns(['Date', 'Merchant', 'Amount', 'Category', 'Note'])).toEqual({
      date: 0,
      merchant: 1,
      amount: 2,
      category: 3,
      note: 4,
    });
  });

  it('maps thai headers to field keys', () => {
    expect(detectColumns(['วันที่', 'รายการ', 'จำนวนเงิน', 'หมวดหมู่', 'หมายเหตุ'])).toEqual({
      date: 0,
      merchant: 1,
      amount: 2,
      category: 3,
      note: 4,
    });
  });

  it('ignores unknown columns and leaves gaps', () => {
    expect(detectColumns(['id', 'posted', 'weird'])).toEqual({ date: 1 });
  });
});

describe('normalizeAmount', () => {
  it('parses plain numbers', () => {
    expect(normalizeAmount('120')).toBe(120);
  });

  it('strips thousands separators and currency symbols', () => {
    expect(normalizeAmount('฿1,234.56')).toBe(1234.56);
    expect(normalizeAmount('$1,234.56')).toBe(1234.56);
  });

  it('handles parenthesis as negative and returns absolute value for expenses', () => {
    expect(normalizeAmount('(123.45)')).toBe(123.45);
  });

  it('returns null for empty or non-numeric input', () => {
    expect(normalizeAmount('')).toBeNull();
    expect(normalizeAmount('abc')).toBeNull();
  });
});

describe('normalizeDate', () => {
  it('accepts ISO yyyy-mm-dd', () => {
    expect(normalizeDate('2026-03-05')).toBe('2026-03-05');
  });

  it('accepts slash ISO yyyy/mm/dd', () => {
    expect(normalizeDate('2026/03/05')).toBe('2026-03-05');
  });

  it('treats dd/mm when middle part exceeds 12 (day-first)', () => {
    expect(normalizeDate('25/03/2026')).toBe('2026-03-25');
  });

  it('treats mm/dd default (US) when ambiguous and valid both ways', () => {
    expect(normalizeDate('03/05/2026')).toBe('2026-03-05');
  });

  it('expands 2-digit years to 20xx', () => {
    expect(normalizeDate('05/03/26')).toBe('2026-03-05');
  });

  it('returns null for unparseable dates', () => {
    expect(normalizeDate('not-a-date')).toBeNull();
    expect(normalizeDate('')).toBeNull();
  });
});

describe('mapCategory', () => {
  it('maps known expense categories directly', () => {
    expect(mapCategory('food')).toBe('food');
    expect(mapCategory('subscriptions')).toBe('subscriptions');
  });

  it('maps thai/english merchant text via the existing mapper', () => {
    expect(mapCategory('Netflix')).toBe('subscriptions');
    expect(mapCategory('ค่าเช่า')).toBe('housing');
  });

  it('falls back to other for unknown input', () => {
    expect(mapCategory('mystery')).toBe('other');
    expect(mapCategory(undefined)).toBe('other');
  });
});

describe('parseImport', () => {
  it('parses a well-formed english CSV into valid expenses with source import', () => {
    const csv = [
      'date,merchant,amount,category,note',
      '2026-01-01,Grab,120,transport,Morning ride',
      '2026-01-02,Netflix,429,subscriptions,',
    ].join('\n');
    const result = parseImport(csv);
    expect(result.errors).toHaveLength(0);
    expect(result.total).toBe(2);
    const [first, second] = result.valid;
    expect(first).toMatchObject({
      date: '2026-01-01',
      merchant: 'Grab',
      amount: 120,
      category: 'transport',
      note: 'Morning ride',
      source: 'import',
    });
    expect(second.category).toBe('subscriptions');
  });

  it('parses a thai-header CSV', () => {
    const csv = [
      'วันที่,รายการ,จำนวนเงิน,หมวดหมู่',
      '2026-02-10,ค่าเช่า,8000,housing',
    ].join('\n');
    const result = parseImport(csv);
    expect(result.errors).toHaveLength(0);
    expect(result.valid[0]).toMatchObject({
      date: '2026-02-10',
      merchant: 'ค่าเช่า',
      amount: 8000,
      category: 'housing',
      source: 'import',
    });
  });

  it('infers category from merchant text when the column is missing', () => {
    const csv = ['date,merchant,amount', '2026-03-01,Netflix,429'].join('\n');
    const result = parseImport(csv);
    expect(result.errors).toHaveLength(0);
    expect(result.valid[0].category).toBe('subscriptions');
  });

  it('defaults merchant to Imported when absent', () => {
    const csv = ['date,amount', '2026-03-01,250'].join('\n');
    const result = parseImport(csv);
    expect(result.valid[0].merchant).toBe('Imported');
  });

  it('collects per-row errors for bad amount or missing date with file line numbers', () => {
    const csv = [
      'date,merchant,amount',
      '2026-01-01,Grab,120',
      'bad-date,Shell,200',
      '2026-01-03,Shop,notnum',
    ].join('\n');
    const result = parseImport(csv);
    expect(result.total).toBe(3);
    expect(result.valid).toHaveLength(1);
    expect(result.errors).toHaveLength(2);
    // file line numbers: header=1, row1=2, row2=3, row3=4
    const reasons = result.errors.map((e) => e.line);
    expect(reasons).toContain(3);
    expect(reasons).toContain(4);
    expect(result.errors.every((e) => typeof e.reason === 'string' && e.raw.length > 0)).toBe(true);
  });

  it('returns empty result for blank input', () => {
    const result = parseImport('');
    expect(result.total).toBe(0);
    expect(result.valid).toHaveLength(0);
  });

  it('produces ParsedExpense objects assignable to expense-import shape', () => {
    const csv = 'date,merchant,amount\n2026-01-01,Test,10';
    const result = parseImport(csv);
    const row: ParsedExpense = result.valid[0];
    expect(row.source).toBe('import');
    expect(typeof row.amount).toBe('number');
  });
});
