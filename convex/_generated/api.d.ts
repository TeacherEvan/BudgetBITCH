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
import type * as accounts_helpers from "../accounts/helpers.js";
import type * as accounts_types from "../accounts/types.js";
import type * as auth from "../auth.js";
import type * as boardMerge from "../boardMerge.js";
import type * as http from "../http.js";
import type * as legal from "../legal.js";
import type * as lib_auth from "../lib/auth.js";
import type * as receipts from "../receipts.js";
import type * as sharedBoards from "../sharedBoards.js";
import type * as snapshots from "../snapshots.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  accounts: typeof accounts;
  "accounts/helpers": typeof accounts_helpers;
  "accounts/types": typeof accounts_types;
  auth: typeof auth;
  boardMerge: typeof boardMerge;
  http: typeof http;
  legal: typeof legal;
  "lib/auth": typeof lib_auth;
  receipts: typeof receipts;
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
