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
