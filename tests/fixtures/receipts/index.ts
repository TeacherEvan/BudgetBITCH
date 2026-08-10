import type { OcrPayload } from '../../../convex/lib/receipt/types';

import genericRestaurant from './generic-restaurant.json';
import th7elevenBasic from './th-7eleven-basic.json';
import zaCheckersBasic from './za-checkers-basic.json';
import zaShoprite from './za-shoprite.json';
import zaPnp from './za-pnp.json';
import zaWoolworths from './za-woolworths.json';
import zaSpar from './za-spar.json';
import zaClicks from './za-clicks.json';
import zaDischem from './za-dischem.json';
import zaEngen from './za-engen.json';
import zaMakro from './za-makro.json';
import zaTakealot from './za-takealot.json';
import thLotus from './th-lotus.json';
import thBigc from './th-bigc.json';
import thMakro from './th-makro.json';
import thTops from './th-tops.json';
import thFamilymart from './th-familymart.json';
import thRestaurantDigits from './th-restaurant-digits.json';
import thBuddhistEra from './th-buddhist-era.json';
import advSavingsTrap from './adv-savings-trap.json';
import advSubtotalOnly from './adv-subtotal-only.json';
import advGarbledDigits from './adv-garbled-digits.json';
import advNoDate from './adv-no-date.json';
import advAmbiguousDate from './adv-ambiguous-date.json';
import advTwocolCard from './adv-twocol-card.json';

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
  zaShoprite as unknown as ReceiptFixture,
  zaPnp as unknown as ReceiptFixture,
  zaWoolworths as unknown as ReceiptFixture,
  zaSpar as unknown as ReceiptFixture,
  zaClicks as unknown as ReceiptFixture,
  zaDischem as unknown as ReceiptFixture,
  zaEngen as unknown as ReceiptFixture,
  zaMakro as unknown as ReceiptFixture,
  zaTakealot as unknown as ReceiptFixture,
  thLotus as unknown as ReceiptFixture,
  thBigc as unknown as ReceiptFixture,
  thMakro as unknown as ReceiptFixture,
  thTops as unknown as ReceiptFixture,
  thFamilymart as unknown as ReceiptFixture,
  thRestaurantDigits as unknown as ReceiptFixture,
  thBuddhistEra as unknown as ReceiptFixture,
  advSavingsTrap as unknown as ReceiptFixture,
  advSubtotalOnly as unknown as ReceiptFixture,
  advGarbledDigits as unknown as ReceiptFixture,
  advNoDate as unknown as ReceiptFixture,
  advAmbiguousDate as unknown as ReceiptFixture,
  advTwocolCard as unknown as ReceiptFixture,
];

export async function loadAllFixtures(): Promise<ReceiptFixture[]> {
  return SEED_FIXTURES;
}

export async function loadFixtureById(id: string): Promise<ReceiptFixture | undefined> {
  const all = await loadAllFixtures();
  return all.find((f) => f.id === id);
}
