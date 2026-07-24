# BudgetBITCH CI/CD & Automated Reliability Manual

This document provides complete architectural and operational documentation for **BudgetBITCH's** automated CI/CD pipeline, build guards, release automation, and production rollback procedures.

---

## 1. Quality Gate Pipeline Architecture

Every code change must pass 9 shift-left quality gates before merging into `main`. The quality gate pipeline ensures static analysis catches errors before test execution, tests run before builds, and build/deploy guards verify production targets.

```
                  ┌─────────────────────────────────────┐
                  │        Pull Request / Push          │
                  └──────────────────┬──────────────────┘
                                     │
         ┌───────────────────────────┼───────────────────────────┐
         ▼                           ▼                           ▼
 ┌───────────────┐           ┌───────────────┐           ┌───────────────┐
 │   1. LINT     │           │ 2. TYPE CHECK │           │ 3. IDB GUARD  │
 │ (eslint .)    │           │ (tsc --noEmit)│           │(check-idb)    │
 └───────┬───────┘           └───────┬───────┘           └───────┬───────┘
         │                           │                           │
         └───────────────────────────┼───────────────────────────┘
                                     │
         ┌───────────────────────────┴───────────────────────────┐
         ▼                                                       ▼
 ┌───────────────┐                                       ┌───────────────┐
 │ 4. UNIT TESTS │                                       │5. CONVEX TESTS│
 │ (vitest run)  │                                       │ (test:convex) │
 └───────┬───────┘                                       └───────┬───────┘
         │                                                       │
         └───────────────────────────┬───────────────────────────┘
                                     │
                                     ▼
                         ┌───────────────────────┐
                         │   6. CONVEX GUARD     │
                         │ (deploy-guard check)  │
                         └───────────┬───────────┘
                                     │
                                     ▼
                         ┌───────────────────────┐
                         │    7. NEXT BUILD      │
                         │   (npm run build)     │
                         └───────────┬───────────┘
                                     │
         ┌───────────────────────────┴───────────────────────────┐
         ▼                                                       ▼
 ┌───────────────┐                                       ┌───────────────┐
 │  8. E2E TESTS │                                       │ 9. SEC AUDIT  │
 │ (playwright)  │                                       │  (npm audit)  │
 └───────────────┘                                       └───────────────┘
```

---

## 2. Gate Descriptions & Enforcement

| Gate | Tool / Script | Command | Failure Impact |
| :--- | :--- | :--- | :--- |
| **1. Lint** | ESLint v9 Flat Config | `npm run lint` | Code style, syntax, or unused variable errors block merge. |
| **2. Type Check** | TypeScript | `npm run typecheck` | Any type mismatch in app code or test suites blocks merge. |
| **3. IDB Schema Guard** | Custom Node Guard | `npm run check:idb` | Asserts every store in `USER_DATA_STORES` has a `createObjectStore` call in `upgrade()`. Prevents orphaned store crashes. |
| **4. Unit Tests** | Vitest | `npm test` | Unit and React component test failures block merge. |
| **5. Convex Tests** | Vitest (`convex/`) | `npm run test:convex` | Backend function and schema validation failures block merge. |
| **6. Prod Convex Guard** | Custom Guard | `npm run check:convex` | Validates client-baked `NEXT_PUBLIC_CONVEX_URL` targets `steady-ox-280`. Prevents stale environment variables from shipping to production. |
| **7. Production Build** | Next.js 16 | `npm run build` | Next.js compilation or asset bundling errors block merge. |
| **8. E2E Tests** | Playwright | `npm run test:e2e` | End-to-end user journey failures block merge (requires `NEXT_PUBLIC_CONVEX_URL`). |
| **9. Security Audit** | npm audit | `npm audit` | Flags high/critical vulnerabilities for review. |

---

## 3. GitHub Actions Workflow Inventory

All workflows are located in `.github/workflows/`:

1. **`ci.yml` (Main CI Pipeline)**
   - **Triggers**: `push` to `main`, `pull_request` to `main`.
   - **Behavior**: Runs parallel jobs (`lint`, `typecheck`, `test`, `convex-test`, `idb-schema-guard`, `deploy-guard`, `build`, `e2e`, `security-audit`). Concurrency control cancels outdated runs on the same branch.

2. **`release-draft.yml` (Automated Tag Release)**
   - **Triggers**: `push` on tags matching `v*`.
   - **Behavior**: Re-runs quality gates (`npm test`, `npm run test:convex`, `npm run build`), compiles release notes automatically, and drafts a GitHub Release.

3. **`rollback.yml` (Manual Production Rollback)**
   - **Triggers**: `workflow_dispatch` (Manual trigger from Actions tab).
   - **Inputs**: `deployment` (Target Vercel deployment URL or ID).
   - **Behavior**: Instantly promotes a previous known-good Vercel deployment back to production via `vercel rollback`. Zero rebuild required.

4. **`update-dependencies.yml` (Weekly Dependency Scans)**
   - **Triggers**: Weekly schedule (`0 4 * * 1` - Monday 04:00 UTC) and `workflow_dispatch`.
   - **Behavior**: Runs `npm update` and `npm audit fix --package-lock-only`, verifies test/build suites, and opens an automated Pull Request.

---

## 4. Custom Build & Schema Guards

### A. IndexedDB Schema Guard (`scripts/check-idb-stores.mjs`)
- **Problem**: When a new store is added to `USER_DATA_STORES` in `src/lib/db/local-db.ts`, existing users upgrading their browser app will crash on transaction start unless `createObjectStore` is called in `upgrade()`.
- **Enforcement**: Parses `local-db.ts`, extracts `USER_DATA_STORES`, and verifies every single store name has a matching `createObjectStore('<name>')` statement inside the `upgrade()` callback.

### B. Convex Deployment Guard (`scripts/check-convex-deployment.mjs`)
- **Problem**: Vercel environment variables can occasionally drift, causing a production build to bake in a dev/staging Convex deployment URL (`NEXT_PUBLIC_CONVEX_URL`). Users then encounter unresolvable auth and hanging state loading.
- **Enforcement**: Runs as a `prebuild` hook on Vercel production builds. Asserts `NEXT_PUBLIC_CONVEX_URL` matches canonical slug `steady-ox-280`. Aborts build immediately if mismatched.

---

## 5. Local Developer Quality Gate Runner

Developers and AI agents can execute the core pipeline locally prior to committing:

```bash
# Run all 6 local quality gates sequentially
npm run ci
```

Output format:
```
======================================================
🚀 BudgetBITCH Local Quality Gate Runner (CI)
======================================================

ℹ️  Running in LOCAL mode (no NEXT_PUBLIC_CONVEX_URL set)
   Gates 7-8 will be skipped (require CI/Convex env).

▶ Running 1/8 Linting (ESLint)...
✅ Passed 1/8 Linting (ESLint) (2.41s)

▶ Running 2/8 Type Checking (tsc)...
✅ Passed 2/8 Type Checking (tsc) (3.12s)

▶ Running 3/8 IndexedDB Schema Guard...
✅ Passed 3/8 IndexedDB Schema Guard (0.15s)

▶ Running 4/8 Unit & Component Tests (Vitest)...
✅ Passed 4/8 Unit & Component Tests (Vitest) (12.45s)

▶ Running 5/8 Convex Backend Tests...
✅ Passed 5/8 Convex Backend Tests (4.10s)

▶ Running 6/8 Production Build (Next.js)...
✅ Passed 6/8 Production Build (Next.js) (18.20s)

⏭️  Skipping 7/8 Security Audit (npm audit) (CI-only gate)

⏭️  Skipping 8/8 Deploy Guard (Convex URL check) (CI-only gate)

======================================================
🎉 ALL QUALITY GATES PASSED CLEANLY in 40.43s
======================================================
```

### Gate Mapping: Local vs CI

| Gate | Local (`npm run ci`) | CI (GitHub Actions) |
|------|---------------------|---------------------|
| 1. Lint | ✅ | ✅ |
| 2. Type Check | ✅ | ✅ |
| 3. IDB Schema Guard | ✅ | ✅ |
| 4. Unit Tests | ✅ | ✅ |
| 5. Convex Tests | ✅ | ✅ |
| 6. Production Build | ✅ | ✅ |
| 7. Security Audit | ⏭️ CI-only | ✅ |
| 8. Deploy Guard | ⏭️ CI-only* | ✅ |

*Deploy Guard runs locally only if `NEXT_PUBLIC_CONVEX_URL` is set.

---

---

## 6. Emergency Production Rollback Protocol

If a production deployment encounters runtime issues after auto-deploying via Vercel:

1. Open GitHub Actions tab -> **Rollback Production** (`rollback.yml`).
2. Click **Run workflow**.
3. Supply the previous good Vercel Deployment ID or URL (found in Vercel Dashboard).
4. Run the workflow. Vercel will instantly switch production traffic back to the prior deployment without rebuilding code.
