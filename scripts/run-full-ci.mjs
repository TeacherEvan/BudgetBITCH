#!/usr/bin/env node
import { spawnSync } from 'node:child_process';

const isCI = process.env.CI === 'true';
const hasConvexUrl = !!process.env.NEXT_PUBLIC_CONVEX_URL;

const steps = [
  { name: '1/8 Linting (ESLint)', cmd: 'npm', args: ['run', 'lint'] },
  { name: '2/8 Type Checking (tsc)', cmd: 'npm', args: ['run', 'typecheck'] },
  { name: '3/9 IndexedDB Schema Guard', cmd: 'node', args: ['scripts/check-idb-stores.mjs'] },
  { name: '4/9 Convex Import Resolution Guard', cmd: 'node', args: ['scripts/check-convex-imports.mjs'], skipLocal: true },
  { name: '5/9 Unit & Component Tests (Vitest)', cmd: 'npm', args: ['test'] },
  { name: '6/9 Convex Backend Tests', cmd: 'npm', args: ['run', 'test:convex'] },
  { name: '7/9 Production Build (Next.js)', cmd: 'npm', args: ['run', 'build'] },
  { name: '8/9 Security Audit (npm audit)', cmd: 'npm', args: ['audit', '--audit-level=high'], skipLocal: true },
  { name: '9/9 Deploy Guard (Convex URL check)', cmd: 'node', args: ['scripts/check-convex-deployment.mjs'], skipLocal: !hasConvexUrl && !isCI },
];

console.log('\n======================================================');
console.log('🚀 BudgetBITCH Local Quality Gate Runner (CI)');
console.log('======================================================\n');

if (!isCI && !hasConvexUrl) {
  console.log('ℹ️  Running in LOCAL mode (no NEXT_PUBLIC_CONVEX_URL set)');
  console.log('   Gates 7-8 will be skipped (require CI/Convex env).\n');
}

const startTime = Date.now();

for (const step of steps) {
  if (step.skipLocal && !isCI) {
    console.log(`⏭️  Skipping ${step.name} (CI-only gate)\n`);
    continue;
  }

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
