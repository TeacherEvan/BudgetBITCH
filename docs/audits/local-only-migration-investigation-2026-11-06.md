# Investigation: Move Budget Boss from Convex to local-only, password-protected

Baseline: HEAD `5be9d3a`. The only untracked path was `docs/audits/`. No source was modified.
Evidence comes from a targeted read, not the full 10-lens pass. No preflight scan or live probes were run.

## Verdict
Feasible. The app is already local-first: IndexedDB (`src/lib/db/local-db.ts`, 785 LOC) is the primary store, and Convex is a sync/auth layer. Login is the main thing that depends on Convex.
Recommended path: replace Convex Auth with a **local app lock**, then make Convex optional. Don't rip out everything at once.

## Why login fails (likely causes, from code)
1. **The login flow has several network hops.** The path is client → Next.js proxy → Convex `signIn`. `src/components/auth/convex-password-auth-form.tsx:144-160` has to treat any "server error" as a generic failure, because the proxy masks real errors (`InvalidAccountId`, `InvalidSecret`).
2. **A placeholder URL silently ships.** `src/components/providers/convex-client-provider.tsx:6` falls back to `https://placeholder.convex.cloud` when `NEXT_PUBLIC_CONVEX_URL` is unset, so sign-in can never succeed in that build.
3. **A dummy refresh token leaks into localStorage.** The provider carries a workaround for this (`convex-client-provider.tsx:9-60`), which shows the session handling is fragile. In-app webviews (LINE, WhatsApp) make it worse.
4. **Password reset depends on Resend email.** `convex/auth.ts:44-60` sends mail through `onboarding@resend.dev` by default. That sender usually only delivers to the account owner, so most users never get a reset link. This may be the biggest real-world cause. It is unverified here: check `AUTH_EMAIL_FROM` and the Resend domain.
5. **Sign-in needs an online backend even for existing users.** Offline or flaky networks can't log in.

## Blast radius: 26 non-test files import Convex
- **Auth UI:** `components/auth/*`, `providers/convex-client-provider`, `lib/auth/*`, `settings/change-password-modal`.
- **Sync:** `use-account-sync`, `account-sync-mount`, `lib/convex/sync-snapshots`, `sync-status-indicator`, `data-backup-card` (cloud snapshots), `storage-diagnostics-modal`.
- **Server-only features that need a backend:**
  - Receipt AI scan (`use-receipt-scan`, `receipts.ts`, Gemini key)
  - LINE link (`use-line-link`)
  - Shared boards (`use-shared-board`, `use-shared-delete-guard`)
  - Push notifications (`push-gate`, `pushSend.ts`)
  - Bug reports and admin (`bug-report-modal`, `admin-bug-reports`)
  - Legal consent logging (`app/api/legal/*`)
- **Backend:** `convex/` has about 15 modules, with 195 backend tests. `schema.ts` is 327 LOC.

Consequence: "entire system local" would **drop** receipt OCR via Gemini, LINE, shared boards, push and cloud backup. Tesseract client OCR and local `crypto-backup.ts` (AES-GCM + PBKDF2) already exist and could replace some of that.

## Proposed design
**Phase 1 (fixes login, low risk)**
- Add a local "app lock" that stores a PBKDF2 hash plus salt in IndexedDB. The `crypto-backup.ts` primitives already exist. Make the lock required on first launch and offer unlock on reopen.
- Add a "Continue without account" path. `src/lib/db/data-owner.ts` already scopes data by owner, so use a stable local owner id.
- Gate routes with the existing `lib/auth/route-guard.ts` and `<RequireAuth/>`, reading the lock state instead of the Convex session.

**Phase 2 (make Convex optional)**
- Wrap every Convex hook behind a `cloudEnabled` flag. Lazy-load `ConvexClientProvider` only when the user opts in, which cuts the bundle for everyone else.
- Keep the Convex features as an opt-in "Cloud & extras" module.

**Phase 3 (install-first delivery)**
- The PWA base exists: `public/manifest.json`, `public/sw.js` (217 LOC), `install-prompt.tsx`.
- Extend the service worker precache to the core routes (dashboard, accounts, quick-add, settings) so the app works fully offline after install.
- Make `storage.persist()` mandatory at install (`local-db.ts:527` already calls it).

## Risks
| # | Risk | Severity |
|---|---|---|
| 1 | **Password-only protection is not encryption at rest.** IndexedDB holds plaintext, and a lock screen only deters casual access. Encrypting the stores with a password-derived key is a separate and large task. | High |
| 2 | **No recovery.** A forgotten password means data loss unless the user exports an encrypted backup. | High |
| 3 | **iOS Safari can evict IndexedDB after about 7 days of inactivity** when the app is not installed. Install plus `persist()` mitigates this, but no cloud copy remains. | High |
| 4 | **Existing users' cloud-only data** (snapshots, shared boards) must be pulled down before removal. A migration is needed. | Medium |
| 5 | **Current E2E and Convex test suites** (656 unit, 195 backend) will need substantial rework. | Medium |
| 6 | **Multi-device use is lost** without sync. | Medium |

## Suggested next step
Before building, confirm the real login failure with logs, since fixing the email sender or the URL may be a one-line change. Then do Phase 1 alone. It solves login without deleting any backend.

Questions for you:
- Is cloud sync, receipt AI or shared boards still required, or can they go?
- Is a lock screen enough, or do you need encryption at rest?
