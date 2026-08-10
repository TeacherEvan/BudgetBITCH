#!/usr/bin/env node
// IndexedDB schema guard.
//
// Every store listed in USER_DATA_STORES must have a guarded
// `createObjectStore('<store>')` call inside the IndexedDB `upgrade()`
// callback in src/lib/db/local-db.ts. A store added to the allowlist but
// missing from upgrade() is an ORPHANED store for existing users — the
// upgrade callback only runs on a DB_VERSION bump, so the store is never
// created and every read/write to it throws:
//   IDBDatabase.transaction: '<store>' is not a known object store name
// That aborts the surrounding transaction (e.g. the daily backup snapshot ->
// "Sync failed: Server Error"). Real prod bug, fixed 2026-07-24.
//
// This guard fails CI (exit 1) so the class can never ship again without a
// fix. Run manually: `node scripts/check-idb-stores.mjs`.
//
// See skills/software-development/budgetbitch-engineering/references/idb-schema-migration.md

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const target = resolve(__dirname, '../src/lib/db/local-db.ts');

let source;
try {
  source = readFileSync(target, 'utf8');
} catch (err) {
  console.error(`[idb-schema-guard] cannot read ${target}: ${err.message}`);
  process.exit(1);
}

// 1. Extract the USER_DATA_STORES array literal.
const storesMatch = source.match(/export const USER_DATA_STORES\s*=\s*\[([\s\S]*?)\]\s*as const/);
if (!storesMatch) {
  console.error('[idb-schema-guard] could not find USER_DATA_STORES array in local-db.ts');
  process.exit(1);
}
const storeNames = [...storesMatch[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
if (storeNames.length === 0) {
  console.error('[idb-schema-guard] USER_DATA_STORES parsed to zero stores');
  process.exit(1);
}

// 2. Extract the upgrade() callback body via brace counting.
const upgradeIdx = source.search(/upgrade\s*\(/);
if (upgradeIdx === -1) {
  console.error('[idb-schema-guard] no upgrade() callback found in local-db.ts');
  process.exit(1);
}
const openBrace = source.indexOf('{', upgradeIdx);
if (openBrace === -1) {
  console.error('[idb-schema-guard] malformed upgrade() callback (no opening brace)');
  process.exit(1);
}
let depth = 0;
let end = -1;
for (let i = openBrace; i < source.length; i++) {
  const ch = source[i];
  if (ch === '{') depth++;
  else if (ch === '}') {
    depth--;
    if (depth === 0) {
      end = i;
      break;
    }
  }
}
if (end === -1) {
  console.error('[idb-schema-guard] could not find the end of the upgrade() callback');
  process.exit(1);
}
const upgradeBody = source.slice(openBrace + 1, end);

// 3. Assert each store has a createObjectStore call inside upgrade().
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const missing = [];
for (const name of storeNames) {
  const re = new RegExp(`createObjectStore\\(\\s*['"]${escapeRe(name)}['"]`);
  if (!re.test(upgradeBody)) missing.push(name);
}

if (missing.length > 0) {
  console.error(
    '[idb-schema-guard] FAIL: the following USER_DATA_STORES entries lack a ' +
      'createObjectStore() call in upgrade():'
  );
  for (const name of missing) console.error(`  - ${name}`);
  console.error(
    "[idb-schema-guard] Fix: add a guarded branch " +
      "`if (!db.objectStoreNames.contains('<name>')) db.createObjectStore('<name>')` " +
      'inside upgrade(), then bump DB_VERSION by 1.'
  );
  process.exit(1);
}

console.log(
  `[idb-schema-guard] OK: all ${storeNames.length} USER_DATA_STORES entries have a ` +
    'createObjectStore() call in upgrade().'
);
