import type { ReceiptTemplate } from './za';

export const TH_TEMPLATES: ReceiptTemplate[] = [
  {
    id: 'th.7eleven.v1',
    country: 'TH',
    currency: 'THB',
    vatRate: 0.07,
    dateOrder: 'DMY',
    fingerprints: [/7-ELEVEN|7\s*ELEVEN/i],
  },
];
