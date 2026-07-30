import { describe, expect, test } from 'vitest';
import { matchTemplate } from './fingerprint';
import { normalisePayload } from './normalise';
import { loadAllFixtures } from '../../../tests/fixtures/receipts';

describe('Merchant fingerprint and template tier', () => {
  test('matches za.checkers.v1 template for Checkers fixture', async () => {
    const fixtures = await loadAllFixtures();
    const checkers = fixtures.find((f) => f.id === 'za-checkers-basic')!;
    const norm = normalisePayload(checkers.payload);

    const template = matchTemplate(norm);
    expect(template).toBeDefined();
    expect(template?.id).toBe('za.checkers.v1');
    expect(template?.country).toBe('ZA');
  });

  test('matches th.7eleven.v1 template for 7-Eleven fixture', async () => {
    const fixtures = await loadAllFixtures();
    const seven = fixtures.find((f) => f.id === 'th-7eleven-basic')!;
    const norm = normalisePayload(seven.payload);

    const template = matchTemplate(norm);
    expect(template).toBeDefined();
    expect(template?.id).toBe('th.7eleven.v1');
    expect(template?.country).toBe('TH');
  });
});
