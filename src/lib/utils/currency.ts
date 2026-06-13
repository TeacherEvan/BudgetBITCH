// lib/utils/currency.ts

export function formatCurrency(amount: number, locale: 'th' | 'en' = 'en'): string {
  const currency = locale === 'th' ? 'THB' : 'USD';
  return new Intl.NumberFormat(locale === 'th' ? 'th-TH' : 'en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function parseCurrency(value: string): number {
  return Number(value.replace(/[^0-9.-]/g, '')) || 0;
}