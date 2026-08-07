// components/dashboard/panels/net-worth-types.ts

export const ASSET_TYPES = [
  { value: 'cash', label: { en: 'Cash' }, icon: '💵' },
  { value: 'investment', label: { en: 'Investment' }, icon: '📈' },
  { value: 'property', label: { en: 'Property' }, icon: '🏠' },
  { value: 'vehicle', label: { en: 'Vehicle' }, icon: '🚗' },
  { value: 'gold', label: { en: 'Gold' }, icon: '🥇' },
  { value: 'crypto', label: { en: 'Crypto' }, icon: '₿' },
  { value: 'other', label: { en: 'Other' }, icon: '📦' },
] as const;

export const LIABILITY_TYPES = [
  { value: 'credit_card', label: { en: 'Credit Card' } },
  { value: 'personal_loan', label: { en: 'Personal Loan' } },
  { value: 'car_loan', label: { en: 'Car Loan' } },
  { value: 'mortgage', label: { en: 'Mortgage' } },
  { value: 'family', label: { en: 'Family Loan' } },
  { value: 'other', label: { en: 'Other' } },
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