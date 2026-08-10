// convex/accounts/types.ts

export const INVITE_CODE_LEN = 8;
export const MAX_OWNED_ACCOUNTS = 5;
export const MAX_MEMBERS = 8;

/** Umbrella keys supported by the Accounts feature. */
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

export interface AccountSummary {
  accountId: string;
  umbrella: string;
  name: string;
  role: "owner" | "member";
  boardId: string;
  memberCount: number;
  inviteCode: string | null;
}
