#!/usr/bin/env node
import { spawnSync } from 'node:child_process';

const steps = [
  { name: '1/6 Linting (ESLint)', cmd: 'npm', args: ['run', 'lint'] },
  { name: '2/6 Type Checking (tsc)', cmd: 'npm', args: ['run', 'typecheck'] },
  { name: '3/6 IndexedDB Schema Guard', cmd: 'node', args: ['scripts/check-idb-stores.mjs'] },
  { name: '4/6 Unit & Component Tests (Vitest)', cmd: 'npm', args: ['test'] },
  { name: '5/6 Convex Backend Tests', cmd: 'npm', args: ['run', 'test:convex'] },
  { name: '6/6 Production Build (Next.js)', cmd: 'npm', args: ['run', 'build'] },
];

console.log('\n======================================================');
console.log('🚀 BudgetBITCH Local Quality Gate Runner (CI)');
console.log('======================================================\n');

const startTime = Date.now();

for (const step of steps) {
  console.log(`▶ Running ${step.name}...`);
  const stepStart = Date.now();
  const res = spawnSync(step.cmd, step.args, {
    stdio: 'inherit',
    env: {
      ...process.env,
      NEXT_PUBLIC_CONVEX_URL: process.env.NEXT_PUBLIC_CONVEX_URL || 'https://ci-build.convex.cloud',
      NEXT_PUBLIC_CONVEX_SITE_URL: process.env.NEXT_PUBLIC_CONVEX_SITE_URL || 'https://ci-build.convex.site',
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      SITE_URL: process.env.SITE_URL || 'http://localhost:3000',
    },
  });

  const elapsed = ((Date.now() - stepStart) / 1000).toFixed(2);

  if (res.status !== 0) {
    console.error(`\n❌ Quality gate FAILED: ${step.name} (took ${elapsed}s)`);
    process.exit(res.status || 1);
  }

  console.log(`✅ Passed ${step.name} (${elapsed}s)\n`);
}

const totalElapsed = ((Date.now() - startTime) / 1000).toFixed(2);
console.log('======================================================');
console.log(`🎉 ALL QUALITY GATES PASSED CLEANLY in ${totalElapsed}s`);
console.log('======================================================\n');
