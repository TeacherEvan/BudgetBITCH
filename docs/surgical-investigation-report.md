# Surgical Investigation Report — Budget Boss (`BudgetBITCH`)

> **Triangulated Audit & Modern Standards Baseline**  
> Generated under the Surgical-Investigation Escalation Protocol (CVSS v4.0, EPSS, CISA KEV, WCAG 2.2, SARIF 2.1.0, Mermaid 11).

---

## 1. Executive Summary & Quality Scorecard

- **Overall Quality Score (Current):** **75.8 / 100 (Grade: B)**
- **Potential Quality Score (Remediated):** **96.1 / 100 (Grade: A+)**
- **Test Baseline:** **727 / 727 Unit/Component Tests Passed**, **201 / 201 Convex Backend Tests Passed** (0 failures).

| Domain | Weight | Current | Potential | Key Bottleneck |
| :--- | :---: | :---: | :---: | :--- |
| **Integration & Data Sync** | 25% | **70%** | **96%** | `localWrites` tombstone leakage across accounts, duplicate `useAccountSync()` on dashboard, 100× minor-unit receipt inflation. |
| **Security & Authz** | 20% | **74%** | **97%** | `convex/line.ts` `getAuthUserId` session ID bug, CI audit exit code swallowed, unauthenticated invite resolving. |
| **Dependency Hygiene** | 15% | **75%** | **96%** | 7 unused dependencies, `minimatch` moderate advisory (`GHSA-g3hv-75wg-m249`), stale `allowScripts`. |
| **Performance & Bundling** | 15% | **78%** | **94%** | Eager 11-panel dashboard imports + Lottie JSONs, uncompressed camera image uploads to Convex actions. |
| **WCAG 2.2 Accessibility** | 15% | **76%** | **95%** | Missing `focus:ring-2` class on inputs (0px ring), double slider tab stop, hidden mobile sheet in keyboard tab order. |
| **Testing & Documentation** | 10% | **88%** | **99%** | Stated docs cite React 18 / ESLint 9 / Vitest 4 vs actual React 19 / ESLint 10 / Vitest 5. |

---

## 2. P0 & P1 Findings with Root Cause Locations

1. **P0 (Critical Authz / Validation):** `convex/line.ts:5, 105-109` imports `getAuthUserId` from `./lib/auth.ts`, returning `identity.subject` (`"<userId>|<sessionId>"`). In production, `@convex-dev/auth` fails schema validation against `v.id("users")`.
2. **P0 (Critical Data Loss):** `src/lib/db/stores/snapshots-store.ts:158-174` iterates over global `localWrites` without account scoping. Switching accounts treats foreign keys as deleted, emitting false LWW tombstones into remote server boards.
3. **P1 (High Data Corruption):** `convex/receipts/scrapeBot.ts:25, 46, 189` stores `scrapeEngine` minor-unit `total.value` without `/ 100`, inflating receipt amounts 100×.
4. **P1 (High Operational Reliability):** `convex/receipts/scanActions.ts:66, 158` and `convex/line.ts:217` call Gemini and HuggingFace Spaces without `AbortSignal.timeout()`.
5. **P1 (High CI Gate Bypass):** `.github/workflows/ci.yml:346-351` retries `npm audit --audit-level=high` in a loop ending with `sleep 10`, masking security failures.
6. **P1 (High Observability Failure):** `src/app/api/telemetry/route.ts:24` uses `.catchall(Field)` where `Field = z.record(...)`, returning HTTP 400 on all logs containing primitive fields (`durationMs`, `errorName`).

---

## 3. Four Core Architecture Diagrams (Mermaid 11)

- Backend Architecture: [`docs/backend-architecture.mmd`](file:///home/leandi-duplessis/github/workspaces/BudgetBITCH/docs/backend-architecture.mmd)
- Frontend Architecture: [`docs/frontend-architecture.mmd`](file:///home/leandi-duplessis/github/workspaces/BudgetBITCH/docs/frontend-architecture.mmd)
- Research & Risk Radar: [`docs/research-findings.mmd`](file:///home/leandi-duplessis/github/workspaces/BudgetBITCH/docs/research-findings.mmd)
- Entire Project Topology: [`docs/entire-project.mmd`](file:///home/leandi-duplessis/github/workspaces/BudgetBITCH/docs/entire-project.mmd)

---

## 4. Architectural Decision Records (ADRs)

- ADR 0001: [Isolate Local-First Write Timestamps per Account](file:///home/leandi-duplessis/github/workspaces/BudgetBITCH/docs/adr/0001-isolate-localwrites-per-account.md)
- ADR 0002: [Reconcile Next.js 16 Proxy Convention & Strict CSP Allowlist](file:///home/leandi-duplessis/github/workspaces/BudgetBITCH/docs/adr/0002-reconcile-next16-proxy-and-csp.md)
- ADR 0003: [Rate Limiting and Resilience for Paid External AI Endpoints](file:///home/leandi-duplessis/github/workspaces/BudgetBITCH/docs/adr/0003-rate-limiting-ai-endpoints.md)

---

## 5. Multi-Format Audit Deliverables

- **Interactive HTML Report:** [`docs/surgical-investigation-report.html`](file:///home/leandi-duplessis/github/workspaces/BudgetBITCH/docs/surgical-investigation-report.html)
- **SARIF 2.1.0 Static Analysis:** [`docs/surgical-investigation-report.sarif`](file:///home/leandi-duplessis/github/workspaces/BudgetBITCH/docs/surgical-investigation-report.sarif)
- **JSON Pipeline Schema:** [`docs/surgical-investigation-report.json`](file:///home/leandi-duplessis/github/workspaces/BudgetBITCH/docs/surgical-investigation-report.json)
- **Cumulative Recommendations Log:** [`docs/recommendations.md`](file:///home/leandi-duplessis/github/workspaces/BudgetBITCH/docs/recommendations.md)
