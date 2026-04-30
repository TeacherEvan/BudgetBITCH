# Auth.js Google Login, Localization, and Accessibility Design

Date: 2026-04-30
Status: Approved for specification
Scope: Root BudgetBITCH app auth replacement, app-wide English/Mandarin/Thai localization, and WCAG 2.2 AA accessibility coverage

## Summary

BudgetBITCH should remove Clerk entirely and replace it with a Google-only login flow built on Auth.js. The new auth experience must work as the app login, not as a separate identity step followed by a second login concept. After Google authentication succeeds, the app should still create or reuse the minimum local Prisma-backed records it needs so protected routes, dashboards, jobs, learning surfaces, and settings continue to work.

At the same time, the app should gain a shared localization system with English as the default locale and Mandarin and Thai as supported locales across all user-facing copy. Accessibility should not be deferred to the end. Each user-facing route should be translated and hardened to WCAG 2.2 AA in the same pass so auth, onboarding, dashboard, learn, jobs, settings, and shared errors remain usable across keyboard, screen-reader, and translated experiences.

## Problem Statement

The current repository assumes Clerk across the auth stack:

- `src/app/sign-in/[[...sign-in]]/page.tsx` and `src/app/sign-up/[[...sign-up]]/page.tsx` render Clerk-hosted entry points and describe multiple sign-in methods.
- `src/app/(app)/auth/continue/page.tsx` expects a Clerk-authenticated user and then creates the local app records.
- `src/lib/auth/clerk-config.ts` and `src/middleware.ts` treat Clerk as the protected-route authority.
- Auth-facing copy currently promises email/password, Google, and passkey paths that no longer match the requested product direction.

The current repository also lacks an app-wide localization layer. User-facing copy is still mostly hardcoded in route and component files, and `src/app/layout.tsx` currently declares English at the document level. Accessibility patterns exist in several places, but they are uneven and not yet defined as a full-route WCAG 2.2 AA contract.

The new design must resolve four linked product requirements without breaking the current app model:

1. Remove Clerk because it is not viable for the target deployment context.
2. Keep Google as the only login method.
3. Add honest privacy copy that explains Google is used only for sign-in and that the app stores only the minimum local account and workspace data required to function.
4. Add app-wide English, Mandarin, and Thai support together with route-level WCAG 2.2 AA accessibility coverage.

## Goals

- Replace Clerk with Auth.js and Google OAuth as the only sign-in method.
- Preserve the existing protected-route and local-bootstrap product shape so the app still works after authentication.
- Make the auth story honest and simple: Google sign-in is the app login.
- Add a shared localization layer with English default and Mandarin and Thai support across all user-facing surfaces.
- Bring all user-facing routes and shared UI primitives to WCAG 2.2 AA expectations.
- Preserve or improve unit, component, middleware, and E2E coverage during the transition.

## Non-Goals

- This design does not add non-Google identity providers.
- This design does not promise zero local data storage; the app may store the minimum account and workspace data it needs to operate.
- This design does not introduce Gmail inbox access, Google API data ingestion, or email-content processing.
- This design does not redesign the entire product information architecture beyond what is required for auth replacement, translation, and accessibility completion.

## Recommended Approach

Use Auth.js with Google OAuth as the only authentication system and keep the current app's local-bootstrap model after authentication.

This is preferred over Firebase Auth or Supabase Auth because it fits the existing Next.js App Router and Prisma architecture more directly, minimizes new backend surface area, and keeps the session and route-protection logic close to the existing server-first app structure.

The work should be designed as one coordinated specification with three implementation phases:

1. Replace Clerk with Auth.js and Google-only login.
2. Add shared localization infrastructure and English, Mandarin, and Thai coverage for all user-facing copy.
3. Complete route-by-route accessibility hardening to WCAG 2.2 AA while translating the same surfaces.

## Experience Model

### Auth Model

The new auth experience should expose one clear sign-in path:

- `/sign-in` becomes a Google-only entry screen with one primary action such as `Continue with Google`.
- `/sign-up` should no longer present a separate form-based sign-up journey. It should redirect to `/sign-in` so the product exposes one clear Google-only entry path.
- Copy about email/password, passkeys, and Clerk-specific behavior is removed from shared auth surfaces.

Google sign-in should be the only credential entry flow. The app should not imply that users are first signing into Google and then separately logging into BudgetBITCH. Auth.js owns the authenticated session, and the app's local bootstrap step only provisions local records after that session exists.

### Privacy Model

The auth surfaces and related recovery states should state clearly that:

- Google is used only to authenticate access.
- The app stores only the minimum local account and workspace data required to function.
- The app does not read Gmail inbox content or use Google email data beyond sign-in identity needs.

This message should be consistent across the sign-in surface, any first-run continuation screen, and any related trust or recovery copy so the product never suggests a stronger privacy promise than the implementation can uphold.

### Localization Model

The app should support:

- English as the default locale.
- Mandarin as a first-class supported locale.
- Thai as a first-class supported locale.

Locale resolution should follow a deterministic order:

1. Explicit in-app user choice.
2. Stored user locale preference.
3. Browser locale hint when no user preference exists.
4. English fallback.

All user-facing copy should move into feature-scoped translation dictionaries so route files and reusable components do not continue to hardcode product strings.

### Accessibility Model

WCAG 2.2 AA should be treated as a route-level acceptance target, not as a best-effort cleanup. Each user-facing route should satisfy expectations for:

- Keyboard navigation and focus visibility.
- Semantic heading structure and landmarks.
- Explicit form labeling and error association.
- Clear alert and live-region behavior for validation or blocking states.
- Sufficient contrast and readable interaction states.
- Correct document and content language metadata when locale changes.

## Architecture

The design keeps the current root app architecture but replaces the auth authority and adds shared foundations for local bootstrap, localization, and accessible UI behavior.

### Foundation 1: Auth.js session layer

Responsible for:

- Google OAuth configuration.
- Session cookie creation and validation.
- Server-side session lookup.
- Sign-in and sign-out flow ownership.

This replaces the current Clerk session dependency in route entry, middleware, and protected server surfaces.

### Foundation 2: Local bootstrap layer

Responsible for:

- Resolving the authenticated Google user identity.
- Validating that a usable verified email exists for local linking.
- Creating or reusing the local user and workspace records in Prisma.
- Preserving the current app assumption that protected routes run against a local workspace context.

This keeps the useful part of the current `/auth/continue` behavior while removing Clerk as a dependency.

### Foundation 3: Localization layer

Responsible for:

- Locale resolution.
- Translation dictionary loading.
- Shared translation helpers for routes, components, and server-rendered states.
- Locale persistence and document language updates.

### Foundation 4: Accessible shared UI layer

Responsible for:

- Shared heading, form, alert, navigation, and panel conventions.
- Focus and live-region behavior where reused UI primitives already exist.
- Reducing per-route accessibility duplication by hardening shared building blocks first.

## Component and Route Boundaries

### Auth entry routes

- `src/app/sign-in/[[...sign-in]]/page.tsx`
- `src/app/sign-up/[[...sign-up]]/page.tsx`

These routes become product-owned pages rather than Clerk-owned entry shells. They render Google-only entry copy, privacy disclosure, and localized CTA text.

### Auth continuation route

- `src/app/(app)/auth/continue/page.tsx`

This route remains the dedicated local bootstrap boundary between authenticated session creation and protected app data. Its purpose becomes "finish local provisioning" rather than "continue from Clerk."

### Route protection

- `src/middleware.ts`
- `src/lib/auth/*.ts`

These files should move from Clerk configuration checks and `auth.protect()` behavior to Auth.js session validation and deterministic protected-route handling.

### Shared auth presentation

- `src/components/auth/auth-entry-panel.tsx`

This component should be reused, but rewritten to remove Clerk-era method descriptions and to carry the new privacy and Google-only messaging in a localized, accessible form.

### Localization consumers

All route groups under `src/app/**` and reusable components under `src/components/**` that render user-facing copy should consume the shared translation layer rather than embed English strings directly.

## Data and Session Flow

### Authentication flow

1. User opens `/sign-in`.
2. User activates the Google sign-in action.
3. Auth.js completes Google OAuth and establishes the app session.
4. The app resolves the authenticated identity and verified email.
5. The local bootstrap layer creates or reuses the local Prisma records.
6. The user is redirected to the sanitized post-auth destination and protected routes use the established app session plus local workspace context.

### Failure states

If any step fails, the app must degrade clearly:

- Missing auth configuration shows a not-ready auth state rather than a broken or looping redirect.
- Missing usable verified email stops before local bootstrap and shows a translated recovery panel.
- Local bootstrap conflicts route into a dedicated recovery path rather than creating duplicate local records.
- Session failures on protected routes redirect to sign-in or render a translated error state, never a half-authenticated protected surface.

### Localization flow

1. App resolves locale using explicit choice, stored preference, browser hint, then English fallback.
2. Route and component strings load from feature-scoped dictionaries.
3. Document language metadata updates to match the active locale.
4. Missing keys fall back to English for the individual string, not the whole page.

## Error Handling

### Auth configuration errors

If Google OAuth or Auth.js configuration is missing, auth entry routes should show a localized unavailable state and protected routes should fail safely without infinite redirect behavior.

### Identity errors

If Google does not return a usable verified email needed for local linking, the user should see a localized blocking message with a clear next step.

### Bootstrap conflicts

If the authenticated identity maps onto a conflicting local account relationship, the app should reuse the current conflict-recovery pattern concept and surface a localized recovery state instead of mutating data optimistically.

### Translation errors

If a translation key is missing, the app should fall back to English for that string while leaving the rest of the localized page intact.

## Testing Strategy

### Unit and component coverage

Update or add tests for:

- Auth.js session helpers and route guards.
- Google-only auth route copy and behavior.
- Local bootstrap record resolution.
- Locale resolution and dictionary lookup.
- Shared auth panels, navigation, alerts, and other accessible primitives under translated copy.

### Middleware and route coverage

Protected-route tests should verify:

- Signed-out redirects still preserve safe post-auth destinations.
- Signed-in users can complete bootstrap once and then access protected routes normally.
- Misconfiguration and recovery states remain deterministic.

### End-to-end coverage

Playwright should cover:

- Root signed-out entry and Google-only auth entry surface.
- Signed-in bootstrap continuation and redirect behavior.
- High-value translated flows across onboarding, dashboard, jobs, learn, and settings.
- Relevant auth, jobs, and integrations journeys that currently depend on the root gating model.

### Accessibility verification

High-value routes should include explicit checks for:

- Visible headings and meaningful landmarks.
- Keyboard-reachable interactive controls.
- Properly announced errors and alerts.
- Locale and language metadata.

## Rollout Plan

### Phase A: Auth replacement

- Remove Clerk from auth entry, middleware, and bootstrap assumptions.
- Add Auth.js with Google-only login.
- Rewrite auth copy and privacy disclosures.
- Preserve protected-route and local-bootstrap behavior.

### Phase B: Localization foundation and coverage

- Add shared locale provider, dictionary organization, and preference persistence.
- Translate shared/auth/global copy first.
- Expand translation coverage to onboarding, dashboard, jobs, learn, settings, and error states.

### Phase C: Accessibility completion

- Harden shared UI primitives first.
- Complete route-by-route WCAG 2.2 AA fixes while translated surfaces are finalized.
- Use route acceptance checks rather than treating accessibility as a final manual sweep.

## Definition of Done

This work is complete when:

- Clerk is no longer required anywhere in the root app auth path.
- Google via Auth.js is the only login method.
- The app stores only the minimum local account and workspace data required for protected features to function.
- English remains the default locale.
- Mandarin and Thai are available across all user-facing app copy.
- User-facing routes satisfy the project's WCAG 2.2 AA accessibility target.
- Root auth gating, local bootstrap, and protected-route behavior still work end to end.
