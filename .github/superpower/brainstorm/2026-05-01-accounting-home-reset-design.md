# Design: Accounting Home Reset
**Date:** 2026-05-01
**Status:** Approved
**Scope Tier:** V1
**Author:** Brainstorm session with user

## Problem Statement
BudgetBITCH currently feels too integration-led and scattered: the dashboard points users toward many outside providers while claiming product value that is not fully present in the app itself. V1 should make the app-owned accounting core the source of truth: recording expenses, tracking budgets, giving practical budgeting advice, and using coarse location data for useful job/news routes without collecting marketing data.

The primary user is a mobile-first person who needs a private, direct money control panel: fast expense capture, clear budget status, calm advice, and safe links to local opportunities and finance news.

## Success Metrics
- [ ] Users can record an expense from a compact mobile panel without page scrolling.
- [ ] Dashboard budget status is driven by durable app-owned records, not placeholder claims.
- [ ] Integrations no longer dominate primary navigation or dashboard messaging.
- [ ] Location consent stores only city/state and powers local jobs/news routes.
- [ ] Privacy copy clearly states: no marketing data is recorded, emails remain private, and email is used only for account authority/verification.
- [ ] Local news handling uses RSS/feed-first headline/link discovery and sends traffic back to source sites.
- [ ] Lint, unit tests, build, and targeted Playwright coverage pass for changed surfaces.

## Constraints
| Category | Constraint | Source |
|----------|------------|--------|
| Product | App-owned accounting features must become the center of gravity | User request |
| UX | Core money screens must be mobile-focused and avoid page scrolling | User request |
| UX | Inputs should favor dropdowns, pickers, segmented controls, and fixed active panels | User request |
| Privacy | No marketing data recording; no sale/share behavior | User request |
| Privacy | Email remains private and is only used for account authority/verification | User request |
| Location | Request user location but retain only city/state | User selection |
| Local News | Prefer RSS/public feeds; headline/link only; no full-content scraping | User selection |
| Integrations | Built-in first; integrations become official docs/reference links only | User selection |
| Technical | Work in the root Next.js app; preserve App Router, Prisma, Convex/Auth wiring | Repo instructions |
| Complexity | Reuse existing stack where possible; keep V1 maintainable and flexible | User selection |

## Design

### Architecture Overview
V1 reshapes the app into an app-owned accounting product. The primary dashboard becomes a fixed mobile control panel with four zones:

1. **Record**: fast expense entry and recent recorded activity.
2. **Budget**: category limits, remaining money, bills, and cashflow status.
3. **Advice**: deterministic budgeting suggestions and light coaching prompts.
4. **Local**: city/state-powered official job searches and RSS-first finance/news headline links.

The dashboard must only claim what is backed by real records. Daily check-in remains useful, but it should summarize actual app-owned expense and budget data instead of acting as a separate simulated dashboard state.

Integrations move out of the main product experience. V1 can keep official login/docs links where helpful, but the connection-style hub should not be a primary destination unless a provider is actually implemented, privacy-reviewed, and maintainable.

### Components
Recommended component boundaries:

| Component | Responsibility |
|-----------|----------------|
| `MoneyDashboard` | Fixed mobile shell, active panel state, top status strip, bottom actions |
| `ExpenseEntrySheet` | Compact dropdown-driven expense capture |
| `BudgetSnapshotPanel` | Category status, remaining money, bills, cashflow summary |
| `AdvicePanel` | Short suggestions, coaching prompts, linked Learn cards |
| `LocalSignalPanel` | Location request state, job links, local finance/news headline links |
| `PrivacyPromisePanel` | Repeated plain-language privacy commitments |
| `IntegrationReferencePanel` | Optional official docs/login links only, not connection-first UX |

The fixed mobile model should use one active panel at a time. Details should use dropdowns, segmented controls, paging, or compact drill-ins rather than long stacked page sections.

### Data Flow
1. User records an expense with amount, category, merchant, date, payment source, and optional note.
2. Durable app-owned records are written through server-authorized workspace APIs/modules.
3. Budget engine recalculates category spend, remaining amounts, bill pressure, and cashflow state.
4. Advice engine evaluates deterministic rules against the current budget state.
5. Dashboard renders the latest real budget state and advice.
6. User grants location permission or selects a city/state manually.
7. App stores only city/state and uses it to generate official job search links and feed-first local headline links.

### Accounting Features For V1
V1 should cover the practical top needs of a budgeting app without overbuilding:

- Expense tracking with fast manual entry.
- Budget categories and limits.
- Remaining money by category.
- Bill/recurring obligation visibility.
- Cashflow status for near-term pressure.
- Savings buffer or emergency fund nudge.
- Debt priority suggestions where debt data exists.
- Payday planning prompts.
- Overspending and at-risk category alerts.
- Simple progress review over the current budget period.

### Advice Rules
Advice should be deterministic, explainable, and tied to user records. It may reference popular budgeting patterns, including:

- 50/30/20 for broad allocation guidance.
- Envelope/category budgeting for spending control.
- Zero-based budgeting for assigning every dollar.
- Debt snowball/avalanche for debt priority choices.
- Pay-yourself-first for savings behavior.
- Emergency fund targets for resilience.

Advice copy should stay short and calm. Deeper explanations should link to existing or new Learn cards instead of crowding the dashboard.

### Location, Jobs, And News
The app should request location in plain language and make the privacy tradeoff obvious. V1 stores city/state only.

Jobs should use location to generate official external search links to reputable job sites or employer/search pages. The app should not imply it owns live job inventory unless it does.

News should be RSS/feed-first. Where feeds are available, ingest only headline/title, source, URL, and timestamp. HTML scraping may be considered later only for vetted safe sources and only for headline/link extraction. Full article content should not be copied into the app. Users should click through to source sites.

### Privacy Disclosures
Privacy copy should appear in onboarding/location request/settings and be reflected by implementation:

- No marketing data of any kind is recorded.
- Data is not sold or shared for advertising.
- Emails remain private.
- Email is used only for account authority, authentication, and verification.
- Location is requested for local relevance and stored only as city/state.
- Users can update or clear their stored home location.

## Alternatives Considered
| Approach | Pros | Cons | Why Rejected |
|----------|------|------|--------------|
| Local Survival Board | Gives jobs/news equal weight with money tools | Risks keeping the app scattered | Accounting core must become the center of gravity |
| Privacy Ledger First | Strong trust posture and simpler data model | Delays advice/local usefulness | V1 should include practical advice and location utility |
| Minimal De-integration | Lowest implementation cost | Does not solve the dashboard truthfulness problem deeply enough | User requested a major critical design change |
| Live API-heavy Local Data | Fresher local content | Higher maintenance, source, and privacy risk | V1 should prefer RSS/feed-first headline links and safe external routing |

## Risk Analysis
| Risk | Probability | Impact | Mitigation | Owner |
|------|-------------|--------|------------|-------|
| Privacy claims exceed actual behavior | Medium | High | Tie copy to explicit data inventory and tests; avoid marketing trackers | Implementation owner |
| No-scroll mobile panels become cramped | Medium | Medium | Use one active panel, summaries, dropdowns, drill-ins, and responsive constraints | UI owner |
| Existing dashboard/check-in claims remain misleading | Medium | High | Replace placeholder claims with real record-driven state | Product/UI owner |
| Local headline links point to unsafe or low-quality sources | Medium | High | RSS/feed-first, source allowlist/safety review, headline/link only | Product owner |
| Schema changes disrupt existing Prisma flows | Medium | High | Plan migrations carefully, test generated client/build, keep changes incremental | Backend owner |
| Integration de-emphasis breaks expected routes/tests | Medium | Medium | Keep reference routes or redirects where needed; update navigation tests | App owner |

## Complexity Budget
| Element | Cost Level | Justification |
|---------|------------|---------------|
| Durable expense/budget records | Medium | Essential to make dashboard truthful and app-owned |
| Fixed mobile dashboard panels | Medium | Required by no-scroll mobile goal |
| Deterministic advice engine | Medium | Maintains practical suggestions without AI/vendor dependency |
| City/state location storage | Low | Coarse, simple, privacy-aligned |
| RSS/feed-first headline discovery | Medium | Flexible but needs source safety guardrails |
| Integration de-emphasis | Low/Medium | Mostly navigation/content restructuring, with test updates |
| New vendor SDKs/live finance imports | Avoid for V1 | Not needed for the approved direction |

**Total complexity:** Within V1 budget if implemented in slices and no live external finance import is added.

## Rollback Plan
- **Before launch:** Revert dashboard/navigation changes and Prisma migration branch if not applied.
- **During staged rollout:** Keep old dashboard routes available behind a feature flag or route fallback until V1 passes validation.
- **After launch:** Disable local headline discovery and integrations reference changes independently if source safety or navigation issues appear.
- **Data recovery:** Preserve expense/budget records in additive migrations; avoid destructive schema changes in the first rollout.

## What This Design Does NOT Do
- Does NOT connect to bank accounts in V1.
- Does NOT sell, share, or collect marketing data.
- Does NOT store exact coordinates after location resolution.
- Does NOT scrape full article content.
- Does NOT use AI-generated budgeting advice as the core advice mechanism.
- Does NOT make third-party integrations the main user journey.
- Does NOT require the nested `budgetbitch/` prototype subtree.

## Open Questions
- [ ] Which existing integration routes should be hidden, redirected, or converted into reference-only pages?
- [ ] Should income/payday tracking be part of the same V1 slice or a follow-up immediately after expenses/budgets?
- [ ] Which safe job and local finance/news sources should be on the initial allowlist?
- [ ] Should fixed panels allow limited internal scroll for accessibility, or must overflow always become paging/drill-in UI?

## Testing Strategy
- Unit tests for expense/budget/advice calculation modules.
- Component tests for dropdown expense entry, budget snapshot, advice panel, and privacy copy.
- Route/page tests for dashboard state and integration de-emphasis.
- Playwright coverage for mobile dashboard navigation, expense recording flow, location request fallback/manual city selection, local job/news link generation, and privacy disclosure visibility.
- Existing repo validation after implementation: `npm run lint`, `npm test`, `npm run build`, plus targeted E2E coverage.
