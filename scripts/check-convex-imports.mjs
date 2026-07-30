#!/usr/bin/env node
// Guard: every relative import inside convex/ must resolve to a real file on
// disk. The Convex production bundler (esbuild) fails HARD on the first
// unresolved specifier — even a hyphen/underscore typo like `./extract-merchant`
// when the file is `extract_merchant.ts` — which silently blocks the entire
// backend deploy and leaves prod running stale functions (see the
// `feedback:isAdmin` "Could not find function" Server Error incident).
//
// Vitest resolves these loosely, so the local suite stays green while prod
// breaks. This guard makes the mismatch a deterministic local/CI failure.
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";

const CONVEX_DIR = resolve(process.cwd(), "convex");

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "_generated") continue;
    const full = resolve(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (entry.name.endsWith(".ts")) out.push(full);
  }
  return out;
}

function resolves(fromFile, spec) {
  const base = resolve(dirname(fromFile), spec);
  for (const ext of ["", ".ts", ".tsx", ".d.ts", ".js", ".jsx"]) {
    if (existsSync(`${base}${ext}`)) return true;
  }
  if (existsSync(resolve(base, "index.ts"))) return true;
  if (existsSync(resolve(base, "index.d.ts"))) return true;
  return false;
}

let broken = 0;
const files = walk(CONVEX_DIR);
for (const file of files) {
  const src = readFileSync(file, "utf8");
  const re = /from\s+["'](\.[^"']+)["']/g;
  let m;
  while ((m = re.exec(src))) {
    const spec = m[1];
    if (!spec.startsWith(".")) continue;
    if (!resolves(file, spec)) {
      console.error(
        `✖ ${file.replace(process.cwd() + "/", "")} imports unresolved "${spec}"`,
      );
      broken++;
    }
  }
}

if (broken > 0) {
  console.error(
    `\n❌ Convex import guard: ${broken} unresolved relative import(s). ` +
      `Prod deploy will fail. Fix the path (check hyphen/underscore + filename).`,
  );
  process.exit(1);
}

console.log("✅ Convex import guard: all relative imports resolve.");
