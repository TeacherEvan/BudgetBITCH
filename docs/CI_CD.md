# Budget Boss CI/CD & Automated Reliability Manual

Architectural and operational documentation for the **Budget Boss**
(`BudgetBITCH` repo) automated CI/CD pipeline, build guards, release automation,
and production rollback procedures.

---

## 1. Quality gate pipeline architecture

GitHub Actions (`.github/workflows/ci.yml`) runs nine independent jobs on every
push/PR to `main`. `npm run ci` runs the equivalent chain locally, in order.

```
                  ┌─────────────────────────────────────┐
                  │        Pull Request / Push          │
                  └──────────────────┬──────────────────┘
                                     │
         ┌───────────────────────────┼───────────────────────────┐
         ▼                           ▼                           ▼
 ┌───────────────┐           ┌───────────────┐           ┌───────────────┐
 │   1. LINT     │           │ 2. TYPE CHECK │           │ 3. IDB GUARD  │
 │  (eslint .)   │           │ (tsc --noEmit)│           │ (check:idb)   │
 └───────┬───────┘           └───────┬───────┘           └───────┬───────┘
         │                           │                           │
         └───────────────────────────┼───────────────────────────┘
                                     ▼
                         ┌───────────────────────┐
                         │ 4. CONVEX IMPORT GUARD│
                         │ (check:convex-imports)│
                         └───────────┬───────────┘
         ┌───────────────────────────┴───────────────────────────┐
         ▼                                                       ▼
 ┌───────────────┐                                       ┌───────────────┐
 │ 5. UNIT TESTS │                                       │6. CONVEX TESTS│
 │ (vitest run)  │                                       │ (test:convex) │
 └───────┬───────┘                                       └───────┬───────┘
         │                                                       │
         └───────────────────────────┬───────────────────────────┘
                                     ▼
                         ┌───────────────────────┐
                         │    7. NEXT BUILD      │
                         │   (npm run build)     │
                         └───────────┬───────────┘
         ┌───────────────────────────┴───────────────────────────┐
         ▼                              ▼                        ▼
 ┌───────────────┐            ┌───────────────┐         ┌───────────────┐
 │  8. E2E TESTS │            │ 9. SEC AUDIT  │         │ DEPLOY GUARD  │
 │  (playwright) │            │  (npm audit)  │         │(check:convex) │
 └───────────────┘            └───────────────┘         └───────────────┘
```

---

## 2. Gate descriptions & enforcement

| Gate | Tool / Script | Command | Failure impact |
| :--- | :--- | :--- | :--- |
| **1. Lint** | ESLint 8 (`.eslintrc.json`, `next/core-web-vitals`) | `npm run lint` | Style, syntax, or unused-variable errors block merge. |
| **2. Type Check** | TypeScript (strict) | `npm run typecheck` | Any type mismatch in app or test code blocks merge. |
| **3. IDB Schema Guard** | Custom Node guard | `npm run check:idb` | Asserts every store in `USER_DATA_STORES` has a `createObjectStore` call in `upgrade()`. Prevents orphaned-store crashes on upgrade. |
| **4. Convex Import Guard** | Custom Node guard | `npm run check:convex-imports` | Catches unresolvable imports inside `convex/` before they surface as a runtime "Could not find function" error. CI-only in the local runner. |
| **5. Unit Tests** | Vitest + RTL | `npm test` | Unit and React component failures block merge. |
| **6. Convex Tests** | Vitest + `convex-test` | `npm run test:convex` | Backend function and schema validation failures block merge. |
|| **7. Production Build** | Next.js 16.3.0 | `npm run build` | Compilation or bundling errors block merge. Runs `prebuild` → `check-convex-deployment.mjs`. |
| **8. E2E Tests** | Playwright | `npm run test:e2e` | User-journey failures block merge. Skips cleanly when `NEXT_PUBLIC_CONVEX_URL` is unset. |
| **9. Security Audit** | npm audit | `npm audit --audit-level=high` | Flags high/critical vulnerabilities. `continue-on-error: true` — advisory, retried up to 3×. |
| **Deploy Guard** | Custom guard | `npm run check:convex` | Validates the client-baked `NEXT_PUBLIC_CONVEX_URL` targets the canonical prod slug. |

---

## 3. GitHub Actions workflow inventory

All workflows live in `.github/workflows/`:

1. **`ci.yml` (main pipeline)**
   - **Triggers**: `push` to `main`, `pull_request` to `main`, daily schedule
     (`cron: '0 0 * * *'`, 00:00 UTC), and `workflow_dispatch`.
   - **Jobs**: `lint`, `typecheck`, `test`, `convex-test`, `build`, `e2e`,
     `deploy-guard`, `security-audit`, `idb-schema-guard` — all on Node 22,
     with Next.js build caching (`.next/cache`) and Playwright browser caching
     (`~/.cache/ms-playwright`). Concurrency cancels stale runs on the same ref.

2. **`release-draft.yml` (tag release)**
   - **Triggers**: `push` on tags matching `v*`.
   - **Behavior**: re-runs quality gates, compiles release notes, drafts a
     GitHub Release.

3. **`rollback.yml` (manual production rollback)**
   - **Triggers**: `workflow_dispatch`.
   - **Inputs**: `deployment` (target Vercel deployment URL or ID).
   - **Behavior**: promotes a previous known-good Vercel deployment back to
     production via `vercel rollback`. Zero rebuild.

4. **`update-dependencies.yml` (scheduled dependency PRs)**
   - **Triggers**: daily schedule (`cron: '0 4 * * *'`, 04:00 UTC) and
     `workflow_dispatch`.
   - **Behavior**: runs `npm update` + `npm audit fix --package-lock-only`,
     executes the verification gate suite, and opens an automated PR.

5. **`.github/dependabot.yml`**
   - **Schedule**: daily for `npm` (04:00 UTC, max 5 open PRs) and
     `github-actions` (max 3 open PRs).

---

## 4. Custom build & schema guards

### A. IndexedDB schema guard (`scripts/check-idb-stores.mjs`)
- **Problem**: adding a store to `USER_DATA_STORES` in `src/lib/db/local-db.ts`
  without creating it in `upgrade()` crashes existing users on transaction start.
- **Enforcement**: parses `local-db.ts`, extracts `USER_DATA_STORES`, and
  verifies each store name has a matching `createObjectStore('<name>')` inside
  the `upgrade()` callback.

### B. Convex deployment guard (`scripts/check-convex-deployment.mjs`)
- **Problem**: Vercel env drift can bake a dev/staging Convex URL into a
  production build, causing unresolvable auth and hanging state loads.
- **Enforcement**: runs as a `prebuild` hook. Asserts `NEXT_PUBLIC_CONVEX_URL`
  matches the expected slug from `BUDGETBITCH_PROD_CONVEX_SLUG` (default
  `steady-ox-280`) and aborts the build on mismatch.

### C. Convex import guard (`scripts/check-convex-imports.mjs`)
- **Problem**: an import inside `convex/` that resolves locally but not on the
  Convex deployment surfaces only at runtime as "Could not find function".
- **Enforcement**: resolves every import in the Convex tree ahead of deploy.

---

## 5. Local developer quality gate runner

```bash
npm run ci
```

`scripts/run-full-ci.mjs` runs nine steps in sequence. Three are CI-only and are
skipped locally unless the relevant environment is present:

| Step | Local (`npm run ci`) | CI |
|------|---------------------|-----|
| 1. Lint (ESLint) | ✅ | ✅ |
| 2. Type check (tsc) | ✅ | ✅ |
| 3. IndexedDB schema guard | ✅ | ✅ |
| 4. Convex import resolution guard | ⏭️ CI-only | ✅ |
| 5. Unit & component tests (Vitest) | ✅ | ✅ |
| 6. Convex backend tests | ✅ | ✅ |
| 7. Production build (Next.js) | ✅ | ✅ |
| 8. Security audit (npm audit) | ⏭️ CI-only | ✅ |
| 9. Deploy guard (Convex URL check) | ⏭️ unless `NEXT_PUBLIC_CONVEX_URL` is set | ✅ |

---

## 6. Emergency production rollback protocol

If a production deployment misbehaves after Vercel auto-deploys from `main`:

1. Open the GitHub Actions tab → **Rollback Production** (`rollback.yml`).
2. Click **Run workflow**.
3. Supply the previous good Vercel deployment ID or URL (from the Vercel dashboard).
4. Run it. Vercel switches production traffic back instantly, without rebuilding.
