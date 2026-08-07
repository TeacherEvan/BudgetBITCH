import type { ReceiptFixture } from '../../../tests/fixtures/receipts';
import type { OcrPayload, ScrapeResult } from './types';

export type CorpusFailure = {
  fixtureId: string;
  field: 'total' | 'date' | 'merchant' | 'currency';
  expected: unknown;
  got: unknown;
  evidenceText?: string;
};

export type CorpusMetrics = {
  totalAcc: number;
  dateAcc: number;
  merchantAcc: number;
  currencyAcc: number;
  avgQuestions: number;
  failures: CorpusFailure[];
};

export function runCorpus(
  fixtures: ReceiptFixture[],
  scrapeFn: (payload: OcrPayload) => ScrapeResult
): CorpusMetrics {
  if (fixtures.length === 0) {
    return {
      totalAcc: 0,
      dateAcc: 0,
      merchantAcc: 0,
      currencyAcc: 0,
      avgQuestions: 0,
      failures: [],
    };
  }

  let correctTotal = 0;
  let correctDate = 0;
  let correctMerchant = 0;
  let correctCurrency = 0;
  let totalQuestions = 0;
  const failures: CorpusFailure[] = [];

  for (const fixture of fixtures) {
    const result = scrapeFn(fixture.payload);
    const exp = fixture.expected;

    totalQuestions += result.questions.length;

    const gotTotal = result.fields.total?.value;
    if (gotTotal !== undefined && gotTotal !== null && Number(gotTotal) === exp.total) {
      correctTotal++;
    } else {
      failures.push({
        fixtureId: fixture.id,
        field: 'total',
        expected: exp.total,
        got: gotTotal,
        evidenceText: result.evidence.total?.text,
      });
    }

    const gotDate = result.fields.date?.value;
    if (gotDate === exp.date) {
      correctDate++;
    } else if (exp.date) {
      failures.push({
        fixtureId: fixture.id,
        field: 'date',
        expected: exp.date,
        got: gotDate,
        evidenceText: result.evidence.date?.text,
      });
    }

    const gotMerchant = result.fields.merchant?.value;
    if (typeof gotMerchant === 'string' && gotMerchant.toLowerCase().includes(exp.merchant.toLowerCase())) {
      correctMerchant++;
    } else {
      failures.push({
        fixtureId: fixture.id,
        field: 'merchant',
        expected: exp.merchant,
        got: gotMerchant,
        evidenceText: result.evidence.merchant?.text,
      });
    }

    const gotCurrency = result.fields.currency?.value;
    if (gotCurrency === exp.currency) {
      correctCurrency++;
    } else {
      failures.push({
        fixtureId: fixture.id,
        field: 'currency',
        expected: exp.currency,
        got: gotCurrency,
        evidenceText: result.evidence.currency?.text,
      });
    }
  }

  const n = fixtures.length;
  return {
    totalAcc: correctTotal / n,
    dateAcc: correctDate / n,
    merchantAcc: correctMerchant / n,
    currencyAcc: correctCurrency / n,
    avgQuestions: totalQuestions / n,
    failures,
  };
}
