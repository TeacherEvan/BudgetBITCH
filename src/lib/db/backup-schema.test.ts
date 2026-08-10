import { describe, it, expect, beforeAll } from 'vitest';
import { createBackupPayload, parseAndValidateBackup } from './backup-schema';
import webCrypto from 'node:crypto';

describe('Backup Schema and Integrity Engine', () => {
  beforeAll(() => {
    if (typeof window === 'undefined') {
      global.window = globalThis as unknown as Window & typeof globalThis;
    }
    if (!global.window.crypto) {
      global.window.crypto = webCrypto.webcrypto as unknown as Crypto;
    }
  });

  const validBackupData = {
    wizardProfile: [
      {
        completed: true as const,
        completedAt: '2026-07-20T12:00:00Z',
        version: 1 as const,
        locale: 'en' as const,
        answers: {
          income: 60000,
          rent: 15000,
          transport: 3000,
          phoneInternet: 800,
          subscriptions: 500,
          entertainment: 2000,
          healthcare: 1000,
          savingsRatePct: 20,
          riskTolerance: 'medium' as const,
          locationConsent: true,
        },
      },
    ],
    expenses: [
      {
        id: '123e4567-e89b-12d3-a456-426614174000',
        date: '2026-07-22',
        category: 'food',
        merchant: '7-Eleven',
        amount: 150,
        source: 'manual' as const,
      },
    ],
  };

  it('should successfully pack valid database structure', async () => {
    const payload = await createBackupPayload(validBackupData);
    expect(payload.version).toBe('1.0');
    expect(payload.checksum).toBeDefined();
    expect(payload.storeCounts.expenses).toBe(1);
    expect(payload.storeCounts.wizardProfile).toBe(1);
  });

  it('should successfully parse and validate a healthy payload', async () => {
    const payload = await createBackupPayload(validBackupData);
    const result = await parseAndValidateBackup(JSON.stringify(payload));
    expect(result.isEncrypted).toBe(false);
    expect(result.data.expenses).toHaveLength(1);
  });

  it('should fail validation if checksum is tampered', async () => {
    const payload = await createBackupPayload(validBackupData);
    payload.checksum = 'tampered-checksum-value';

    await expect(
      parseAndValidateBackup(JSON.stringify(payload))
    ).rejects.toThrow('Integrity check failed');
  });

  // -------------------------------------------------------------------------
  // Schema-drift regression guards.
  //
  // ExpenseEntry (src/lib/types/budget.ts) gained `source: 'receipt'`,
  // `lineItems`, `createdBy` and `createdByName`, but ExpenseEntrySchema was
  // never widened. Result: every scanned receipt either threw on restore
  // (unknown enum member) or had its itemization silently stripped by zod.
  // These tests guard that the backup schema tracks the live type.
  // -------------------------------------------------------------------------
  const receiptExpense = {
    id: 'r1-e89b-12d3-a456-426614174000',
    date: '2026-08-01',
    category: 'food',
    merchant: 'Woolworths',
    amount: 342.75,
    note: 'Scanned receipt photo',
    source: 'receipt' as const,
    createdBy: 'user_abc123',
    createdByName: 'Ewald',
    lineItems: [
      { description: 'Full cream milk 2L', amount: 34.99, category: 'food', qty: 1, unitPrice: 34.99 },
      { description: 'Bus ticket', amount: 22, category: 'transport' },
      { description: 'Paracetamol', amount: 285.76, category: 'healthcare', qty: 2, unitPrice: 142.88 },
    ],
  };

  it("round-trips source: 'receipt' without stripping lineItems or attribution", async () => {
    const data = { expenses: [receiptExpense] };
    const payload = await createBackupPayload(data);
    const result = await parseAndValidateBackup(JSON.stringify(payload));

    expect(result.data.expenses).toHaveLength(1);
    const restored = result.data.expenses![0];

    // Nothing may be dropped by the round-trip.
    expect(restored).toEqual(receiptExpense);
    expect(restored.source).toBe('receipt');
    expect(restored.lineItems).toHaveLength(3);
    expect(restored.lineItems![0]).toEqual({
      description: 'Full cream milk 2L',
      amount: 34.99,
      category: 'food',
      qty: 1,
      unitPrice: 34.99,
    });
    // qty/unitPrice are optional per line item.
    expect(restored.lineItems![1]).toEqual({
      description: 'Bus ticket',
      amount: 22,
      category: 'transport',
    });
    expect(restored.createdBy).toBe('user_abc123');
    expect(restored.createdByName).toBe('Ewald');
  });

  it('accepts every ExpenseEntry source variant the live type allows', async () => {
    const sources = ['manual', 'voice', 'import', 'receipt'] as const;
    const data = {
      expenses: sources.map((source, i) => ({
        id: `src-${i}`,
        date: '2026-08-01',
        category: 'other',
        merchant: 'Test',
        amount: 1,
        source,
      })),
    };
    const payload = await createBackupPayload(data);
    const result = await parseAndValidateBackup(JSON.stringify(payload));
    expect(result.data.expenses?.map((e) => e.source)).toEqual([...sources]);
  });

  it('round-trips tax, repeatedFrom and entryDate without stripping', async () => {
    // Guards regression: ExpenseEntry gained `tax`, `repeatedFrom` and
    // `entryDate` (scanned-receipt VAT, Repeat Purchase lineage, and the
    // purchase-vs-entry date split) but ExpenseEntrySchema lagged the live
    // type again — zod would silently strip all three on restore.
    // Fix: same commit that added the fields widened the schema.
    const data = {
      expenses: [
        {
          ...receiptExpense,
          tax: 45.02,
          repeatedFrom: 'orig-e89b-12d3-a456-426614174000',
          entryDate: '2026-08-04',
        },
      ],
    };
    const payload = await createBackupPayload(data);
    const result = await parseAndValidateBackup(JSON.stringify(payload));

    const restored = result.data.expenses![0];
    expect(restored).toEqual(data.expenses[0]);
    expect(restored.tax).toBe(45.02);
    expect(restored.repeatedFrom).toBe('orig-e89b-12d3-a456-426614174000');
    expect(restored.entryDate).toBe('2026-08-04');
  });

  it('rejects a line item with a non-numeric amount', async () => {
    const data = {
      expenses: [
        {
          ...receiptExpense,
          lineItems: [{ description: 'Broken', amount: 'not-a-number', category: 'food' }],
        },
      ],
    };
    const payload = await createBackupPayload(
      data as unknown as Parameters<typeof createBackupPayload>[0]
    );
    await expect(parseAndValidateBackup(JSON.stringify(payload))).rejects.toThrow();
  });

  it('should fail validation if data fields are invalid types', async () => {
    const invalidData = {
      ...validBackupData,
      expenses: [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          date: 'invalid-date',
          category: 'food',
          merchant: '7-Eleven',
          amount: 'string-instead-of-number', // Invalid type
          source: 'manual',
        },
      ],
    };

    const payload = await createBackupPayload(invalidData as unknown as Parameters<typeof createBackupPayload>[0]);
    await expect(
      parseAndValidateBackup(JSON.stringify(payload))
    ).rejects.toThrow();
  });
});
