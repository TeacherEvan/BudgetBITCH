// convex/accounts.ts
// Barrel export for accounts domain - maintains all existing api/internal bindings

// Types and constants
export {
  INVITE_CODE_LEN,
  MAX_OWNED_ACCOUNTS,
  MAX_MEMBERS,
  UMBRELLA_KEYS,
  type UmbrellaKey,
  type AccountSummary,
} from "./accounts/types";

// Helpers
export {
  generateInviteCode,
  ensureProfileDoc,
  getBoardMemberIds,
} from "./accounts/helpers";

// Account CRUD
export {
  createAccount,
  listMyAccounts,
  getAccount,
  renameAccount,
  rotateInviteCode,
  deleteAccount,
  setDisplayName,
  getMyProfile,
} from "./accounts/accountCrud";

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
} from "./accounts/accountInvites";

// Purchase Notes
export {
  setPurchaseNote,
  getPurchaseNotes,
  deletePurchaseNote,
} from "./accounts/purchaseNotes";

// Board sync & password
export {
  pushAccountBoard,
  getAccountBoard,
  changePassword,
} from "./accounts/accountBoardSync";