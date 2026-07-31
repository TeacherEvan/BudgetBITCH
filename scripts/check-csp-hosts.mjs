#!/usr/bin/env node
// CSP / source-host drift guard.
//
// The Content-Security-Policy shipped in vercel.json is the browser's
// allowlist for outbound network calls. When source code starts talking to a
// host that connect-src does not list, the browser silently blocks the
// request and the feature dies in production while every local dev build
// (no CSP header) looks perfectly healthy.
//
// That is exactly how the Currency Converter broke: the component fetches
// https://api.frankfurter.dev but connect-src only allowed the old
// api.frankfurter.app host, so every conversion failed in prod.
//
// This guard scans src/ for literal network origins handed to fetch(),
// new WebSocket(), dynamic import() and XMLHttpRequest.open(), then asserts
// each one is covered by a connect-src entry. Exits 1 on drift so CI catches
// the class before it ships again.
//
// Run manually: `node scripts/check-csp-hosts.mjs`

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join, relative } from 'node:path';

const TAG = '[csp-host-guard]';
const currentDirectory = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(currentDirectory, '..');
const vercelJsonPath = resolve(repoRoot, 'vercel.json');
const srcRoot = resolve(repoRoot, 'src');

function fail(message) {
  console.error(`${TAG} ${message}`);
  process.exit(1);
}

// Same-origin / loopback destinations are covered by 'self' or never leave the
// dev machine, so they are not CSP drift.
const IGNORED_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0', '[::1]']);

// ---------------------------------------------------------------------------
// 1. Collect the hosts connect-src allows.
// ---------------------------------------------------------------------------

let vercelConfig;
try {
  vercelConfig = JSON.parse(readFileSync(vercelJsonPath, 'utf8'));
} catch (err) {
  fail(`cannot read or parse ${vercelJsonPath}: ${err.message}`);
}

let cspValue = null;
for (const entry of vercelConfig.headers ?? []) {
  for (const header of entry.headers ?? []) {
    if (String(header.key ?? '').toLowerCase() === 'content-security-policy') {
      cspValue = String(header.value ?? '');
    }
  }
}
if (!cspValue) fail('no Content-Security-Policy header found in vercel.json');

const directives = new Map();
for (const rawDirective of cspValue.split(';')) {
  const parts = rawDirective.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) continue;
  directives.set(parts[0].toLowerCase(), parts.slice(1));
}

const connectSrcTokens = directives.get('connect-src');
if (!connectSrcTokens) fail('the CSP in vercel.json has no connect-src directive');

const SCHEME_ONLY = /^[a-z][a-z0-9+.-]*:$/i;

/**
 * Turn a connect-src token into a bare host, or null when the token is not a
 * host at all: 'self' / 'unsafe-inline' / 'nonce-abc' (quoted keywords) and
 * https: / wss: / data: / blob: (scheme keywords) are never hosts.
 */
function tokenToHost(token) {
  if (token.startsWith("'") || token.startsWith('"')) return null;
  if (SCHEME_ONLY.test(token)) return null;
  const host = token
    .replace(/^[a-z][a-z0-9+.-]*:\/\//i, '')
    .split(/[/?#]/)[0]
    .toLowerCase();
  return host === '' ? null : host;
}

const allowedHosts = connectSrcTokens.map(tokenToHost).filter(Boolean);
if (allowedHosts.length === 0) fail('connect-src parsed to zero hosts — check the CSP format');

/** Exact match, or suffix match against a `*.example.com` wildcard entry. */
function isAllowed(host) {
  const candidate = host.toLowerCase();
  if (IGNORED_HOSTS.has(candidate) || IGNORED_HOSTS.has(candidate.split(':')[0])) return true;
  return allowedHosts.some((allowed) => {
    if (allowed === candidate) return true;
    if (!allowed.startsWith('*.')) return false;
    const suffix = allowed.slice(1); // '*.convex.cloud' -> '.convex.cloud'
    return candidate.endsWith(suffix) && candidate.length > suffix.length;
  });
}

// ---------------------------------------------------------------------------
// 2. Collect literal origins used by source under src/.
// ---------------------------------------------------------------------------

const SOURCE_FILE = /\.(ts|tsx)$/;
const TEST_FILE = /\.(test|spec)\.(ts|tsx)$/;
const SKIPPED_DIRS = new Set(['node_modules', '__snapshots__', '__mocks__']);

function walk(dir, found = []) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return found;
  }
  for (const name of entries) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      if (!SKIPPED_DIRS.has(name)) walk(full, found);
    } else if (SOURCE_FILE.test(name) && !TEST_FILE.test(name)) {
      found.push(full);
    }
  }
  return found;
}

// fetch( | new WebSocket( | import( | <xhr-ish>.open(
const CALL_SITE = new RegExp(
  [
    String.raw`\bfetch\s*\(`,
    String.raw`\bnew\s+WebSocket\s*\(`,
    String.raw`(?<![.\w$])\bimport\s*\(`,
    String.raw`(?:\bXMLHttpRequest\s*\(\s*\)|\b[\w$]*[xX][hH][rR][\w$]*)\s*\.\s*open\s*\(`,
  ].join('|'),
  'g',
);

// A URL literal living inside a quoted string (single, double or template).
const URL_LITERAL = /['"`]\s*((?:https?|wss?):\/\/[^'"`\s]*)/gi;

// Module-level `const NAME = 'https://…'` so `fetch(NAME)` still resolves.
const URL_CONSTANT =
  /\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*(?::\s*[^=;]+)?=\s*(['"`])((?:https?|wss?):\/\/[^'"`]*)\2/g;

const BARE_IDENTIFIER = /^[A-Za-z_$][\w$]*$/;

/** Slice the balanced argument list starting at the call's opening paren. */
function readArguments(source, openParenIndex) {
  let depth = 0;
  for (let i = openParenIndex; i < source.length; i++) {
    const ch = source[i];
    if (ch === '(') depth++;
    else if (ch === ')') {
      depth--;
      if (depth === 0) return source.slice(openParenIndex + 1, i);
    }
  }
  return source.slice(openParenIndex + 1, openParenIndex + 501);
}

/** scheme + host of an absolute URL, or null when the host is built at runtime. */
function originOf(url) {
  const match = /^([a-z][a-z0-9+.-]*):\/\/([^/?#'"`\s]*)/i.exec(url);
  if (!match) return null;
  const host = match[2].replace(/^[^@]*@/, '');
  if (host === '' || host.includes('${')) return null; // interpolated host — not statically checkable
  return { scheme: match[1].toLowerCase(), host: host.toLowerCase() };
}

function lineOf(source, index) {
  let line = 1;
  for (let i = 0; i < index; i++) if (source[i] === '\n') line++;
  return line;
}

const files = walk(srcRoot);
const usages = []; // { host, scheme, file, line }
const seen = new Set();

for (const file of files) {
  const source = readFileSync(file, 'utf8');
  const relativePath = relative(repoRoot, file);

  const constants = new Map();
  for (const match of source.matchAll(URL_CONSTANT)) constants.set(match[1], match[3]);

  for (const call of source.matchAll(CALL_SITE)) {
    const openParenIndex = call.index + call[0].length - 1;
    const args = readArguments(source, openParenIndex);
    const line = lineOf(source, call.index);

    const urls = [...args.matchAll(URL_LITERAL)].map((m) => m[1]);
    if (urls.length === 0) {
      const firstArg = args.split(',')[0].trim();
      if (BARE_IDENTIFIER.test(firstArg) && constants.has(firstArg)) urls.push(constants.get(firstArg));
    }

    for (const url of urls) {
      const origin = originOf(url);
      if (!origin) continue;
      const key = `${origin.host}|${relativePath}|${line}`;
      if (seen.has(key)) continue;
      seen.add(key);
      usages.push({ ...origin, file: relativePath, line });
    }
  }
}

// ---------------------------------------------------------------------------
// 3. Report drift.
// ---------------------------------------------------------------------------

const violations = usages.filter((usage) => !isAllowed(usage.host));

if (violations.length > 0) {
  for (const violation of violations) {
    console.error(`CSP missing host: ${violation.host} used in ${violation.file}:${violation.line}`);
  }
  console.error(
    `${TAG} Fix: add the host to the connect-src directive of the ` +
      'Content-Security-Policy header in vercel.json, or stop calling it from the browser.',
  );
  process.exit(1);
}

const distinctHosts = [...new Set(usages.map((usage) => usage.host))].sort();
console.log(
  `${TAG} OK: ${distinctHosts.length} literal host(s) across ${files.length} source files ` +
    `are all allowed by connect-src${distinctHosts.length > 0 ? ` (${distinctHosts.join(', ')})` : ''}.`,
);
