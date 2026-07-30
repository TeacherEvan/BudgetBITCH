import type { ReceiptTemplate } from './za';

export const TH_TEMPLATES: ReceiptTemplate[] = [
  {
    id: 'th.7eleven.v1',
    country: 'TH',
    currency: 'THB',
    vatRate: 0.07,
    dateOrder: 'DMY',
    fingerprints: [/7-ELEVEN|7-11/i],
  },
  {
    id: 'th.lotus.v1',
    country: 'TH',
    currency: 'THB',
    vatRate: 0.07,
    dateOrder: 'DMY',
    fingerprints: [/LOTUS'?S/i],
  },
  {
    id: 'th.bigc.v1',
    country: 'TH',
    currency: 'THB',
    vatRate: 0.07,
    dateOrder: 'DMY',
    fingerprints: [/BIG\s*C/i],
  },
  {
    id: 'th.makro.v1',
    country: 'TH',
    currency: 'THB',
    vatRate: 0.07,
    dateOrder: 'DMY',
    fingerprints: [/SIAM\s*MAKRO|MAKRO/i],
  },
];
