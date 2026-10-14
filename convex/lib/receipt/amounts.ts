export type AmountToken = {
  value: number;
  raw: string;
  decimalSep: '.' | ',';
  isNegative?: boolean;
};

// Patterns to ignore
const VAT_OR_REG_PATTERN = /(?:VAT|REG|TEL|FAX|PHONE|NO|TAX|INV|STATION|TILL)\s*(?:NO|ID)?\s*[:\.]?\s*\d{6,}/i;
const DATE_OR_TIME_PATTERN = /\b\d{1,4}[\/\.-]\d{1,2}[\/\.-]\d{1,4}\b|\b\d{1,2}:\d{2}\b/;

export function parseAmounts(text: string): AmountToken[] {
  // If line is clearly a VAT registration, phone number or standalone date line without currency
  if (VAT_OR_REG_PATTERN.test(text) && !/[R฿\$€£]\s*\d/.test(text) && !/\bTOTAL\b/i.test(text)) {
    return [];
  }

  // Remove date and time substrings so they aren't parsed as amounts
  const cleanText = text.replace(DATE_OR_TIME_PATTERN, '');

  const tokens: AmountToken[] = [];

  // Match numbers with standard decimal structure:
  // e.g. R 1 234.56, ฿1,234.56, 1234.56, 1.234,56, 105.00-
  //
  // The decimal alternatives end in `(?!\d)` so a three-digit *grouping* is
  // never mistaken for a two-decimal tail: without it, `28,000` matched the
  // prefix `28,00` and silently became 28.00 — a 1000x under-read on any
  // currency that groups thousands but omits minor units (IDR, VND, CLP).
  // The final alternative captures those grouped integers (`28,000`, `60.000`,
  // `1.234.567`) at full value.
  const matches = cleanText.matchAll(
    /(?:[R฿\$€£]\s*)?(-?\d{1,3}(?:[ ,.]\d{3})*[\.,]\d{2}(?!\d)-?|-?\d+[\.,]\d{2}(?!\d)-?|-?\d{1,3}(?:[ ,.]\d{3})+(?!\d))/g
  );

  for (const match of matches) {
    const raw = match[1].trim();

    // Check if it's a long phone number or VAT id (7+ digits with no decimal separator)
    if (/^\d{7,}$/.test(raw)) {
      continue;
    }

    let numStr = raw;
    let isNegative = false;

    if (numStr.endsWith('-')) {
      isNegative = true;
      numStr = numStr.slice(0, -1);
    } else if (numStr.startsWith('-')) {
      isNegative = true;
      numStr = numStr.slice(1);
    }

    let decimalSep: '.' | ',' = '.';
    // A trailing group of exactly three digits is a thousands grouping, not a
    // decimal tail (`28,000` = twenty-eight thousand, `60.000` = sixty
    // thousand). Only a two-digit tail is treated as minor units.
    const hasDecimalTail = /[\.,]\d{2}$/.test(numStr);

    if (!hasDecimalTail) {
      numStr = numStr.replace(/[\s,.]/g, '');
    } else {
      // Determine decimal separator: if last non-digit is comma, decimalSep is ','
      const commaIndex = numStr.lastIndexOf(',');
      const dotIndex = numStr.lastIndexOf('.');

      if (commaIndex > dotIndex) {
        decimalSep = ',';
        numStr = numStr.replace(/\./g, '').replace(',', '.');
      } else {
        decimalSep = '.';
        numStr = numStr.replace(/[\s,]/g, '');
      }
    }

    const val = parseFloat(numStr);
    if (!isNaN(val)) {
      tokens.push({
        value: isNegative ? -val : val,
        raw,
        decimalSep,
        isNegative,
      });
    }
  }

  return tokens;
}
