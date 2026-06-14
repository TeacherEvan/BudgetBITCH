// components/dashboard/panels/net-worth-types.ts

export const ASSET_TYPES = [
  { value: 'cash', label: { th: 'เงินสด', en: 'Cash' }, icon: '💵' },
  { value: 'investment', label: { th: 'การลงทุน', en: 'Investment' }, icon: '📈' },
  { value: 'property', label: { th: 'อสังหาริมทรัพย์', en: 'Property' }, icon: '🏠' },
  { value: 'vehicle', label: { th: 'ยานพาหนะ', en: 'Vehicle' }, icon: '🚗' },
  { value: 'gold', label: { th: 'ทองคำ', en: 'Gold' }, icon: '🥇' },
  { value: 'crypto', label: { th: 'คริปโต', en: 'Crypto' }, icon: '₿' },
  { value: 'other', label: { th: 'อื่นๆ', en: 'Other' }, icon: '📦' },
] as const;

export const LIABILITY_TYPES = [
  { value: 'credit_card', label: { th: 'บัตรเครดิต', en: 'Credit Card' } },
  { value: 'personal_loan', label: { th: 'กู้ยืมส่วนตัว', en: 'Personal Loan' } },
  { value: 'car_loan', label: { th: 'กู้รถ', en: 'Car Loan' } },
  { value: 'mortgage', label: { th: 'กู้บ้าน/คอนโด', en: 'Mortgage' } },
  { value: 'family', label: { th: 'หนี้ครอบครัว', en: 'Family Loan' } },
  { value: 'other', label: { th: 'อื่นๆ', en: 'Other' } },
] as const;

export type AssetType = typeof ASSET_TYPES[number]['value'];
export type LiabilityType = typeof LIABILITY_TYPES[number]['value'];

export interface AssetInput {
  name: string;
  value: number;
  type: AssetType;
}

export interface LiabilityInput {
  name: string;
  value: number;
  type: LiabilityType;
}

export interface Asset {
  id: string;
  name: string;
  value: number;
  type: AssetType;
}

export interface Liability {
  id: string;
  name: string;
  value: number;
  type: LiabilityType;
}

export interface NetWorthSnapshot {
  date: string;
  assets: Asset[];
  liabilities: Liability[];
  netWorth: number;
}