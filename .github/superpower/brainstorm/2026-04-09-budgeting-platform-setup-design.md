# Design: Budgeting Platform Setup
**Date:** 2026-04-09
**Status:** Approved
**Scope Tier:** V1
**Author:** Brainstorm session with user

## Problem Statement
Set up a budgeting app foundation around Convex, Vercel, and Neon that stays cost-conscious for individuals, supports daily check-ins with alerts and insights, and leaves room for multi-workspace collaboration without over-engineering the first real version.

## Success Metrics
- [ ] Users can complete a daily budget check-in quickly and see updated alerts without confusion.
- [ ] Durable budgeting records remain trustworthy, explainable, and recoverable from Neon.
- [ ] Multi-workspace switching works cleanly for V1 without duplicating ledger logic.
- [ ] Projection failures between Neon-backed writes and Convex can be retried safely.

## Constraints
| Category | Constraint | Source |
|----------|-----------|--------|
| Scope | Build for V1, not MVP or production-hardening beyond need | User |
| Cost | Lowest ongoing cost matters most | User |
| Product | Prioritize budgeting product value over platform-only work | User |
| Core journey | Daily budget check-in with alerts and insights is the first key flow | User |
| Data ownership | Neon is the source of truth; Convex supports realtime/workflows | User |
| Identity | Keep the lowest-risk auth direction for this repo | Derived from user preference + existing repo |
| User model | Support flexible multi-workspace users from the start | User |

## Design

### Architecture Overview
Use **Vercel** for the Next.js app and server gateway, **Neon + Prisma** for durable financial and audit-sensitive records, **Clerk** for authentication, and **Convex** as a first-class interactive engine for live product behavior rather than a tiny helper.

Financial truth stays in Neon. Convex owns fast-changing, collaboration-ready, product-facing state such as daily check-in sessions, alert inbox views, reminder scheduling, workspace activity, and derived budget signals.

### Components
- **Next.js on Vercel:** app UI, server actions, route handlers, composition layer for mixed reads
- **Neon + Prisma:** budgets, transactions, categories, goals, workspaces, membership, audit history
- **Clerk:** identity and authenticated session boundary
- **Convex:** check-in state, notifications, alert projections, live workspace signals, scheduling for nudges

### Data Flow
Writes for durable budgeting state go to **Neon first** through Prisma. After the durable write succeeds, the app emits a narrow projection into **Convex** for responsive UX and collaboration-ready state.

Read paths split by concern:
- **Neon reads** for historical, auditable, and durable financial views
- **Convex reads** for live check-ins, alert feeds, notification views, and workspace activity
- **App-layer composition** for screens that need both, with Neon treated as final truth

### Error Handling
If a Convex projection fails, the Neon write still stands. Projection work must be retryable and observable. No budgeting record depends on Convex success to remain valid.

## Alternatives Considered
| Approach | Pros | Cons | Why Rejected |
|----------|------|------|-------------|
| Lean sidecar Convex | Lowest complexity and cost | Convex too limited for the desired product feel | User wanted Convex to play a larger role |
| Convex as full source of truth | Strong live UX and simpler interactive reads | Higher migration risk from repo direction and weaker fit for durable ledger confidence | Neon-first ownership was explicitly preferred |
| Workflow-heavy split with more infra | Good automation flexibility | Higher ongoing complexity and cost | Exceeds V1 complexity budget |

## Risk Analysis
| Risk | Probability | Impact | Mitigation | Owner |
|------|-------------|--------|-----------|-------|
| Cross-store drift between Neon and Convex | Medium | High | Keep Neon canonical, use explicit retryable projections, support backfill/resync | App platform |
| Collaboration scope expands too early | Medium | Medium | V1 supports multi-workspace and shared views, not full co-editing everywhere | Product + engineering |
| Background automation cost grows | Medium | Medium | Limit Convex to high-value live features and avoid duplicating ledger/analytics stores | Engineering |

## Complexity Budget
| Element | Cost Level | Justification |
|---------|-----------|---------------|
| Reuse Next.js, Prisma, Vercel, Clerk, existing test stack | Low | Already aligned with the repo |
| Add Convex as interactive runtime | Medium | Needed for live check-ins, alerting, collaboration-ready state |
| Add explicit projection/retry path | Medium | Required to keep dual-store ownership reliable |
| Add extra queue/search/analytics stores | High | Not justified for V1 |
**Total complexity:** Within budget for V1 if additional infrastructure is deferred.

## Rollback Plan
- **Before launch:** remove Convex-backed features and keep Neon-only app paths
- **After launch:** disable live features and derived views while retaining Neon-backed budgeting records
- **Data recovery:** rebuild Convex projections from Neon-owned durable records

## What This Design Does NOT Do
- Does NOT make Convex the durable budgeting ledger
- Does NOT add bank-sync infrastructure in V1
- Does NOT introduce full real-time collaborative editing across every budgeting surface
- Does NOT add a separate analytics warehouse or queue platform

## Open Questions
- [ ] Which specific Convex projections should be synchronous versus deferred?
- [ ] How much shared visibility should multi-workspace users get in V1 before edit conflicts become a concern?

## Testing Strategy
- Unit tests for budgeting rules, alert eligibility, and projection logic
- Integration tests for Neon write -> Convex projection -> UI read flows
- E2E tests for daily check-ins, alert visibility, and multi-workspace switching
- Operational checks for projection lag, retry failures, and auth-boundary correctness
