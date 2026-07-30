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
    const repairedVal = parseFloat(repairedStr.replace(/[^0-9\.]/g, ''));

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
