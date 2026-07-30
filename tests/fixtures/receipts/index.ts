import type { OcrPayload } from '../../../convex/lib/receipt/types';

import genericRestaurant from './generic-restaurant.json';
import th7elevenBasic from './th-7eleven-basic.json';
import zaCheckersBasic from './za-checkers-basic.json';

export type ExpectedReceiptFields = {
  total: number;
  date: string;
  merchant: string;
  currency: string;
  category: string;
  tax?: number;
};

export type ReceiptFixture = {
  id: string;
  payload: OcrPayload;
  expected: ExpectedReceiptFields;
};

const SEED_FIXTURES: ReceiptFixture[] = [
  zaCheckersBasic as unknown as ReceiptFixture,
  th7elevenBasic as unknown as ReceiptFixture,
  genericRestaurant as unknown as ReceiptFixture,
];

export async function loadAllFixtures(): Promise<ReceiptFixture[]> {
  return SEED_FIXTURES;
}

export async function loadFixtureById(id: string): Promise<ReceiptFixture | undefined> {
  const all = await loadAllFixtures();
  return all.find((f) => f.id === id);
}
