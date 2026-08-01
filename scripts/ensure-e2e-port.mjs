#!/usr/bin/env node
import { execSync } from 'node:child_process';

const port = process.env.PORT || 3100;
try {
  console.log(`[ensure-e2e-port] Checking port ${port}...`);
  execSync(`fuser -k ${port}/tcp`, { stdio: 'ignore' });
  console.log(`[ensure-e2e-port] Cleared stale process on port ${port}.`);
} catch {
  // Port was already free
}
