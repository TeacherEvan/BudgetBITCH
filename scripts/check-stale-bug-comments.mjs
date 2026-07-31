#!/usr/bin/env node
// check-stale-bug-comments.mjs
//
// Guards against "comment rot": test headers that describe a bug as still
// present after the fix has already shipped. Such headers mislead the next
// debugging session into re-investigating a non-issue.
//
// When a fix lands, the test's header must flip from "characterizes bug" to
// "guards regression" and name the shipped fix + commit. This script fails the
// build if any test file still contains the stale phrases listed below.

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const TEST_DIRS = ['src', 'convex', 'tests'];

// Phrases that should ONLY appear in a header that is actively characterizing a
// known-current defect. Once the fix ships, the comment must be updated.
const STALE_PHRASES = ['CURRENT (buggy)', 'documents the bug'];

// Files matching these are skipped (non-test prose, vendored, generated).
const SKIP_GLOBS = ['_generated', 'node_modules', '.next', 'dist'];

function isTestFile(p) {
  return /\.test\.(ts|tsx|js|jsx)$/.test(p) || /(^|\/)(test|tests)\//.test(p);
}

function walk(dir, out = []) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    if (SKIP_GLOBS.some((g) => e.name.includes(g))) continue;
    const full = join(dir, e.name);
    if (e.isDirectory()) {
      walk(full, out);
    } else if (e.isFile() && isTestFile(full)) {
      out.push(full);
    }
  }
  return out;
}

const files = TEST_DIRS.flatMap((d) => {
  const full = join(ROOT, d);
  try {
    statSync(full);
  } catch {
    return [];
  }
  return walk(full);
});

let violations = 0;
for (const file of files) {
  const content = readFileSync(file, 'utf8');
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    for (const phrase of STALE_PHRASES) {
      if (lines[i].includes(phrase)) {
        console.error(`Stale bug comment: ${file}:${i + 1}`);
        console.error(`  found phrase "${phrase}" — flip header to "guards regression" and name the fix + commit`);
        violations++;
      }
    }
  }
}

if (violations > 0) {
  console.error(`\n❌ ${violations} stale bug comment(s) found. Update the test header at fix time.`);
  process.exit(1);
}

console.log(`✅ No stale bug comments in ${files.length} test file(s).`);
