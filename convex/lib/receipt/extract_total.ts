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
      const amounts = parseAmounts(text);
      if (amounts.length > 0) {
        // Take rightmost amount
        const rightmost = amounts[amounts.length - 1];
        return {
          value: rightmost.value,
          conf: 0.9,
          evidenceLine: line,
          ruleId: 'anchor-same-line',
        };
      }

      // Check next line if exists
      if (i + 1 < lines.length) {
        const nextLine = lines[i + 1];
        const nextAmounts = parseAmounts(nextLine.text);
        if (nextAmounts.length > 0) {
          const rightmost = nextAmounts[nextAmounts.length - 1];
          return {
            value: rightmost.value,
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
