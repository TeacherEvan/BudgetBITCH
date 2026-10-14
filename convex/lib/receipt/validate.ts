import { parseAmounts } from './amounts';

export type ValidationParams = {
  total?: number | null;
  totalRaw?: string;
  subtotal?: number | null;
  tax?: number | null;
  itemsSum?: number | null;
  country?: string;
  totalConf: number;
};

export type ValidationResult = {
  isValidSubtotalTax: boolean;
  isValidItemsSum: boolean;
  isValidVatRate: boolean;
  repairedDigits: boolean;
  adjustedTotalConf: number;
};

const VAT_RATES: Record<string, number> = {
  ZA: 0.15,
  TH: 0.07,
};

export function validateExtraction(params: ValidationParams): ValidationResult {
  let total = params.total ?? null;
  let repairedDigits = false;

  // Check digit repair if raw string contains O/I/l/S/B
  if (params.totalRaw && /[OIlSB]/.test(params.totalRaw)) {
    const repairedStr = params.totalRaw
      .replace(/O/g, '0')
      .replace(/[Il]/g, '1')
      .replace(/S/g, '5')
      .replace(/B/g, '8');
    // Re-read the repaired string through the shared tokeniser. Stripping every
    // non-digit except `.` turned `60.000` into 60 and `1.234,56` into 1.234,
    // so the arithmetic check below could never confirm a repair on a
    // grouped-thousands or European-format receipt.
    const repairedTokens = parseAmounts(repairedStr);
    const repairedVal =
      repairedTokens.length > 0
        ? repairedTokens[0].value
        : parseFloat(repairedStr.replace(/[^0-9\.]/g, ''));

    if (!isNaN(repairedVal) && params.subtotal && params.tax) {
      if (Math.abs(params.subtotal + params.tax - repairedVal) <= 0.05) {
        total = repairedVal;
        repairedDigits = true;
      }
    }
  }

  let isValidSubtotalTax = false;
  if (total !== null && params.subtotal !== undefined && params.subtotal !== null && params.tax !== undefined && params.tax !== null) {
    isValidSubtotalTax = Math.abs(params.subtotal + params.tax - total) <= 0.05;
  }

  let isValidItemsSum = false;
  if (total !== null && params.itemsSum !== undefined && params.itemsSum !== null) {
    isValidItemsSum = Math.abs(params.itemsSum - total) <= 0.05;
    if (!isValidItemsSum && params.subtotal !== undefined && params.subtotal !== null) {
      isValidItemsSum = Math.abs(params.itemsSum - params.subtotal) <= 0.05;
    }
  }

  let isValidVatRate = false;
  const targetRate = params.country ? VAT_RATES[params.country] : undefined;
  if (total !== null && params.tax !== undefined && params.tax !== null && targetRate && total > params.tax) {
    const calcRate = params.tax / (total - params.tax);
    isValidVatRate = Math.abs(calcRate - targetRate) <= 0.02;
  }

  let adjustedTotalConf = params.totalConf;

  if (isValidSubtotalTax) adjustedTotalConf += 0.15;
  if (isValidItemsSum) adjustedTotalConf += 0.1;
  if (isValidVatRate) adjustedTotalConf += 0.1;

  if (total !== null && params.subtotal !== undefined && params.subtotal !== null && params.subtotal > total) {
    adjustedTotalConf -= 0.3;
  }

  adjustedTotalConf = Math.min(1.0, Math.max(0.0, adjustedTotalConf));

  return {
    isValidSubtotalTax,
    isValidItemsSum,
    isValidVatRate,
    repairedDigits,
    adjustedTotalConf,
  };
}
