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
];

// Tender/Change detection patterns for triangular check
const TENDER_PATTERNS = [
  /\bCASH\b/i,
  /\bTENDER(?:ED)?\b/i,
  /\bPAID\b/i,
  /\bเงินสด\b/i,
  /\bรับเงิน\b/i,
];

const CHANGE_PATTERNS = [
  /\bCHANGE\b/i,
  /\bเงินทอน\b/i,
  /\bREFUND\b/i,
];

/** Triangular Accounting Identity Check: if tender (T) and change (C) detected,
 *  true total ≈ T - C. Use this to validate candidate totals. */
function findTenderAndChange(lines: NormalisedPayload['lines']): { tender: number | null; change: number | null } {
  let tender: number | null = null;
  let change: number | null = null;

  for (const line of lines) {
    const text = line.text;
    const amounts = parseAmounts(text);

    if (amounts.length === 0) continue;

    const rightmost = amounts[amounts.length - 1];
    const value = rightmost.value;

    if (TENDER_PATTERNS.some((p) => p.test(text)) && tender === null) {
      tender = value;
    } else if (CHANGE_PATTERNS.some((p) => p.test(text)) && change === null) {
      change = value;
    }
  }

  return { tender, change };
}

/** Apply triangular check to select best candidate total. */
function applyTriangularCheck(
  candidates: number[],
  tender: number | null,
  change: number | null
): number | null {
  if (tender === null || change === null) return null;
  if (candidates.length === 0) return null;

  // True total from accounting identity: T - C
  const expectedTotal = tender - change;

  // Find candidate closest to expected total (within 5 minor units tolerance)
  let bestCandidate: number | null = null;
  let bestDiff = Infinity;

  for (const candidate of candidates) {
    const diff = Math.abs(candidate - expectedTotal);
    if (diff < bestDiff && diff <= 5) { // 5 minor units = 0.05 currency tolerance
      bestDiff = diff;
      bestCandidate = candidate;
    }
  }

  return bestCandidate;
}

export function extractTotal(payload: NormalisedPayload): FieldCandidate | null {
  const lines = payload.lines;

  // 1. Anchor search - collect ALL candidates with their confidence
  const candidates: Array<{ value: number; conf: number; evidenceLine?: NormalisedLine; ruleId: string }> = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const text = line.text;

    // Reject lines matching negative anchors
    if (NEGATIVE_ANCHORS.some((neg) => neg.test(text))) {
      continue;
    }

    // Check positive anchors
    if (POSITIVE_TOTAL_ANCHORS.some((pos) => pos.test(text))) {
      const amounts = parseAmounts(text);
      if (amounts.length > 0) {
        // Take rightmost amount
        const rightmost = amounts[amounts.length - 1];
        candidates.push({
          value: rightmost.value,
          conf: 0.9,
          evidenceLine: line,
          ruleId: 'anchor-same-line',
        });
      }

      // Check next line if exists
      if (i + 1 < lines.length) {
        const nextLine = lines[i + 1];
        const nextAmounts = parseAmounts(nextLine.text);
        if (nextAmounts.length > 0) {
          const rightmost = nextAmounts[nextAmounts.length - 1];
          candidates.push({
            value: rightmost.value,
            conf: 0.85,
            evidenceLine: nextLine,
            ruleId: 'anchor-next-line',
          });
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
      const amounts = parseAmounts(line.text);
      if (amounts.length > 0) {
        subtotalVal = amounts[amounts.length - 1].value;
        subtotalLine = line;
      }
    }
    if (/\b(?:VAT|TAX|BTW)\b/i.test(line.text) && !/REG\s*NO/i.test(line.text)) {
      const amounts = parseAmounts(line.text);
      if (amounts.length > 0) {
        taxVal = amounts[amounts.length - 1].value;
      }
    }
  }

  if (subtotalVal !== null && taxVal !== null) {
    // Integer math: subtotal + tax (both in minor units)
    const calcTotal = subtotalVal + taxVal;
    candidates.push({
      value: calcTotal,
      conf: 0.75,
      evidenceLine: subtotalLine ?? undefined,
      ruleId: 'subtotal-tax-sum',
    });
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
    candidates.push({
      value: maxVal,
      conf: 0.6,
      evidenceLine: maxLine ?? undefined,
      ruleId: 'bottom-largest-fallback',
    });
  }

  // 4. Triangular Accounting Identity Check
  // If tender and change detected, use T - C to validate/select total
  const { tender, change } = findTenderAndChange(lines);
  const triangularTotal = applyTriangularCheck(
    candidates.map((c) => c.value),
    tender,
    change
  );

  if (triangularTotal !== null) {
    // Find the candidate that matches triangular total
    const match = candidates.find((c) => c.value === triangularTotal);
    if (match) {
      return {
        value: triangularTotal,
        conf: Math.max(match.conf, 0.95), // Boost confidence for triangular-validated
        evidenceLine: match.evidenceLine,
        ruleId: 'triangular-validated',
      };
    }
  }

  // 5. No triangular validation - return highest confidence candidate
  if (candidates.length > 0) {
    candidates.sort((a, b) => b.conf - a.conf);
    const best = candidates[0];
    return {
      value: best.value,
      conf: best.conf,
      evidenceLine: best.evidenceLine,
      ruleId: best.ruleId,
    };
  }

  return null;
}
