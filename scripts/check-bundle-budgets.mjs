#!/usr/bin/env node
// Bundle budget guard — zero-dependency replacement for `bundlesize`.
//
// Reads bundlesize.config.json (path globs + maxSize + compression) and fails
// if any matched built asset exceeds its gzip budget. Intentionally avoids
// pulling the `bundlesize` npm package: the repo's other gate scripts
// (check-idb-stores, check-csp-hosts) are local .mjs with no network deps,
// and gzipping in-process is all we need.
//
// Run AFTER `next build` (expects a populated .next/static tree).

import { readFileSync, existsSync, statSync } from "node:fs";
import { readdirSync, writeFileSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { gzipSync } from "node:zlib";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const configPath = join(root, "bundlesize.config.json");
if (!existsSync(configPath)) {
  console.error(`❌ bundlesize.config.json not found at ${configPath}`);
  process.exit(1);
}

const config = JSON.parse(readFileSync(configPath, "utf8"));
const sizeUnits = { B: 1, KB: 1024, MB: 1024 * 1024 };

function parseSize(raw) {
  const m = String(raw).trim().match(/^([\d.]+)\s*(B|KB|MB)$/i);
  if (!m) throw new Error(`Unparseable size: ${raw}`);
  return Number(m[1]) * sizeUnits[m[2].toUpperCase()];
}

// Glob-to-regex (supports ** and * only — enough for the budget paths).
function globToRegExp(glob) {
  const esc = glob
    .replace(/[.+^${}()|[\]\\]/g, "\\$&")
    .replace(/\*\*\//g, "§DOUBLE§")
    .replace(/\*/g, "[^/]*")
    .replace(/§DOUBLE§/g, "(?:.*/)?");
  return new RegExp(`^${esc}$`);
}

function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

const staticDir = join(root, ".next/static");
if (!existsSync(staticDir)) {
  console.error("❌ .next/static not found — run `next build` before this check.");
  process.exit(1);
}

const allFiles = walk(staticDir);
let failures = 0;
const checked = new Set();

for (const rule of config.files ?? []) {
  const maxBytes = parseSize(rule.maxSize);
  const re = globToRegExp(rule.path);
  const matches = allFiles.filter((f) => re.test(f.replace(root + "/", "")));
  if (matches.length === 0) {
    console.warn(`⚠️  No files matched budget pattern: ${rule.path}`);
    continue;
  }
  for (const file of matches) {
    checked.add(file);
    const buf = readFileSync(file);
    const size = rule.compression === "gzip" ? gzipSync(buf).length : buf.length;
    const kb = (size / 1024).toFixed(1);
    const maxKb = (maxBytes / 1024).toFixed(1);
    const rel = file.replace(root + "/", "");
    if (size > maxBytes) {
      failures++;
      console.error(`❌ ${rel} — ${kb}KB > ${maxKb}KB (${rule.compression})`);
    } else {
      console.log(`✅ ${rel} — ${kb}KB ≤ ${maxKb}KB (${rule.compression})`);
    }
  }
}

// Fail loudly if the build dropped an entire category (e.g. CSS stopped emitting).
for (const rule of config.files ?? []) {
  const re = globToRegExp(rule.path);
  if (allFiles.filter((f) => re.test(f.replace(root + "/", ""))).length === 0) {
    console.error(`❌ Budget category produced zero assets: ${rule.path}`);
    failures++;
  }
}

if (failures > 0) {
  console.error(`\n❌ Bundle budget failed: ${failures} asset(s) over budget.`);
  process.exit(1);
}
console.log("\n✅ All bundle budgets within limits.");
