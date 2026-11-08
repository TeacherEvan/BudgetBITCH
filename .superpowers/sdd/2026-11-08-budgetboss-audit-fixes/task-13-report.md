# Task 13 Report: Crypto Hardening + Due-Day Clamp

## Status: DONE (inline after rate-limit)

## Changes
- `src/lib/db/crypto-backup.ts`: PBKDF2 600k for new backups (salt 32
  bytes, `iterations` returned in backup object); decrypt accepts optional
  iterations (default 100k for old backups — fully backward compatible);
  encrypt/decrypt reject empty passwords; decrypt rejects salts < 16 bytes.
- `src/components/settings/data-backup-card.tsx`: persists
  `cryptoIterations` in the backup payload and passes it on decrypt.
- `src/components/dashboard/priority-guide.tsx` and
  `dashboard-shell.tsx`: clamp dueDay via `Math.min(dueDay, daysInMonth)`.
- `src/lib/db/crypto-backup.test.ts`: tests — empty password, short salt,
  legacy 100k decrypt, Feb-31 clamp.

## Verification
- `npm test -- src/lib/db/crypto-backup.test.ts`: 7 passed
