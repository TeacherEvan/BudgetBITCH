# BudgetBITCH Documentation Hub

Welcome to the documentation hub for **BudgetBITCH**, a cinematic, privacy-first budgeting application built using Next.js App Router, Convex backend, and local-first IndexedDB sync.

This directory serves as the documentation repository. Both Human developers and AI agents can use this hub to quickly orient themselves within the codebase.

---

## 📋 Core Documentation Map

- **[System Architecture](../ARCHITECTURE.md)**: Deep dive into the stack components (Next.js, Convex, Service Worker, next-intl), directory boundaries, runtime startup/language flows, and data ownership structure.
- **[CI/CD & Automated Reliability](CI_CD.md)**: Operations manual for the 9-stage quality gate pipeline, GitHub Actions workflows, custom build/schema guards, Vercel git integration, and emergency production rollbacks.
- **[Codebase Directory Index](CODEBASE_INDEX.md)**: Orientation graph and detailed description of directories, Next.js page routes, React UI components, database schemas, and shared modules.
- **[Developer Tree Diagram](dev-tree-diagram.md)**: High-level visual map of the workspace structure and quick reference cheat sheet for file priority, data flow, and standard commands.
- **[Design Context & Identity](../DESIGN_CONTEXT.md)**: Guidelines on user persona, direct unsentimental brand personality, color modes (light/dark themes), and design principles.
- **[Feature Ideas & Backlog](FEATURE_IDEAS.md)**: Backlog of upcoming features such as user onboarding wizards by persona, silly interactive educational guides, and external integration ideas.
- **[Agent Rules & instructions](../AGENTS.md)**: Workspace instruction rules for Convex coding patterns, schema migrations, and helper tools.

---

## 🛠️ Developer Workflow Commands

To work on BudgetBITCH, use these standard commands from the repository root:

```bash
# 1. Start the local development server (Frontend + next-intl)
npm run dev

# 2. Start the Convex backend sync/local development terminal
npx convex dev

# 3. Run full local CI quality gate pipeline (lint, typecheck, check:idb, test, test:convex, build)
npm run ci

# 4. Run type-checking
npm run typecheck

# 5. Run unit and component tests (Vitest)
npm test

# 6. Run IndexedDB schema guard check
npm run check:idb

# 7. Run end-to-end integration tests (Playwright)
npm run test:e2e

# 8. Run linting
npm run lint

# 9. Compile production build
npm run build
```

---

## 🗃️ Archived Implementation Plans

Completed plans from past development sprints are preserved for reference under [docs/plans/.archive/](plans/.archive/):
- **[Code Optimization & Performance Refactoring (July 2026)](plans/.archive/2026-07-22-code-optimization.md)**: Performance refactoring for ISO date sorting, bills panel memoization, and SSR DB proxy.
- **[Convex Auth & Snapshot Sync Fix (July 2026)](plans/.archive/2026-07-22-convex-auth-and-snapshot-sync-fix.md)**: Resolution for refresh token parsing and unauthenticated daily snapshots.
- **[Quick Expense Receipt Scanning (July 2026)](plans/.archive/2026-07-21-quick-expense-receipt-implementation.md)**: Setup for camera receipt OCR scanner using Gemini 2.5 Flash.
- **[Multi-board Accounts Sync (July 2026)](plans/.archive/2026-07-20-accounts.md)**: Multi-account setup with real-time sync.
- **[Shared Couple Boards (July 2026)](plans/.archive/2026-07-19-shared-couple-boards.md)**: Implementation of couple sync engine.
