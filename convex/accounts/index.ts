// convex/accounts/index.ts
// Barrel export for accounts domain - maintains all existing api/internal bindings

// Types and constants
export {
  INVITE_CODE_LEN,
  MAX_OWNED_ACCOUNTS,
  MAX_MEMBERS,
  UMBRELLA_KEYS,
  type UmbrellaKey,
  type AccountSummary,
} from "./types";

// Helpers
export {
  generateInviteCode,
  ensureProfileDoc,
  getBoardMemberIds,
} from "./helpers";

// Account CRUD
export {
  createAccount,
  listMyAccounts,
  getAccount,
  renameAccount,
  rotateInviteCode,
  deleteAccount,
} from "./accountCrud";

// Account invites & members
export {
  inviteByCode,
  createInviteToken,
  redeemInviteToken,
  listInvites,
  acceptInvite,
  declineInvite,
  removeMember,
  leaveAccount,
  resolveInviteCode,
  getCurrentUserEmail,
} from "./accountInvites";

// Board sync & password
export {
  pushAccountBoard,
  getAccountBoard,
  changePassword,
} from "./accountBoardSync";