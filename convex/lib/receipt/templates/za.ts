export type ReceiptTemplate = {
  id: string;
  country: string;
  currency: string;
  vatRate: number;
  dateOrder: 'DMY' | 'MDY' | 'YMD';
  fingerprints: RegExp[];
};

export const ZA_TEMPLATES: ReceiptTemplate[] = [
  {
    id: 'za.checkers.v1',
    country: 'ZA',
    currency: 'ZAR',
    vatRate: 0.15,
    dateOrder: 'DMY',
    fingerprints: [/CHECKERS/i],
  },
  {
    id: 'za.shoprite.v1',
    country: 'ZA',
    currency: 'ZAR',
    vatRate: 0.15,
    dateOrder: 'DMY',
    fingerprints: [/SHOPRITE/i],
  },
  {
    id: 'za.pnp.v1',
    country: 'ZA',
    currency: 'ZAR',
    vatRate: 0.15,
    dateOrder: 'DMY',
    fingerprints: [/PICK\s*N\s*PAY|PNP/i],
  },
  {
    id: 'za.woolworths.v1',
    country: 'ZA',
    currency: 'ZAR',
    vatRate: 0.15,
    dateOrder: 'DMY',
    fingerprints: [/WOOLWORTHS/i],
  },
  {
    id: 'za.spar.v1',
    country: 'ZA',
    currency: 'ZAR',
    vatRate: 0.15,
    dateOrder: 'DMY',
    fingerprints: [/SPAR|SUPERSPAR/i],
  },
];
