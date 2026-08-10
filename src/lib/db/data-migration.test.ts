import { describe, it, expect, beforeAll } from 'vitest';
import { 
  requestPersistentStorage, 
  getStorageEstimate, 
  auditAndRepairDatabase
} from './local-db';

describe('Local DB Advanced Data Protection', () => {
  beforeAll(() => {
    if (typeof window === 'undefined') {
      global.window = globalThis as unknown as Window & typeof globalThis;
    }
  });

  it('should query storage estimates without error', async () => {
    const estimate = await getStorageEstimate();
    expect(estimate).toHaveProperty('persisted');
    expect(estimate).toHaveProperty('usage');
    expect(estimate).toHaveProperty('quota');
  });

  it('should request storage persistence without error', async () => {
    const isPersisted = await requestPersistentStorage();
    expect(typeof isPersisted).toBe('boolean');
  });

  it('should execute database audit & repair cleanly', async () => {
    const result = await auditAndRepairDatabase();
    expect(result.status).toBeDefined();
    expect(result.logs.length).toBeGreaterThan(0);
  });
});
