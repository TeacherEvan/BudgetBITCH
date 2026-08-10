// convex/receipts/index.ts
// Barrel for the receipts domain — preserves every api.receipts.* and
// internal.receipts.* binding so no call site (src, tests, or line.ts) changes.

export {
  normalizeCategory,
  validateAmount,
  validateDate,
  validateMerchant,
} from "./constants";

export {
  proxyReceiptScan,
  parseReceipt,
  parseMessage,
} from "./scanActions";

export {
  saveReceipt,
  getReceiptByClientDraftId,
  getUserForIngest,
  listReceipts,
  getReceipt,
  deleteReceipt,
} from "./draftCrud";

export {
  scrape,
  answer,
  confirm,
  syncOfflineDraft,
  templateSnapshot,
} from "./scrapeBot";

export { ingestReceipt } from "./ingest";
