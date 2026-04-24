# Secure Welcome Window Login Implementation Plan

> **For agentic workers:** REQUIRED: Use the `subagent-driven-development` agent (recommended) or `executing-plans` agent to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a real welcome-window login flow that reuses Clerk safely, hardens local bootstrap and redirect handling, and documents the setup clearly.

**Architecture:** Keep Clerk as the only credential boundary, Prisma as the local user/workspace bootstrap store, and Convex as the authenticated live-state consumer. Build a tracked welcome surface inside `src/**`, add an allowlisted post-auth redirect contract, require a verified Clerk email before local bootstrap, and tighten the bootstrap path so it cannot silently relink a different Clerk account.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Clerk, Prisma 7, Convex, Vitest, Testing Library, Playwright, OWASP authentication guidance.

---

## Scope check

This plan covers one tightly coupled subsystem with three dependent concerns:

1. A real welcome-window entry surface inside the tracked app.
2. A safer auth handoff from welcome entry to Clerk to local bootstrap.
3. Documentation and targeted regression coverage.

Do not widen this into a full auth rewrite, MFA enforcement project, desktop-shell build, or full landing-page redesign. Keep the current Next.js App Router, Clerk, Prisma, and Convex wiring intact.

## External guidance already folded into this plan

- Convex + Clerk official guidance: keep Clerk as the login provider, keep `ClerkProvider` above `ConvexProviderWithClerk`, and treat Convex auth readiness as a server-validated token flow rather than raw client auth state.
- Convex auth guidelines: use server-derived identity, prefer stable identity keys over client-supplied IDs, and avoid accepting user identifiers from the client for authorization decisions.
- OWASP Authentication Cheat Sheet: use TLS-backed session auth, avoid client-side token storage, return generic auth failure copy, prevent open redirects, and require stronger trust checks around account-linking behavior.

## File structure and responsibilities

### Welcome surface

- Create: `src/components/welcome/welcome-window.tsx` — the real tracked welcome-window UI with explicit entry actions.
- Create: `src/components/welcome/welcome-window.test.tsx` — component contract for welcome copy and links.
- Modify: `src/app/page.tsx` — introduce a `welcome -> wizard -> landing` state flow instead of jumping straight to the launch wizard.
- Modify: `src/app/page.test.tsx` — cover the new first-visit welcome behavior.

### Auth safety and bootstrap

- Create: `src/modules/auth/post-auth-redirect.ts` — single source of truth for allowlisted post-auth redirect targets.
- Create: `src/modules/auth/post-auth-redirect.test.ts` — guard against open redirects and malformed targets.
- Modify: `src/modules/auth/clerk-user.ts` — require a verified Clerk email instead of any email.
- Create: `src/modules/auth/clerk-user.test.ts` — verify primary and fallback verified-email behavior.
- Modify: `src/modules/auth/bootstrap-user.ts` — reject unsafe account relinking and keep first-write bootstrap behavior explicit.
- Modify: `src/modules/auth/bootstrap-user.test.ts` — cover relink rejection and verified-email bootstrap cases.
- Modify: `src/app/sign-in/[[...sign-in]]/page.tsx` — accept a sanitized `redirectTo` value and keep Clerk redirect behavior explicit.
- Modify: `src/app/sign-in/[[...sign-in]]/page.test.tsx` — prove only safe redirect targets reach Clerk.
- Modify: `src/app/sign-up/[[...sign-up]]/page.tsx` — mirror the same sanitized redirect contract.
- Modify: `src/app/sign-up/[[...sign-up]]/page.test.tsx` — guard sign-up redirect handling.
- Modify: `src/app/(app)/auth/continue/page.tsx` — use the verified-email helper and keep the local bootstrap handoff deterministic.
- Modify: `src/app/(app)/auth/continue/page.test.tsx` — cover anonymous redirect, missing verified email, and bootstrap continue behavior.
- Modify: `src/app/api/v1/auth/bootstrap/route.ts` — reuse the verified-email helper and generic error behavior.
- Modify: `src/app/api/v1/auth/bootstrap/route.test.ts` — verify route-level auth and verified-email failures.
- Modify: `middleware.ts` — fail closed for protected routes when Clerk is unavailable instead of silently treating them as public.
- Modify: `src/middleware.test.ts` — lock in the protected-route behavior.

### Docs and navigation coverage

- Create: `tests/e2e/welcome-auth.spec.ts` — browser coverage for the welcome entry actions without requiring a live Clerk login.
- Modify: `README.md` — document the welcome-window login flow, security assumptions, and setup expectations.
- Modify: `docs/DEV_TREE.md` — point to the tracked welcome component instead of the excluded prototype folder.
- Modify: `docs/CODEBASE_INDEX.md` — add the welcome/auth entry flow to the navigation map.

## Phase order

1. Lock the redirect contract.
2. Harden verified-email extraction and local bootstrap.
3. Update auth pages and middleware to use the safer contract.
4. Add the real welcome-window UI and wire it into `/`.
5. Add focused Playwright coverage.
6. Update README and architecture docs.

---

### Task 0: Baseline and execution contract

**Files:**

- Modify: `docs/superpowers/plans/2026-04-24-secure-welcome-window-login.md`
- Test: `src/middleware.test.ts`
- Test: `src/app/page.test.tsx`

- [ ] **Step 1: Confirm the current repository baseline before any feature edits**

Run: `npm run lint`
Expected: PASS.

Run: `npm test`
Expected: PASS.

Run: `npm run build`
Expected: PASS.

- [ ] **Step 2: Record the implementation guardrails in the work log or PR body**

Use this checklist text:

```md
- [ ] Welcome window is implemented inside src/**, not in WelcomeWindow-startup/**
- [ ] Only allowlisted in-app redirects reach Clerk auth pages
- [ ] Local bootstrap requires a verified Clerk email
- [ ] Existing local profiles cannot be silently claimed by a different Clerk user
- [ ] README and architecture docs match the new welcome/auth flow
```

- [ ] **Step 3: Commit the plan itself before implementation starts**

```bash
git add docs/superpowers/plans/2026-04-24-secure-welcome-window-login.md
git commit -m "docs: add secure welcome window login plan"
```

### Task 1: Add the safe post-auth redirect contract

**Files:**

- Create: `src/modules/auth/post-auth-redirect.ts`
- Create: `src/modules/auth/post-auth-redirect.test.ts`

- [ ] **Step 1: Write the failing redirect-contract test first**

```ts
import { describe, expect, it } from "vitest";
import { getSafePostAuthRedirect } from "./post-auth-redirect";

describe("getSafePostAuthRedirect", () => {
  it("falls back to /auth/continue for missing or unsafe targets", () => {
    expect(getSafePostAuthRedirect(undefined)).toBe("/auth/continue");
    expect(getSafePostAuthRedirect("")).toBe("/auth/continue");
    expect(getSafePostAuthRedirect("https://evil.example/steal")).toBe("/auth/continue");
    expect(getSafePostAuthRedirect("//evil.example/steal")).toBe("/auth/continue");
    expect(getSafePostAuthRedirect("javascript:alert(1)")).toBe("/auth/continue");
  });

  it("preserves approved in-app targets", () => {
    expect(getSafePostAuthRedirect("/auth/continue")).toBe("/auth/continue");
    expect(getSafePostAuthRedirect("/dashboard?from=welcome")).toBe(
      "/dashboard?from=welcome",
    );
  });
});
```

- [ ] **Step 2: Run the focused test to verify failure**

Run: `npm test -- src/modules/auth/post-auth-redirect.test.ts`
Expected: FAIL because the module does not exist yet.

- [ ] **Step 3: Implement the smallest allowlist-based helper**

```ts
const allowedBasePaths = new Set(["/auth/continue", "/dashboard"]);

export function getSafePostAuthRedirect(candidate: string | null | undefined) {
  const normalized = candidate?.trim();

  if (!normalized || !normalized.startsWith("/") || normalized.startsWith("//")) {
    return "/auth/continue";
  }

  const [pathname] = normalized.split("?", 1);

  return pathname && allowedBasePaths.has(pathname) ? normalized : "/auth/continue";
}
```

- [ ] **Step 4: Re-run the same focused test**

Run: `npm test -- src/modules/auth/post-auth-redirect.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit the redirect contract**

```bash
git add src/modules/auth/post-auth-redirect.ts src/modules/auth/post-auth-redirect.test.ts
git commit -m "feat: add safe post-auth redirect helper"
```

### Task 2: Require a verified Clerk email and block unsafe relinking

**Files:**

- Modify: `src/modules/auth/clerk-user.ts`
- Create: `src/modules/auth/clerk-user.test.ts`
- Modify: `src/modules/auth/bootstrap-user.ts`
- Modify: `src/modules/auth/bootstrap-user.test.ts`

- [ ] **Step 1: Write the failing verified-email helper test**

```ts
import { describe, expect, it } from "vitest";
import { getClerkUserEmail, missingClerkUserEmailErrorMessage } from "./clerk-user";

describe("getClerkUserEmail", () => {
  it("returns the verified primary email when available", () => {
    expect(
      getClerkUserEmail({
        primaryEmailAddress: {
          emailAddress: "primary@example.com",
          verification: { status: "verified" },
        },
      }),
    ).toBe("primary@example.com");
  });

  it("falls back to the first verified secondary email", () => {
    expect(
      getClerkUserEmail({
        primaryEmailAddress: {
          emailAddress: "pending@example.com",
          verification: { status: "unverified" },
        },
        emailAddresses: [
          { emailAddress: "pending@example.com", verification: { status: "unverified" } },
          { emailAddress: "verified@example.com", verification: { status: "verified" } },
        ],
      }),
    ).toBe("verified@example.com");
  });

  it("returns an empty string when no verified email exists", () => {
    expect(
      getClerkUserEmail({
        emailAddresses: [{ emailAddress: "pending@example.com", verification: { status: "unverified" } }],
      }),
    ).toBe("");
    expect(missingClerkUserEmailErrorMessage).toMatch(/verified email-backed/i);
  });
});
```

- [ ] **Step 2: Add the failing bootstrap relink test**

Add this test case to `src/modules/auth/bootstrap-user.test.ts`:

```ts
it("rejects claiming a local profile already linked to another Clerk account", async () => {
  existingProfiles.push({
    id: "profile-1",
    clerkUserId: "existing_clerk_user",
    email: "owner@example.com",
    displayName: "Existing Owner",
    memberships: [],
    workspacePreferences: [],
  });

  await expect(
    bootstrapUser({
      clerkUserId: "new_clerk_user",
      email: "owner@example.com",
      displayName: "New Owner",
    }),
  ).rejects.toThrow("A different Clerk account is already linked to this local profile.");
});
```

- [ ] **Step 3: Run the focused auth module tests and verify failure**

Run: `npm test -- src/modules/auth/clerk-user.test.ts src/modules/auth/bootstrap-user.test.ts`
Expected: FAIL because the new verified-email behavior and relink protection are not implemented yet.

- [ ] **Step 4: Implement the verified-email extraction and safer relink guard**

```ts
type ClerkEmailAddress = {
  emailAddress?: string | null;
  verification?: { status?: string | null } | null;
};

export const missingClerkUserEmailErrorMessage =
  "BudgetBITCH requires a verified email-backed Clerk account before local setup can finish.";

export function getClerkUserEmail(user: ClerkUserLike) {
  const candidates = [user?.primaryEmailAddress, ...(user?.emailAddresses ?? [])].filter(Boolean);

  return (
    candidates.find((candidate) => candidate?.verification?.status === "verified")
      ?.emailAddress?.trim() ?? ""
  );
}
```

```ts
if (existingProfileByEmail?.clerkUserId && existingProfileByEmail.clerkUserId !== normalizedClerkUserId) {
  throw new Error("A different Clerk account is already linked to this local profile.");
}
```

- [ ] **Step 5: Re-run the same focused tests**

Run: `npm test -- src/modules/auth/clerk-user.test.ts src/modules/auth/bootstrap-user.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit the auth-hardening module changes**

```bash
git add src/modules/auth/clerk-user.ts src/modules/auth/clerk-user.test.ts src/modules/auth/bootstrap-user.ts src/modules/auth/bootstrap-user.test.ts
git commit -m "feat: harden clerk email and bootstrap linking"
```

### Task 3: Apply the redirect and bootstrap contract to the auth routes and middleware

**Files:**

- Modify: `src/app/sign-in/[[...sign-in]]/page.tsx`
- Modify: `src/app/sign-in/[[...sign-in]]/page.test.tsx`
- Modify: `src/app/sign-up/[[...sign-up]]/page.tsx`
- Modify: `src/app/sign-up/[[...sign-up]]/page.test.tsx`
- Modify: `src/app/(app)/auth/continue/page.tsx`
- Modify: `src/app/(app)/auth/continue/page.test.tsx`
- Modify: `src/app/api/v1/auth/bootstrap/route.ts`
- Modify: `src/app/api/v1/auth/bootstrap/route.test.ts`
- Modify: `middleware.ts`
- Modify: `src/middleware.test.ts`

- [ ] **Step 1: Add failing tests for safe redirect handling on sign-in and sign-up pages**

Add this test case to `src/app/sign-in/[[...sign-in]]/page.test.tsx`:

```tsx
it("passes only a safe redirect target to Clerk", async () => {
  clerkConfiguredMock.mockReturnValue(true);
  authMock.mockResolvedValue({ userId: null });

  const view = await SignInPage({
    searchParams: Promise.resolve({ redirectTo: "https://evil.example/steal" }),
  });

  render(view);

  expect(screen.getByTestId("clerk-sign-in")).toHaveAttribute(
    "data-force-redirect-url",
    "/auth/continue",
  );
});
```

Add this matching test case to `src/app/sign-up/[[...sign-up]]/page.test.tsx`:

```tsx
it("passes only a safe redirect target to Clerk", async () => {
  clerkConfiguredMock.mockReturnValue(true);
  authMock.mockResolvedValue({ userId: null });

  const view = await SignUpPage({
    searchParams: Promise.resolve({ redirectTo: "https://evil.example/steal" }),
  });

  render(view);

  expect(screen.getByTestId("clerk-sign-up")).toHaveAttribute(
    "data-force-redirect-url",
    "/auth/continue",
  );
});
```

- [ ] **Step 2: Add a failing middleware test for protected-route fail-closed behavior**

Add this test case to `src/middleware.test.ts`:

```ts
it("redirects protected routes to sign-in when Clerk is unavailable", () => {
  vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "");
  vi.stubEnv("CLERK_SECRET_KEY", "");

  const request = new Request("http://localhost/dashboard");
  const event = { waitUntil: vi.fn() } as Parameters<typeof middleware>[1];
  const response = middleware(request as never, event);

  expect(nextResponseRedirectMock).toHaveBeenCalled();
  expect(response).toBe("redirect-response");
});
```

- [ ] **Step 3: Run the focused auth-surface tests and verify failure**

Run: `npm test -- src/app/sign-in/[[...sign-in]]/page.test.tsx src/app/sign-up/[[...sign-up]]/page.test.tsx src/app/(app)/auth/continue/page.test.tsx src/app/api/v1/auth/bootstrap/route.test.ts src/middleware.test.ts`
Expected: FAIL because the route pages and middleware do not use the new contracts yet.

- [ ] **Step 4: Implement the smallest route and middleware changes**

Update `src/app/sign-in/[[...sign-in]]/page.tsx` like this:

```tsx
import { getSafePostAuthRedirect } from "@/modules/auth/post-auth-redirect";

type SignInPageProps = {
  searchParams?: Promise<{ redirectTo?: string }>;
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const params = (await searchParams) ?? {};
  const forceRedirectUrl = getSafePostAuthRedirect(params.redirectTo);

  if (userId) {
    redirect(forceRedirectUrl);
  }

  return <SignIn forceRedirectUrl={forceRedirectUrl} path="/sign-in" signUpUrl="/sign-up" />;
}
```

Mirror the same shape in `src/app/sign-up/[[...sign-up]]/page.tsx`.

Update the anonymous redirect in `src/app/(app)/auth/continue/page.tsx` like this:

```ts
redirect(`/sign-in?redirectTo=${encodeURIComponent("/auth/continue")}`);
```

Keep the bootstrap route thin in `src/app/api/v1/auth/bootstrap/route.ts` by continuing to call `bootstrapUser`, but rely on the verified-email helper so the route returns the generic verified-email guidance instead of accepting any email-backed Clerk account.

Update `middleware.ts` like this:

```ts
const protectedPathPrefixes = ["/dashboard", "/settings", "/auth/continue", "/api/v1"];

function isProtectedPath(pathname: string) {
  return protectedPathPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

if (!isClerkConfigured() || !publishableKey) {
  if (isProtectedPath(request.nextUrl.pathname)) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  return NextResponse.next();
}
```

- [ ] **Step 5: Re-run the same focused tests**

Run: `npm test -- src/app/sign-in/[[...sign-in]]/page.test.tsx src/app/sign-up/[[...sign-up]]/page.test.tsx src/app/(app)/auth/continue/page.test.tsx src/app/api/v1/auth/bootstrap/route.test.ts src/middleware.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit the auth-surface contract changes**

```bash
git add src/app/sign-in/[[...sign-in]]/page.tsx src/app/sign-in/[[...sign-in]]/page.test.tsx src/app/sign-up/[[...sign-up]]/page.tsx src/app/sign-up/[[...sign-up]]/page.test.tsx src/app/(app)/auth/continue/page.tsx src/app/(app)/auth/continue/page.test.tsx src/app/api/v1/auth/bootstrap/route.ts src/app/api/v1/auth/bootstrap/route.test.ts middleware.ts src/middleware.test.ts
git commit -m "feat: secure auth routes and protected middleware"
```

### Task 4: Build the tracked welcome window and wire it into the home page

**Files:**

- Create: `src/components/welcome/welcome-window.tsx`
- Create: `src/components/welcome/welcome-window.test.tsx`
- Modify: `src/app/page.tsx`
- Modify: `src/app/page.test.tsx`

- [ ] **Step 1: Write the failing welcome-window component test**

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { WelcomeWindow } from "./welcome-window";

describe("WelcomeWindow", () => {
  it("renders explicit auth actions and a guest continue action", () => {
    render(<WelcomeWindow onContinueWithoutLogin={vi.fn()} />);

    expect(screen.getByRole("heading", { name: /open your budget board safely/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /open sign in/i })).toHaveAttribute(
      "href",
      "/sign-in?redirectTo=%2Fauth%2Fcontinue",
    );
    expect(screen.getByRole("link", { name: /open sign up/i })).toHaveAttribute(
      "href",
      "/sign-up?redirectTo=%2Fauth%2Fcontinue",
    );
    expect(screen.getByRole("button", { name: /continue without login/i })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Update the home-page test to require the welcome state first**

Replace the first test in `src/app/page.test.tsx` with this:

```tsx
it("shows the welcome window before the launch wizard on first visit", async () => {
  render(<Home />);

  expect(
    await screen.findByRole("heading", { name: /open your budget board safely/i }),
  ).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: /continue without login/i }));

  expect(await screen.findByRole("button", { name: /mock launch wizard/i })).toBeInTheDocument();
});
```

- [ ] **Step 3: Run the focused welcome and home tests and verify failure**

Run: `npm test -- src/components/welcome/welcome-window.test.tsx src/app/page.test.tsx`
Expected: FAIL because the welcome component does not exist and the home page still jumps to the wizard.

- [ ] **Step 4: Implement the smallest tracked welcome-window surface**

Create `src/components/welcome/welcome-window.tsx` like this:

```tsx
import Link from "next/link";
import { MobilePanelFrame } from "@/components/mobile/mobile-panel-frame";

type WelcomeWindowProps = {
  onContinueWithoutLogin: () => void;
};

export function WelcomeWindow({ onContinueWithoutLogin }: WelcomeWindowProps) {
  return (
    <main className="bb-page-shell px-4 py-8 text-white md:px-5 md:py-10">
      <MobilePanelFrame>
        <section className="mx-auto grid max-w-6xl gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(22rem,0.95fr)]">
          <article className="bb-panel bb-panel-strong p-7 md:p-9">
            <p className="bb-kicker">Welcome</p>
            <h1 className="mt-3 text-4xl font-semibold md:text-5xl">Open your budget board safely.</h1>
            <p className="bb-copy mt-4 max-w-2xl text-sm md:text-base">
              Sign in with Clerk for your personal workspace, or continue locally first and add login later.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/sign-in?redirectTo=%2Fauth%2Fcontinue" className="bb-button-primary">
                Open sign in
              </Link>
              <Link href="/sign-up?redirectTo=%2Fauth%2Fcontinue" className="bb-button-secondary">
                Open sign up
              </Link>
              <button type="button" className="bb-button-ghost" onClick={onContinueWithoutLogin}>
                Continue without login
              </button>
            </div>
          </article>
        </section>
      </MobilePanelFrame>
    </main>
  );
}
```

Update `src/app/page.tsx` like this:

```tsx
import { WelcomeWindow } from "@/components/welcome/welcome-window";

type HomeDisplayState = "loading" | "welcome" | "wizard" | "landing";

useEffect(() => {
  const frame = window.requestAnimationFrame(() => {
    const savedProfile = window.localStorage.getItem(LAUNCH_PROFILE_STORAGE_KEY);
    setHomeState(hasCompletedLaunchProfile(savedProfile) ? "landing" : "welcome");
  });

  return () => window.cancelAnimationFrame(frame);
}, []);

function handleWelcomeContinue() {
  setHomeState("wizard");
}
```

Render `WelcomeWindow` in its own `AnimatePresence` branch before the wizard branch.

- [ ] **Step 5: Re-run the same focused tests**

Run: `npm test -- src/components/welcome/welcome-window.test.tsx src/app/page.test.tsx`
Expected: PASS.

- [ ] **Step 6: Commit the welcome-window integration**

```bash
git add src/components/welcome/welcome-window.tsx src/components/welcome/welcome-window.test.tsx src/app/page.tsx src/app/page.test.tsx
git commit -m "feat: add tracked welcome window entry"
```

### Task 5: Add focused Playwright coverage for the welcome entry flow

**Files:**

- Create: `tests/e2e/welcome-auth.spec.ts`

- [ ] **Step 1: Write the failing Playwright navigation test**

```ts
import { expect, test } from "@playwright/test";

test("welcome window exposes safe auth entry points", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: /open your budget board safely/i }),
  ).toBeVisible();

  await expect(page.getByRole("link", { name: "Open sign in" })).toHaveAttribute(
    "href",
    "/sign-in?redirectTo=%2Fauth%2Fcontinue",
  );

  await expect(page.getByRole("link", { name: "Open sign up" })).toHaveAttribute(
    "href",
    "/sign-up?redirectTo=%2Fauth%2Fcontinue",
  );

  await page.getByRole("button", { name: "Continue without login" }).click();

  await expect(
    page.getByRole("heading", { name: /launch your dashboard window/i }),
  ).toBeVisible();
});
```

- [ ] **Step 2: Run the focused browser test and verify failure**

Run: `npm run test:e2e -- tests/e2e/welcome-auth.spec.ts`
Expected: FAIL because the welcome surface is not yet wired in the browser.

- [ ] **Step 3: Re-run the same browser test after the UI task lands**

Run: `npm run test:e2e -- tests/e2e/welcome-auth.spec.ts`
Expected: PASS.

- [ ] **Step 4: Commit the new browser coverage**

```bash
git add tests/e2e/welcome-auth.spec.ts
git commit -m "test: cover welcome auth entry flow"
```

### Task 6: Update README and architecture docs to match the new flow

**Files:**

- Modify: `README.md`
- Modify: `docs/DEV_TREE.md`
- Modify: `docs/CODEBASE_INDEX.md`

- [ ] **Step 1: Add a failing doc-level acceptance checklist to your work log**

Use this checklist text:

```md
- [ ] README explains the welcome-window login path and its security assumptions
- [ ] DEV_TREE points at src/components/welcome rather than the excluded prototype
- [ ] CODEBASE_INDEX includes the root welcome/auth flow entry
```

- [ ] **Step 2: Update the README with the concrete welcome/auth notes**

Add a section like this to `README.md`:

```md
## Welcome window login

- First-time visitors land on a tracked welcome window at `/` before the local launch wizard.
- `Open sign in` and `Open sign up` route through Clerk and always hand off to `/auth/continue` unless an allowlisted in-app redirect is provided.
- BudgetBITCH does not store auth tokens in `localStorage`, query strings, or custom client storage. Clerk session handling remains cookie-based and server-owned.
- Local profile bootstrap requires a verified Clerk email and refuses to silently relink a profile already claimed by a different Clerk account.
```

- [ ] **Step 3: Update `docs/DEV_TREE.md` and `docs/CODEBASE_INDEX.md` with the tracked welcome surface**

Add or replace entries with text like this:

```md
- `src/components/welcome/welcome-window.tsx` — tracked welcome entry surface with explicit sign-in, sign-up, and guest-continue actions.
- `src/modules/auth/post-auth-redirect.ts` — allowlisted redirect helper shared by sign-in and sign-up routes.
- `src/app/(app)/auth/continue/page.tsx` — verified-email bootstrap handoff from Clerk to local workspace setup.
```

- [ ] **Step 4: Run the full repository validation after the docs land**

Run: `npm run lint`
Expected: PASS.

Run: `npm test`
Expected: PASS.

Run: `npm run test:e2e -- tests/e2e/welcome-auth.spec.ts`
Expected: PASS.

Run: `npm run build`
Expected: PASS.

- [ ] **Step 5: Commit the doc updates and final verification**

```bash
git add README.md docs/DEV_TREE.md docs/CODEBASE_INDEX.md
git commit -m "docs: describe secure welcome login flow"
```

## Self-review

### Spec coverage

- Welcome-window login is covered by Task 4 and Task 5.
- Security-first redirect and bootstrap hardening is covered by Task 1, Task 2, and Task 3.
- README update is covered by Task 6.

### Placeholder scan

- No `TODO`, `TBD`, or “implement later” markers remain.
- Every code-writing step includes an actual code block.
- Every validation step includes an exact command and expected result.

### Type consistency

- The redirect helper is consistently named `getSafePostAuthRedirect` across helper, pages, and tests.
- The verified-email helper keeps the existing exported name `getClerkUserEmail` to minimize churn while changing the behavior safely.
- The home state machine consistently uses `loading | welcome | wizard | landing` in both component and tests.
