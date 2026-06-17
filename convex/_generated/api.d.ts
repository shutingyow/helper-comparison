/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as candidates from "../candidates.js";
import type * as ingest from "../ingest.js";
import type * as ingestPublic from "../ingestPublic.js";
import type * as lib_candidateFields from "../lib/candidateFields.js";
import type * as lib_phone from "../lib/phone.js";
import type * as lib_ranking from "../lib/ranking.js";
import type * as outreach from "../outreach.js";
import type * as preferences from "../preferences.js";
import type * as scrapeRuns from "../scrapeRuns.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  candidates: typeof candidates;
  ingest: typeof ingest;
  ingestPublic: typeof ingestPublic;
  "lib/candidateFields": typeof lib_candidateFields;
  "lib/phone": typeof lib_phone;
  "lib/ranking": typeof lib_ranking;
  outreach: typeof outreach;
  preferences: typeof preferences;
  scrapeRuns: typeof scrapeRuns;
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
