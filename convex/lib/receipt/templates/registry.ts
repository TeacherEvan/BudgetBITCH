import type { ReceiptTemplate } from './za';
import { ZA_TEMPLATES } from './za';
import { TH_TEMPLATES } from './th';

export const ALL_TEMPLATES: ReceiptTemplate[] = [
  ...ZA_TEMPLATES,
  ...TH_TEMPLATES,
];
