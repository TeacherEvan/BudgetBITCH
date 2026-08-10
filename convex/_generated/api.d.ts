/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as accounts from "../accounts.js";
import type * as accounts_accountBoardSync from "../accounts/accountBoardSync.js";
import type * as accounts_accountCrud from "../accounts/accountCrud.js";
import type * as accounts_accountInvites from "../accounts/accountInvites.js";
import type * as accounts_helpers from "../accounts/helpers.js";
import type * as accounts_index from "../accounts/index.js";
import type * as accounts_purchaseNotes from "../accounts/purchaseNotes.js";
import type * as accounts_types from "../accounts/types.js";
import type * as auth from "../auth.js";
import type * as boardMerge from "../boardMerge.js";
import type * as feedback from "../feedback.js";
import type * as http from "../http.js";
import type * as legal from "../legal.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_gemini from "../lib/gemini.js";
import type * as lib_line_verify from "../lib/line/verify.js";
import type * as lib_receipt_amounts from "../lib/receipt/amounts.js";
import type * as lib_receipt_categorize from "../lib/receipt/categorize.js";
import type * as lib_receipt_confidence from "../lib/receipt/confidence.js";
import type * as lib_receipt_currency from "../lib/receipt/currency.js";
import type * as lib_receipt_dates from "../lib/receipt/dates.js";
import type * as lib_receipt_engine from "../lib/receipt/engine.js";
import type * as lib_receipt_extract_details from "../lib/receipt/extract_details.js";
import type * as lib_receipt_extract_merchant from "../lib/receipt/extract_merchant.js";
import type * as lib_receipt_extract_total from "../lib/receipt/extract_total.js";
import type * as lib_receipt_fingerprint from "../lib/receipt/fingerprint.js";
import type * as lib_receipt_ingestSchema from "../lib/receipt/ingestSchema.js";
import type * as lib_receipt_learning from "../lib/receipt/learning.js";
import type * as lib_receipt_metrics from "../lib/receipt/metrics.js";
import type * as lib_receipt_normalise from "../lib/receipt/normalise.js";
import type * as lib_receipt_payment from "../lib/receipt/payment.js";
import type * as lib_receipt_questions from "../lib/receipt/questions.js";
import type * as lib_receipt_templates_registry from "../lib/receipt/templates/registry.js";
import type * as lib_receipt_templates_th from "../lib/receipt/templates/th.js";
import type * as lib_receipt_templates_za from "../lib/receipt/templates/za.js";
import type * as lib_receipt_types from "../lib/receipt/types.js";
import type * as lib_receipt_validate from "../lib/receipt/validate.js";
import type * as line from "../line.js";
import type * as pendingDeletes from "../pendingDeletes.js";
import type * as purge from "../purge.js";
import type * as push from "../push.js";
import type * as pushSend from "../pushSend.js";
import type * as receipts from "../receipts.js";
import type * as receipts_constants from "../receipts/constants.js";
import type * as receipts_draftCrud from "../receipts/draftCrud.js";
import type * as receipts_index from "../receipts/index.js";
import type * as receipts_ingest from "../receipts/ingest.js";
import type * as receipts_scanActions from "../receipts/scanActions.js";
import type * as receipts_scrapeBot from "../receipts/scrapeBot.js";
import type * as sharedBoards from "../sharedBoards.js";
import type * as snapshots from "../snapshots.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  accounts: typeof accounts;
  "accounts/accountBoardSync": typeof accounts_accountBoardSync;
  "accounts/accountCrud": typeof accounts_accountCrud;
  "accounts/accountInvites": typeof accounts_accountInvites;
  "accounts/helpers": typeof accounts_helpers;
  "accounts/index": typeof accounts_index;
  "accounts/purchaseNotes": typeof accounts_purchaseNotes;
  "accounts/types": typeof accounts_types;
  auth: typeof auth;
  boardMerge: typeof boardMerge;
  feedback: typeof feedback;
  http: typeof http;
  legal: typeof legal;
  "lib/auth": typeof lib_auth;
  "lib/gemini": typeof lib_gemini;
  "lib/line/verify": typeof lib_line_verify;
  "lib/receipt/amounts": typeof lib_receipt_amounts;
  "lib/receipt/categorize": typeof lib_receipt_categorize;
  "lib/receipt/confidence": typeof lib_receipt_confidence;
  "lib/receipt/currency": typeof lib_receipt_currency;
  "lib/receipt/dates": typeof lib_receipt_dates;
  "lib/receipt/engine": typeof lib_receipt_engine;
  "lib/receipt/extract_details": typeof lib_receipt_extract_details;
  "lib/receipt/extract_merchant": typeof lib_receipt_extract_merchant;
  "lib/receipt/extract_total": typeof lib_receipt_extract_total;
  "lib/receipt/fingerprint": typeof lib_receipt_fingerprint;
  "lib/receipt/ingestSchema": typeof lib_receipt_ingestSchema;
  "lib/receipt/learning": typeof lib_receipt_learning;
  "lib/receipt/metrics": typeof lib_receipt_metrics;
  "lib/receipt/normalise": typeof lib_receipt_normalise;
  "lib/receipt/payment": typeof lib_receipt_payment;
  "lib/receipt/questions": typeof lib_receipt_questions;
  "lib/receipt/templates/registry": typeof lib_receipt_templates_registry;
  "lib/receipt/templates/th": typeof lib_receipt_templates_th;
  "lib/receipt/templates/za": typeof lib_receipt_templates_za;
  "lib/receipt/types": typeof lib_receipt_types;
  "lib/receipt/validate": typeof lib_receipt_validate;
  line: typeof line;
  pendingDeletes: typeof pendingDeletes;
  purge: typeof purge;
  push: typeof push;
  pushSend: typeof pushSend;
  receipts: typeof receipts;
  "receipts/constants": typeof receipts_constants;
  "receipts/draftCrud": typeof receipts_draftCrud;
  "receipts/index": typeof receipts_index;
  "receipts/ingest": typeof receipts_ingest;
  "receipts/scanActions": typeof receipts_scanActions;
  "receipts/scrapeBot": typeof receipts_scrapeBot;
  sharedBoards: typeof sharedBoards;
  snapshots: typeof snapshots;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
