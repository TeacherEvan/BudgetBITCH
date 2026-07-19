// lib/types/accounts.ts
// Shared types + umbrella catalogue for the Accounts multi-board feature.

export const UMBRELLA_KEYS = [
  "family",
  "couple",
  "business",
  "school",
  "friends",
  "charity",
  "shopping",
] as const;

export type UmbrellaKey = (typeof UMBRELLA_KEYS)[number];

export interface UmbrellaDef {
  key: UmbrellaKey;
  emoji: string;
  /** i18n key used in messages.ts (e.g. "accounts.umbrella.family") */
  labelKey: string;
  /** Suggested default account name (also i18n-driven via nameKey). */
  nameKey: string;
  /**
   * Light tailoring: a single copyable starter template string per umbrella.
   * No engine divergence — just a friendly nudge when creating the account.
   */
  starterTemplate?: string;
  /** Optional per-umbrella feature hint shown on the account card. */
  features?: string[];
}

export const UMBRELLAS: Record<UmbrellaKey, UmbrellaDef> = {
  family: {
    key: "family",
    emoji: "👨‍👩‍👧‍👦",
    labelKey: "accounts.umbrella.family",
    nameKey: "accounts.defaultName.family",
    starterTemplate: "Household bills, groceries, kids, shared savings",
    features: [
      "Per-member spending caps",
      "Shared grocery + utility pots",
      "Family savings goal",
    ],
  },
  couple: {
    key: "couple",
    emoji: "💑",
    labelKey: "accounts.umbrella.couple",
    nameKey: "accounts.defaultName.couple",
    starterTemplate: "Rent, date nights, joint savings",
    features: ["50/50 split view", "Joint goal tracker"],
  },
  business: {
    key: "business",
    emoji: "💼",
    labelKey: "accounts.umbrella.business",
    nameKey: "accounts.defaultName.business",
    starterTemplate: "Revenue, expenses, tax pot, payroll",
    features: ["VAT/tax reserve", "Client income tracking", "Receipt capture"],
  },
  school: {
    key: "school",
    emoji: "🎓",
    labelKey: "accounts.umbrella.school",
    nameKey: "accounts.defaultName.school",
    starterTemplate: "Tuition, supplies, field trips, lunch",
    features: ["Term budget", "Activity fund"],
  },
  friends: {
    key: "friends",
    emoji: "🎉",
    labelKey: "accounts.umbrella.friends",
    nameKey: "accounts.defaultName.friends",
    starterTemplate: "Trip fund, shared meals, group gifts",
    features: ["Split-the-bill pot", "Trip fund"],
  },
  charity: {
    key: "charity",
    emoji: "🤝",
    labelKey: "accounts.umbrella.charity",
    nameKey: "accounts.defaultName.charity",
    starterTemplate: "Donations, drive expenses, transparency log",
    features: ["Public total raised", "Per-donor log"],
  },
  shopping: {
    key: "shopping",
    emoji: "🛍️",
    labelKey: "accounts.umbrella.shopping",
    nameKey: "accounts.defaultName.shopping",
    starterTemplate: "Wishlist, deal alerts, spend cap",
    features: ["Wishlist pot", "No-impulse cap"],
  },
};

export const MAX_OWNED_ACCOUNTS = 5;
export const MAX_MEMBERS = 8;

/** Special id for the user's own personal (non-shared) board. */
export const PERSONAL_ACCOUNT_ID = "personal";

export interface LocalAccountMeta {
  accountId: string; // PERSONAL_ACCOUNT_ID for the personal board
  umbrella: UmbrellaKey | "personal";
  name: string;
  boardId: string | null; // null for personal
  inviteCode: string | null; // null for personal
  role: "owner" | "member";
  /** True when this account's data is stashed locally (has been opened). */
  hasLocalData?: boolean;
}

// Literal TH/EN labels for inline UI use (the app renders labels per-locale
// via local lookup objects rather than next-intl keys in most client pages).
export const UMBRELLA_LABELS: Record<UmbrellaKey, { th: string; en: string }> = {
  family: { th: "ครอบครัว", en: "Family" },
  couple: { th: "คู่รัก", en: "Couple" },
  business: { th: "ธุรกิจ", en: "Business" },
  school: { th: "โรงเรียน", en: "School" },
  friends: { th: "เพื่อน", en: "Friends" },
  charity: { th: "การกุศล", en: "Charity" },
  shopping: { th: "ช้อปปิ้ง", en: "Shopping" },
};

export const UMBRELLA_TAGLINES: Record<UmbrellaKey, { th: string; en: string }> = {
  family: { th: "ค่าใช้จ่ายบ้าน + เป้าหมายครอบครัว", en: "Household bills + family goals" },
  couple: { th: "ค่าใช้จ่ายคู่ + เป้าหมายร่วม", en: "Joint spending + shared goals" },
  business: { th: "รายรับ-รายจ่าย + ภาษี", en: "Revenue, expenses + tax" },
  school: { th: "ค่าเทอม + อุปกรณ์", en: "Tuition + supplies" },
  friends: { th: "กองเที่ยว + หารบิล", en: "Trip fund + split bills" },
  charity: { th: "บริจาค + รายงานโปร่งใส", en: "Donations + transparency" },
  shopping: { th: "ร้านค้า + งด impulsive", en: "Wishlist + no-impulse cap" },
};

export function umbrellaLabel(key: UmbrellaKey | "personal", locale: "th" | "en"): string {
  if (key === "personal") return locale === "th" ? "ส่วนตัว" : "Personal";
  return UMBRELLA_LABELS[key][locale];
}
