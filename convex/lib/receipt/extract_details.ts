import { parseAmounts } from './amounts';
import type { NormalisedPayload } from './normalise';
import type { FieldCandidate } from './types';

export type LineItem = {
  description: string;
  amount: number;
  qty?: number;
  unit_price?: number;
};

export function extractTax(payload: NormalisedPayload): FieldCandidate | null {
  for (const line of payload.lines) {
    const text = line.text;
    if (/\b(?:VAT|TAX|BTW)\b/i.test(text) && !/REG\s*NO|INVOICE/i.test(text)) {
      const amounts = parseAmounts(text);
      if (amounts.length > 0) {
        return {
          value: amounts[amounts.length - 1].value,
          conf: 0.85,
          evidenceLine: line,
          ruleId: 'tax-anchor',
        };
      }
    }
  }
  return null;
}

const COUNTRY_TO_CURRENCY: Record<string, string> = {
  ZA: 'ZAR',
  TH: 'THB',
  US: 'USD',
  GB: 'GBP',
  EU: 'EUR',
};

export function detectCurrency(payload: NormalisedPayload): FieldCandidate | null {
  if (payload.currencyHint) {
    return {
      value: payload.currencyHint,
      conf: 0.9,
      ruleId: 'currency-hint',
    };
  }

  if (payload.countryHint && COUNTRY_TO_CURRENCY[payload.countryHint]) {
    return {
      value: COUNTRY_TO_CURRENCY[payload.countryHint],
      conf: 0.85,
      ruleId: 'country-hint',
    };
  }

  // Scan lines for currency symbols
  for (const line of payload.lines) {
    const text = line.text;
    if (/฿|THB/i.test(text)) {
      return { value: 'THB', conf: 0.95, evidenceLine: line, ruleId: 'symbol-thb' };
    }
    if (/\bR\s*\d/.test(text)) {
      return { value: 'ZAR', conf: 0.9, evidenceLine: line, ruleId: 'symbol-zar' };
    }
    if (/\$/.test(text)) {
      return { value: 'USD', conf: 0.8, evidenceLine: line, ruleId: 'symbol-usd' };
    }
    if (/€/.test(text)) {
      return { value: 'EUR', conf: 0.9, evidenceLine: line, ruleId: 'symbol-eur' };
    }
    if (/£/.test(text)) {
      return { value: 'GBP', conf: 0.9, evidenceLine: line, ruleId: 'symbol-gbp' };
    }
  }

  return { value: 'ZAR', conf: 0.5, ruleId: 'default-fallback' };
}

export function extractLineItems(payload: NormalisedPayload): LineItem[] {
  const items: LineItem[] = [];

  // Find index of subtotal / total line
  let totalLineIdx = payload.lines.findIndex((line) =>
    /\b(?:TOTAL|SUBTOTAL|AMOUNT DUE|BALANCE DUE|ยอดสุทธิ|รวมทั้งสิ้น)\b/i.test(line.text)
  );

  if (totalLineIdx === -1) {
    totalLineIdx = payload.lines.length;
  }

  // Regex to find qty * unit_price = total patterns
  const QTY_UNIT_PATTERN = /(\d+(?:\.\d+)?)\s*[x×]\s*(\d+(?:[.,]\d{2})?)\s*[=]\s*(\d+(?:[.,]\d{2})?)/i;

  for (let i = 0; i < totalLineIdx; i++) {
    const line = payload.lines[i];
    if (line.isNoise) continue;
    if (/DATE|TIME|VAT|REG|INVOICE|WELCOME|CASHIER|TILL/i.test(line.text)) continue;

    const amounts = parseAmounts(line.text);
    if (amounts.length > 0) {
      const lastAmt = amounts[amounts.length - 1];
      // Description is text before amount
      const descEnd = line.text.lastIndexOf(lastAmt.raw);
      const desc = (descEnd > 0 ? line.text.slice(0, descEnd) : line.text).trim();

      if (desc.length >= 2 && !/^\d+$/.test(desc)) {
        const item: LineItem = {
          description: desc,
          amount: lastAmt.value,
        };

        // Try to parse qty * unit_price pattern
        const qtyUnitMatch = line.text.match(QTY_UNIT_PATTERN);
        if (qtyUnitMatch) {
          const qty = parseFloat(qtyUnitMatch[1]);
          const unitPrice = parseFloat(qtyUnitMatch[2].replace(',', '.'));
          const total = parseFloat(qtyUnitMatch[3].replace(',', '.'));
          if (!Number.isNaN(qty) && !Number.isNaN(unitPrice) && Math.abs(qty * unitPrice - total) < 0.02) {
            item.qty = qty;
            item.unit_price = unitPrice;
          }
        }

        items.push(item);
      }
    }
  }

  return items;
}
