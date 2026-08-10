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
  const matches = cleanText.matchAll(
    /(?:[R฿\$€£]\s*)?(-?\d{1,3}(?:[ ,.]\d{3})*(?:[\.,]\d{2})-?|-?\d+(?:[\.,]\d{2})-?)/g
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
