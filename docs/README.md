# Budget Boss Documentation Hub

Documentation for **Budget Boss** (repo/package name `BudgetBITCH`), a
cinematic, privacy-first budgeting PWA built on Next.js App Router, a Convex
backend, and local-first IndexedDB sync.

Both human developers and AI agents can use this hub to orient in the codebase.

---

## Core documentation map

- **[System Architecture](../ARCHITECTURE.md)** — stack, directory boundaries,
  runtime flow, data ownership, Convex patterns.
- **[Codebase Index](CODEBASE_INDEX.md)** — route map, component/hook/library
  index, Convex schema, testing map, CI infrastructure.
- **[CI/CD & Automated Reliability](CI_CD.md)** — quality gates, GitHub Actions
  workflows, custom build/schema guards, production rollback runbook.
- **[Agent & Contributor Rules](../AGENTS.md)** — conventions, Convex rules,
  auth model, pitfalls. Mirrored in [CLAUDE.md](../CLAUDE.md).
- **[Design Context & Identity](../DESIGN_CONTEXT.md)** — user persona, brand
  personality, accent themes, design principles.
- **[Feature Ideas & Backlog](FEATURE_IDEAS.md)** — prospective features, not
  shipped work.
- **[Project README](../README.md)** — features, tech stack, local setup,
  environment variables.

---

## Developer workflow commands

Run from the repository root:

```bash
# Local dev server (sanitized env wrapper)
npm run dev

# Convex backend dev / sync
npx convex dev

# Full local quality gate chain
npm run ci

# Individual gates
npm run lint
npm run typecheck
npm run check:idb
npm test
npm run test:convex
npm run build

# End-to-end (Playwright, dev server on port 3100)
npm run test:e2e
```

---

## Archived audits

Historical audit reports are preserved under [docs/.archive/](.archive/):

- **[Optimization Audit (June 2026)](.archive/optimization-audit-2026-06-13.md)**
- **[Frontend Audit (April 2026)](.archive/frontend-audit-2026-04-07.md)**

Working plan and idea documents live under `docs/plans/` and `docs/ideas/`,
which are intentionally git-ignored local working sets.
