import { parseAmounts } from './amounts';
import type { NormalisedLine, NormalisedPayload } from './normalise';
import type { FieldCandidate } from './types';

const POSITIVE_TOTAL_ANCHORS = [
  /\bGRAND\s+TOTAL\b/i,
  /\bAMOUNT\s+DUE\b/i,
  /\bBALANCE\s+DUE\b/i,
  /\bTO\s+PAY\b/i,
  /\bTOTAL\b/i,
  /\bTOTAAL\b/i,
  /รวมทั้งสิ้น/i,
  /ยอดสุทธิ/i,
];

const NEGATIVE_ANCHORS = [
  /\bTOTAL\s+SAVINGS\b/i,
  /\bSAVINGS\b/i,
  /\bSUBTOTAL\b/i,
  /\bSUB\s*TOTAL\b/i,
  /\bCHANGE\b/i,
  /\bTENDERED\b/i,
  /\bCASH\b/i,
  /\bROUNDING\b/i,
  // A discount line frequently reads "TOTAL DISC -60.000": the TOTAL anchor
  // matches, and the receipt's rebate is banked as the amount owed.
  /\bDISC(?:OUNT)?\b/i,
  // "TOTAL ITEMS 3" is a unit count, not money.
  /\bTOTAL\s+ITEMS?\b/i,
  /\bQTY\b/i,
];

/**
 * Amounts on an anchored TOTAL line may carry no separators at all
 * (`TOTAL 91000` — IDR, VND, JPY and other minor-unit-less currencies).
 * `parseAmounts` deliberately ignores bare integers everywhere else, because
 * receipts are full of counts, till numbers and item codes. Restricting the
 * bare-integer read to a line that already matched a total anchor keeps that
 * conservatism where it matters.
 */
function parseBareIntegerAmounts(text: string): number[] {
  const out: number[] = [];
  for (const match of text.matchAll(/(?<![\d.,])(\d{2,6})(?![\d.,])/g)) {
    out.push(parseInt(match[1], 10));
  }
  return out;
}

/** Totals are amounts owed: zero and negatives are never the receipt total. */
function firstPositive(values: number[]): number | null {
  for (let i = values.length - 1; i >= 0; i--) {
    if (values[i] > 0) return values[i];
  }
  return null;
}

/**
 * Same right-to-left scan as `firstPositive`, but zero is allowed: a zero-rated
 * or exempt VAT line (`VAT 0.00`) is a legitimate tax reading, while a negative
 * one (a refund's `VAT 22.50-`) must never be summed into a total.
 */
function rightmostNonNegative(values: number[]): number | null {
  for (let i = values.length - 1; i >= 0; i--) {
    if (values[i] >= 0) return values[i];
  }
  return null;
}

export function extractTotal(payload: NormalisedPayload): FieldCandidate | null {
  const lines = payload.lines;

  // 1. Anchor search
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const text = line.text;

    // Reject lines matching negative anchors
    if (NEGATIVE_ANCHORS.some((neg) => neg.test(text))) {
      continue;
    }

    // Check positive anchors
    if (POSITIVE_TOTAL_ANCHORS.some((pos) => pos.test(text))) {
      const sameLine =
        firstPositive(parseAmounts(text).map((a) => a.value)) ??
        firstPositive(parseBareIntegerAmounts(text));
      if (sameLine !== null) {
        return {
          value: sameLine,
          conf: 0.9,
          evidenceLine: line,
          ruleId: 'anchor-same-line',
        };
      }

      // Check next line if exists
      if (i + 1 < lines.length) {
        const nextLine = lines[i + 1];
        const nextValue = firstPositive(parseAmounts(nextLine.text).map((a) => a.value));
        if (nextValue !== null) {
          return {
            value: nextValue,
            conf: 0.85,
            evidenceLine: nextLine,
            ruleId: 'anchor-next-line',
          };
        }
      }
    }
  }

  // 2. Subtotal + Tax fallback
  let subtotalVal: number | null = null;
  let taxVal: number | null = null;
  let subtotalLine: NormalisedLine | null = null;

  for (const line of lines) {
    if (/\bSUBTOTAL\b/i.test(line.text) || /\bSUB\s*TOTAL\b/i.test(line.text)) {
      // Positive-only, for the same reason the anchor path is: a refund's
      // `SUBTOTAL 150.00-` plus `VAT 22.50-` used to sum to a negative total and
      // land on the draft as money owed.
      const subtotalCandidate = firstPositive(parseAmounts(line.text).map((a) => a.value));
      if (subtotalCandidate !== null) {
        subtotalVal = subtotalCandidate;
        subtotalLine = line;
      }
    }
    if (/\b(?:VAT|TAX|BTW)\b/i.test(line.text) && !/REG\s*NO/i.test(line.text)) {
      const taxCandidate = rightmostNonNegative(parseAmounts(line.text).map((a) => a.value));
      if (taxCandidate !== null) {
        taxVal = taxCandidate;
      }
    }
  }

  if (subtotalVal !== null && taxVal !== null) {
    const calcTotal = Math.round((subtotalVal + taxVal) * 100) / 100;
    return {
      value: calcTotal,
      conf: 0.75,
      evidenceLine: subtotalLine ?? undefined,
      ruleId: 'subtotal-tax-sum',
    };
  }

  // 3. Bottom half largest amount fallback
  const startIdx = Math.floor(lines.length / 2);
  let maxVal: number | null = null;
  let maxLine: NormalisedLine | null = null;

  for (let i = startIdx; i < lines.length; i++) {
    const line = lines[i];
    if (NEGATIVE_ANCHORS.some((neg) => neg.test(line.text))) continue;

    const amounts = parseAmounts(line.text);
    for (const amt of amounts) {
      if (amt.value > (maxVal ?? 0)) {
        maxVal = amt.value;
        maxLine = line;
      }
    }
  }

  if (maxVal !== null) {
    return {
      value: maxVal,
      conf: 0.6,
      evidenceLine: maxLine ?? undefined,
      ruleId: 'bottom-largest-fallback',
    };
  }

  return null;
}
