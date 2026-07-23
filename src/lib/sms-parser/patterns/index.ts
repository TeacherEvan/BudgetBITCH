// Pattern registry and exports
// Single source of truth for the pattern registry. The monolithic
// `patterns.ts` was removed: it duplicated this registry and shipped a dead
// `makeCandidate` helper that no caller used.

import type { SMSPattern } from '../types';
import { genericPatterns } from './generic';
import { thaiPatterns } from './th';
import { usPatterns } from './us';
import { sgPatterns } from './sg';
import { euPatterns } from './eu';

// All patterns sorted by priority (highest first)
export const allPatterns: SMSPattern[] = [
  ...thaiPatterns,
  ...usPatterns,
  ...sgPatterns,
  ...euPatterns,
  ...genericPatterns,
].sort((a, b) => b.priority - a.priority);

export function getPatternsForCountry(country: string): SMSPattern[] {
  if (country === 'generic') return genericPatterns;
  return allPatterns.filter(p => p.country === country || p.country === undefined);
}

export { genericPatterns } from './generic';
export { thaiPatterns } from './th';
export { usPatterns } from './us';
export { sgPatterns } from './sg';
export { euPatterns } from './eu';
