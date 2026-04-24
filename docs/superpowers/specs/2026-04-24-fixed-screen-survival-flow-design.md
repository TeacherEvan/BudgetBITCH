# Fixed-Screen Survival Flow Design

Date: 2026-04-24
Status: Approved for specification
Scope: Mobile-first BudgetBITCH app surfaces focused on Start Smart, calculator practicality, and shared location context

## Summary

BudgetBITCH should shift its core mobile budgeting experience from tall, scroll-heavy setup flows to fixed-screen panels that deliver a usable survival answer in a single pass. The immediate redesign target is the current Start Smart flow, the generic calculator surface, and the split handling of location across onboarding and budgeting surfaces.

The new model is a fixed-viewport mobile shell with three stable regions on each major screen:

- A compact header that preserves context.
- One active content panel that fits the current task.
- A fixed bottom action bar that always exposes the next move.

Page-level scrolling is not allowed on the primary mobile budgeting surfaces. If a state cannot fit, it must be split into additional panels rather than becoming a longer page.

## Problem Statement

The current app still exposes several flows as tall pages or form stacks. This creates friction for the exact practical experience the product is trying to deliver.

Current mismatches identified in the repository:

- [src/components/start-smart/start-smart-shell.tsx](src/components/start-smart/start-smart-shell.tsx) behaves like a full-page wizard with stacked sections and step chrome that can push key actions below the fold.
- [src/components/calculator/calculator.tsx](src/components/calculator/calculator.tsx) is a generic arithmetic keypad. It preserves draft state but does not answer the budgeting question users actually care about.
- [src/components/start-smart/profile-form.tsx](src/components/start-smart/profile-form.tsx) and [src/components/launch/launch-wizard.tsx](src/components/launch/launch-wizard.tsx) manage related location inputs separately, creating repeated setup friction.
- [src/app/api/v1/start-smart/regional-data/route.ts](src/app/api/v1/start-smart/regional-data/route.ts) depends on region data that should be driven by a stable home-location context rather than repeated local entry.

External product research reinforced the same pattern. The most popular budgeting apps in 2026 consistently prioritize:

- A fast first answer.
- A stable money snapshot.
- One dominant next action.
- Persistent context such as household, partner, or account setup.
- Simple repeated use on mobile rather than heavy initial configuration.

## Goals

- Replace scroll-heavy mobile budgeting flows with fixed-screen panel navigation.
- Turn Start Smart into a practical survival-answer flow instead of a long setup wizard.
- Replace the generic calculator as the main budgeting tool with a compact left-to-spend utility.
- Introduce one sticky home-location model reused across Start Smart, dashboard, and jobs.
- Preserve or improve test coverage around mobile interactions, persistence, and panel transitions.

## Non-Goals

- This design does not replace the secure welcome-window login flow already implemented in the separate worktree.
- This design does not redefine the entire desktop information architecture.
- This design does not require bank-sync integrations before delivering value.
- This design does not remove all lists or menus everywhere; it applies the no-page-scroll rule to the primary mobile budgeting journey.

## Recommended Approach

Adopt a fixed-screen panel deck for the primary mobile budgeting journey.

This is preferred over a larger tabbed-information-architecture rewrite because it directly solves the user’s stated requirements with a smaller, safer product change:

- Mobile only, practical, no scrolling.
- More use of panels and buttons.
- Stronger survival-build flow.
- Better location persistence.
- More useful calculator.

The design should reuse existing mobile shell patterns already present in:

- [src/components/mobile/mobile-app-shell.tsx](src/components/mobile/mobile-app-shell.tsx)
- [src/components/mobile/mobile-panel-frame.tsx](src/components/mobile/mobile-panel-frame.tsx)

## Experience Model

### Fixed-Screen Shell

Each major mobile budgeting screen uses one viewport with three stable regions:

1. Header
Contains screen label, current context, and a small secondary action such as changing the home location.

2. Active panel
Contains the current question, answer, or task. The panel must fit within the viewport budget without requiring page scroll.

3. Action bar
Contains the primary action for the current state and, when needed, a back action.

If a state cannot fit in the viewport because of keyboard height, content density, or device size, the state must split into another panel. It must not silently fall back to a tall page.

### Start Smart Becomes Survival Flow

The current six-step Start Smart shell should be reduced to four compact panels.

1. Lane
The user chooses a life lane quickly from 2 to 4 large panel buttons.

2. Home Base
The user sets country and state or region once.

3. Money Snapshot
The user enters the minimum fields required to compute a first survival recommendation.

4. Survival Plan
The app returns a compact plan with the top risk, the money-left cue, the next seven days, and one primary next action.

The revised sequence changes the product from “complete a profile” to “get a survival answer.”

### Calculator Becomes Left-To-Spend Tool

The surface currently implemented in [src/components/calculator/calculator.tsx](src/components/calculator/calculator.tsx) should no longer lead with a raw keypad.

The new primary tool should expose a compact budgeting answer:

- Money in.
- Fixed bills.
- Safe amount left.

The panel should then expose one action-oriented follow-up such as:

- Trim a bill.
- Pause extras.
- Build today’s plan.

The keypad may remain available as a secondary utility, but it is demoted behind the budgeting answer rather than acting as the main tool.

### Sticky Home Location

Location becomes a shared user context rather than a repeated per-flow input.

The model:

- The user sets one home location once.
- Start Smart reads and updates it.
- Dashboard reads it.
- Jobs reads it.
- Regional lookup derives from it.
- Each surface exposes a lightweight change action instead of a full repeated form.

This matches the practical use case of a budgeting app where the home context is persistent but editable.

## Component Boundaries

The redesign should preserve clear boundaries between shell, panel logic, persistence, and domain calculations.

### Mobile shell

Responsible for viewport layout, header slot, panel slot, and action bar slot.

### Survival flow controller

Responsible for panel order, panel transitions, lightweight validation, and deciding when to move forward or backward.

### Home-location store

Responsible for loading, validating, and saving the sticky location context.

### Survival calculator service

Responsible for computing left-to-spend and survival cues from a compact set of inputs.

### Result panel renderers

Responsible for rendering practical guidance such as top risk, next seven days, and next action without containing persistence or navigation logic.

## Data and Persistence Model

### Home-location state

Introduce a single validated home-location record stored client-side for immediate reuse.

Required fields:

- countryCode
- stateCode
- optional city when a consuming surface benefits from it

Behavior:

- Load once at app entry where appropriate.
- Reuse across Start Smart, Jobs, and dashboard surfaces.
- Update only through explicit user intent.
- Validate before use and fall back safely when corrupted.

This should follow the same defensive localStorage validation pattern already used in [src/components/calculator/calculator.tsx](src/components/calculator/calculator.tsx) and the launch flow.

### Survival input state

Start Smart should persist in-progress panel state only if it directly improves recovery from interruption. If preserved, the stored state must remain compact and validated.

### Left-to-spend state

The new tool may persist the latest inputs if that supports repeated daily use, but the visible primary outcome must remain the budgeting answer rather than raw arithmetic history.

## No-Scroll Rules

The primary mobile budgeting surfaces must follow these rules.

### Allowed

- Fixed header and fixed bottom action bar.
- Explicit next and back panel navigation.
- Dense button sheets and segmented choices.
- Compact summaries and expandable secondary details when they remain inside the viewport budget.

### Not allowed

- Full-page scrolling on Start Smart, the primary calculator surface, or equivalent survival-flow screens.
- Long vertical forms that push the primary action below the fold.
- Dropdown behavior that expands into uncontrolled tall lists in the viewport.

### Recovery behavior

When the keyboard or small devices reduce available height:

- Collapse layout density first.
- Move secondary copy out of the main panel when necessary.
- Split the current state into a new panel before allowing page scroll.

## Practical Guidance Content

The survival plan panel should always present the same information hierarchy.

1. Current status
A short phrase that tells the user whether they are tight, stable, or at risk.

2. Money-left cue
A plain-language number or signal tied to the current snapshot.

3. Immediate risk
The single biggest pressure point.

4. Next seven days
A compact action list.

5. Primary next action
One button that moves the user forward.

This keeps the panel aligned with the strong patterns observed in popular budgeting apps: snapshot first, action second, detail third.

## Testing Strategy

Validation must move from tall-page assumptions to fixed-screen behavior.

### Unit and component tests

- Panel transition rules in the survival flow.
- Sticky home-location validation, load, and reuse.
- Left-to-spend calculations.
- Fallback behavior when persisted state is corrupted.

### End-to-end tests

- The primary action bar remains visible on mobile-sized viewports.
- Start Smart produces a survival result without page scrolling.
- The home location persists from Start Smart into other relevant surfaces.
- The primary result signal appears in the initial visible viewport.

### Regression coverage

Existing auth-first welcome behavior should remain isolated from this redesign and should continue to be verified separately.

## Rollout Sequence

Implement the redesign in this order.

1. Shared home-location model and validation.
2. Fixed-screen mobile shell adjustments for the target surfaces.
3. Start Smart reduction from tall wizard to compact panel flow.
4. Calculator replacement with the left-to-spend tool.
5. Focused test updates for viewport and persistence behavior.
6. Documentation refresh for user-visible flow changes.

## Risks and Mitigations

### Risk: Over-compression harms clarity

Mitigation: Limit the number of choices per panel and demote explanatory copy behind explicit secondary actions.

### Risk: Existing components assume tall layout

Mitigation: Contain the redesign behind the mobile shell and flow controller boundaries so layout changes do not spread across unrelated desktop surfaces.

### Risk: Sticky location becomes stale or confusing

Mitigation: Always show the current home-location context in the header and provide a visible change action.

### Risk: Generic calculator users lose functionality

Mitigation: Keep raw arithmetic available as a secondary tool rather than the primary budgeting answer.

## Decision

Proceed with a fixed-screen survival-flow redesign for the primary mobile budgeting journey, centered on:

- A no-page-scroll shell.
- A four-panel Start Smart survival flow.
- A left-to-spend primary budgeting tool.
- A shared sticky home-location context.