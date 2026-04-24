# Secure Welcome Window Login Auth Guard Refactor Implementation Plan

> **For agentic workers:** REQUIRED: Use the `subagent-driven-development` agent (recommended) or `executing-plans` agent to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve the signed-out welcome window at `/` while making protected app routes consistently require authentication when Clerk is configured, removing anonymous demo access from those protected routes, and showing a real loading state while root auth is unresolved.

**Architecture:** Keep the current Next.js App Router, Clerk, and Prisma wiring intact. Fix the gap at the two real control points: route admission in `middleware.ts` and dashboard data fallback behavior in `src/modules/dashboard/dashboard-data.ts`, then add one small root-page UX fix so unresolved Clerk auth no longer renders a blank screen.

**Tech Stack:** Next.js App Router, React, TypeScript, Clerk, Prisma, Vitest, Testing Library, Playwright.

---

## Scope check

This is one focused auth-admission refactor, not a broad auth rewrite. Do not change Clerk provider setup, sign-in/sign-up route structure, or workspace bootstrap flow beyond what is needed to make protected routes enforceable and to remove anonymous protected-route demo fallbacks.

## File structure and responsibilities

- Modify: `middleware.ts` — keep the current no-Clerk fallback behavior, but when Clerk is configured, switch from passive delegation to active protection for the existing protected route prefixes.
- Modify: `src/middleware.test.ts` — lock the middleware contract for public routes, protected document routes, and protected API routes under both Clerk-configured and Clerk-unavailable conditions.
- Create: `src/modules/dashboard/dashboard-data.test.ts` — define the new access contract so dashboard data cannot silently downgrade to demo mode when Clerk is configured.
- Modify: `src/modules/dashboard/dashboard-data.ts` — make demo data a no-Clerk fallback only; return explicit redirect intents for anonymous or unbootstrapped live access.
- Modify: `src/app/(app)/dashboard/page.tsx` — consume the new dashboard-data contract and redirect to sign-in or `/auth/continue` instead of rendering demo state.
- Modify: `src/app/(app)/dashboard/page.test.tsx` — keep the page test aligned with the new discriminated result from `getDashboardPageData()`.
- Modify: `src/app/page.tsx` — show explicit auth-loading UI while Clerk auth is unresolved, reusing the existing loading window instead of introducing a new surface.
- Modify: `src/app/page.test.tsx` — add root-loading coverage so the welcome page cannot regress back to a blank auth-loading render.
- Modify: `tests/e2e/welcome-auth.spec.ts` — keep the public root welcome regression coverage and add a protected-route redirect regression that works in the repo’s no-local-Clerk Playwright setup.

## Behavioral decisions

- Anonymous demo access is no longer allowed for `/dashboard`, `/settings`, `/auth/continue`, or `/api/v1` when Clerk is configured.
- Demo dashboard data remains available only when Clerk is not configured or the app is intentionally running in the current local fallback mode without live auth.
- A signed-in user who reaches `/dashboard` without a local profile or workspace bootstrap should be redirected to `/auth/continue`, not shown demo data.
- The root page remains public and continues to show the signed-out welcome window at `/`.
- While Clerk auth is still loading on `/`, the page should show an explicit loading window instead of rendering nothing.

## Task 1: Lock the middleware behavior before refactoring

**Files:**
- Modify: `src/middleware.test.ts`
- Modify: `middleware.ts`

- [ ] **Step 1: Add a failing Clerk-configured protected-route test**

```ts
it("protects dashboard routes when Clerk is configured", async () => {
  const publishableKey = createPublishableKey("clerk.budgetbitch.test");
  const protectMock = vi.fn();

  clerkMiddlewareMock.mockImplementation((handler, options) => {
    expect(options).toEqual({ publishableKey });

    return (request: Request, event: unknown) =>
      handler(
        {
          protect: protectMock,
        },
        request,
        event,
      );
  });

  vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", publishableKey);
  vi.stubEnv("CLERK_SECRET_KEY", "sk_test_budgetbitch");

  const request = new Request("http://localhost/dashboard?workspaceId=workspace-2");
  const event = { waitUntil: vi.fn() } as Parameters<typeof middleware>[1];

  await middleware(request as never, event);

  expect(protectMock).toHaveBeenCalledWith({
    unauthenticatedUrl:
      "http://localhost/sign-in?redirectTo=%2Fdashboard%3FworkspaceId%3Dworkspace-2",
  });
});
```

- [ ] **Step 2: Add a failing public-route regression test**

```ts
it("keeps the root route public when Clerk is configured", async () => {
  const publishableKey = createPublishableKey("clerk.budgetbitch.test");
  const protectMock = vi.fn();

  clerkMiddlewareMock.mockImplementation((handler) => {
    return (request: Request, event: unknown) =>
      handler(
        {
          protect: protectMock,
        },
        request,
        event,
      );
  });

  vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", publishableKey);
  vi.stubEnv("CLERK_SECRET_KEY", "sk_test_budgetbitch");

  const request = new Request("http://localhost/");
  const event = { waitUntil: vi.fn() } as Parameters<typeof middleware>[1];

  await middleware(request as never, event);

  expect(protectMock).not.toHaveBeenCalled();
});
```

- [ ] **Step 3: Add a failing protected API-route test so `/api/v1` stays covered too**

```ts
it("protects API routes when Clerk is configured", async () => {
  const publishableKey = createPublishableKey("clerk.budgetbitch.test");
  const protectMock = vi.fn();

  clerkMiddlewareMock.mockImplementation((handler) => {
    return (request: Request, event: unknown) =>
      handler(
        {
          protect: protectMock,
        },
        request,
        event,
      );
  });

  vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", publishableKey);
  vi.stubEnv("CLERK_SECRET_KEY", "sk_test_budgetbitch");

  const request = new Request("http://localhost/api/v1/auth/bootstrap");
  const event = { waitUntil: vi.fn() } as Parameters<typeof middleware>[1];

  await middleware(request as never, event);

  expect(protectMock).toHaveBeenCalledTimes(1);
});
```

- [ ] **Step 4: Run the middleware test file and confirm the new tests fail for the diagnosed reason**

Run: `npm test -- src/middleware.test.ts`
Expected: FAIL because protected routes are still only delegated to Clerk middleware without any protection callback.

- [ ] **Step 5: Refactor `middleware.ts` to enforce protection inside Clerk middleware**

```ts
function getRedirectTarget(request: NextRequest) {
  const pathname = getRequestPathname(request);
  const search = request.nextUrl?.search ?? "";

  return `${pathname}${search}`;
}

export default function middleware(request: NextRequest, event: NextFetchEvent) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim();

  if (!isClerkConfigured() || !publishableKey) {
    const pathname = getRequestPathname(request);

    if (isProtectedPath(pathname)) {
      if (isApiPath(pathname)) {
        return Response.json({ error: clerkConfigurationErrorMessage }, { status: 503 });
      }

      return NextResponse.redirect(new URL("/sign-in", request.url));
    }

    return NextResponse.next();
  }

  return clerkMiddleware(
    async (auth, req) => {
      if (isProtectedPath(getRequestPathname(req))) {
        const redirectTarget = getRedirectTarget(req);
        const signInUrl = new URL("/sign-in", req.url);

        signInUrl.searchParams.set("redirectTo", redirectTarget);

        await auth.protect({ unauthenticatedUrl: signInUrl.toString() });
      }

      return NextResponse.next();
    },
    { publishableKey },
  )(request, event);
}
```

- [ ] **Step 6: Re-run the same middleware test file**

Run: `npm test -- src/middleware.test.ts`
Expected: PASS.

- [ ] **Step 7: Commit the middleware contract**

```bash
git add middleware.ts src/middleware.test.ts
git commit -m "fix: protect app routes when Clerk is configured"
```

## Task 2: Remove anonymous protected-route demo fallback from dashboard access

**Files:**
- Create: `src/modules/dashboard/dashboard-data.test.ts`
- Modify: `src/modules/dashboard/dashboard-data.ts`
- Modify: `src/app/(app)/dashboard/page.tsx`
- Modify: `src/app/(app)/dashboard/page.test.tsx`

- [ ] **Step 1: Add a failing dashboard-data contract test for anonymous live access**

```ts
it("returns an auth-required result instead of demo data when Clerk is configured but the visitor is anonymous", async () => {
  isClerkConfiguredMock.mockReturnValue(true);
  authMock.mockResolvedValue({ userId: null });

  await expect(getDashboardPageData("workspace-2")).resolves.toEqual({
    kind: "auth-required",
    redirectTo: "/sign-in?redirectTo=%2Fdashboard%3FworkspaceId%3Dworkspace-2",
  });
});
```

- [ ] **Step 2: Add a failing dashboard-data contract test for signed-in but unbootstrapped users**

```ts
it("returns a setup-required result instead of demo data when the Clerk user has no local profile", async () => {
  isClerkConfiguredMock.mockReturnValue(true);
  authMock.mockResolvedValue({ userId: "user_123" });
  prisma.userProfile.findUnique.mockResolvedValue(null);

  await expect(getDashboardPageData("workspace-2")).resolves.toEqual({
    kind: "setup-required",
    redirectTo: "/auth/continue?redirectTo=%2Fdashboard%3FworkspaceId%3Dworkspace-2",
  });
});
```

- [ ] **Step 3: Keep the current no-Clerk demo fallback covered**

```ts
it("still returns demo data when Clerk is not configured", async () => {
  isClerkConfiguredMock.mockReturnValue(false);

  const result = await getDashboardPageData(null);

  expect(result.kind).toBe("data");
  expect(result.data.isDemo).toBe(true);
});
```

- [ ] **Step 4: Run the focused dashboard-data test file and confirm failure**

Run: `npm test -- src/modules/dashboard/dashboard-data.test.ts`
Expected: FAIL because `getDashboardPageData()` still returns demo data for anonymous users and missing profiles.

- [ ] **Step 5: Refactor `getDashboardPageData()` to return an explicit access result**

```ts
export type DashboardPageDataResult =
  | { kind: "data"; data: DashboardPageData }
  | { kind: "auth-required"; redirectTo: string }
  | { kind: "setup-required"; redirectTo: string };

function getDashboardRedirectTarget(requestedWorkspaceId?: string | null) {
  const search = requestedWorkspaceId
    ? `?workspaceId=${encodeURIComponent(requestedWorkspaceId)}`
    : "";

  return `/dashboard${search}`;
}

export async function getDashboardPageData(
  requestedWorkspaceId?: string | null,
): Promise<DashboardPageDataResult> {
  if (!process.env.DATABASE_URL?.trim() || !isClerkConfigured()) {
    return { kind: "data", data: buildDemoData(requestedWorkspaceId) };
  }

  const redirectTarget = getDashboardRedirectTarget(requestedWorkspaceId);
  const { userId } = await auth();

  if (!userId) {
    return {
      kind: "auth-required",
      redirectTo: `/sign-in?redirectTo=${encodeURIComponent(redirectTarget)}`,
    };
  }

  const profile = await prisma.userProfile.findUnique({
    where: { clerkUserId: userId },
    select: {
      displayName: true,
      memberships: {
        select: {
          role: true,
          workspace: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      workspacePreferences: {
        select: {
          workspaceId: true,
          isDefault: true,
        },
      },
    },
  });

  if (!profile) {
    return {
      kind: "setup-required",
      redirectTo: `/auth/continue?redirectTo=${encodeURIComponent(redirectTarget)}`,
    };
  }

  const workspaces = buildLiveWorkspaceOptions(profile);
  const resolution = resolveActiveWorkspace(workspaces, requestedWorkspaceId);
  const today = getTodayIsoDate();
  const briefing = await loadDashboardBriefing();
  const todayCheckIn = resolution.activeWorkspace
    ? await prisma.dailyCheckIn.findUnique({
        where: {
          workspaceId_checkInDate: {
            workspaceId: resolution.activeWorkspace.workspaceId,
            checkInDate: getUtcDate(today),
          },
        },
        select: {
          checkInJson: true,
          updatedAt: true,
        },
      })
    : null;

  return {
    kind: "data",
    data: {
      activeWorkspace: resolution.activeWorkspace,
      briefing,
      dailyCheckIn: todayCheckIn
        ? parseCheckInJson(todayCheckIn.checkInJson, todayCheckIn.updatedAt, today)
        : buildEmptyCheckIn(today),
      isDemo: false,
      launcherTools: buildLauncherTools(),
      launchProfile: null,
      localAreaLabel: resolution.activeWorkspace?.name ?? "Local area",
      matchedRequestedWorkspace: resolution.matchedRequestedWorkspace,
      requestedWorkspaceId: resolution.requestedWorkspaceId,
      resolutionSource: resolution.resolutionSource,
      userDisplayName: profile.displayName,
      workspaces,
    },
  };
}
```

- [ ] **Step 6: Update the dashboard page to redirect instead of rendering the wrong state**

```tsx
import { redirect } from "next/navigation";

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const resolvedSearchParams = (await searchParams) ?? undefined;
  const requestedWorkspaceId = getRequestedWorkspaceId(resolvedSearchParams);
  const result = await getDashboardPageData(requestedWorkspaceId);

  if (result.kind === "auth-required" || result.kind === "setup-required") {
    redirect(result.redirectTo);
  }

  const dashboardData = result.data;
  const activeWorkspaceName = dashboardData.activeWorkspace?.name ?? "No workspace selected";
  const activeWorkspaceRole = dashboardData.activeWorkspace?.role.replaceAll("_", " ") ?? "none";
  const checkInStatus =
    dashboardData.dailyCheckIn.status === "submitted" ? "Submitted today" : "Needs today’s check-in";
}
```

- [ ] **Step 7: Update the dashboard page test to match the new result shape**

```ts
getDashboardPageData.mockResolvedValue({
  kind: "data",
  data: {
    activeWorkspace: {
      id: "workspace-2",
      name: "Side Hustle",
      role: "owner",
    },
    dailyCheckIn: {
      status: "submitted",
      checkInDate: "2026-04-09",
      headline: "Today is still inside the plan.",
      plannedSpend: 42,
      alertCount: 0,
      alerts: [],
      cashStatus: "positive",
      netCashflow: 310,
      lastSubmittedAt: "2026-04-09T09:00:00.000Z",
    },
    isDemo: false,
    matchedRequestedWorkspace: true,
    requestedWorkspaceId: "workspace-2",
    resolutionSource: "requested",
    userDisplayName: "Avery",
    workspaces: [
      {
        id: "workspace-1",
        name: "Household",
        role: "editor",
        isDefault: true,
      },
      {
        id: "workspace-2",
        name: "Side Hustle",
        role: "owner",
      },
    ],
    launchProfile: {
      city: "Dublin",
      layoutPreset: "launcher_grid",
      motionPreset: "cinematic",
      themePreset: "midnight",
    },
    localAreaLabel: "Dublin",
    launcherTools: [
      {
        title: "Open setup wizard",
        href: "/start-smart",
        detail: "Tune the board before anything else.",
        label: "Wizard",
      },
    ],
    briefing: {
      generatedAt: "2026-04-10T12:00:00.000Z",
      sourceStatus: "live",
      topics: [],
    },
  },
});
```

- [ ] **Step 8: Run the focused dashboard tests**

Run: `npm test -- src/modules/dashboard/dashboard-data.test.ts src/app/(app)/dashboard/page.test.tsx`
Expected: PASS.

- [ ] **Step 9: Commit the dashboard access contract**

```bash
git add src/modules/dashboard/dashboard-data.ts src/modules/dashboard/dashboard-data.test.ts src/app/(app)/dashboard/page.tsx src/app/(app)/dashboard/page.test.tsx
git commit -m "refactor: make dashboard access explicit"
```

## Task 3: Add explicit auth-loading UI to the public root page

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/app/page.test.tsx`

- [ ] **Step 1: Add a failing root-page loading test**

```tsx
it("shows a loading window while Clerk auth is unresolved", () => {
  clerkUseAuthMock.mockReturnValue({
    isLoaded: false,
    isSignedIn: false,
  });

  render(<Home />);

  expect(screen.getByText(/preparing your money board/i)).toBeInTheDocument();
  expect(screen.getByText(/active work: auth/i)).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the root-page test file and confirm the new test fails because the page is blank while auth loads**

Run: `npm test -- src/app/page.test.tsx`
Expected: FAIL because `displayState === "loading"` does not currently render visible auth-loading UI.

- [ ] **Step 3: Reuse `MoneyLoadingWindow` for auth loading instead of adding a new component**

```tsx
function HomeContent({ isLoaded, isSignedIn }: HomeAuthState) {
  const authLoadingVisible = !isLoaded;
  const loadingReasons = authLoadingVisible ? ["auth"] : loadingWindow.reasons;

  return (
    <>
      <MoneyLoadingWindow
        visible={authLoadingVisible || loadingWindow.visible}
        reasons={loadingReasons}
        reducedMotion={loadingWindow.reducedMotion}
        showArt={loadingWindow.showArt}
      />
    </>
  );
}
```

- [ ] **Step 4: Re-run the root-page test file**

Run: `npm test -- src/app/page.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit the auth-loading fix**

```bash
git add src/app/page.tsx src/app/page.test.tsx
git commit -m "fix: show auth loading state on home page"
```

## Task 4: Add end-to-end regression coverage for public root and protected-route redirects

**Files:**
- Modify: `tests/e2e/welcome-auth.spec.ts`

- [ ] **Step 1: Add a Playwright regression test for direct dashboard access in the local no-Clerk harness**

```ts
test("signed-out visitors cannot open dashboard directly", async ({ page }) => {
  await page.goto("/dashboard?workspaceId=workspace-household");

  await expect(page).toHaveURL(
    /\/sign-in\?redirectTo=%2Fdashboard%3FworkspaceId%3Dworkspace-household$/,
  );
  await expect(
    page.getByRole("heading", { name: /sign in is not ready yet/i }),
  ).toBeVisible({ timeout: 15000 });
});
```

- [ ] **Step 2: Record the scope of this Playwright coverage in the spec comment above the new test**

```ts
// This covers the repo's no-local-Clerk fallback harness.
// The Clerk-configured root cause is enforced by Vitest middleware tests,
// because local Playwright does not run with a real Clerk session.
```

- [ ] **Step 3: Run the focused Playwright file after Tasks 1 through 3 are complete**

Run: `npx playwright test tests/e2e/welcome-auth.spec.ts --project=chromium --workers=1`
Expected: PASS.

- [ ] **Step 4: Commit the e2e regression coverage**

```bash
git add tests/e2e/welcome-auth.spec.ts
git commit -m "test: cover welcome and protected-route auth flows"
```

## Task 5: Run the full validation suite from the target worktree

**Files:**
- Modify: none
- Test: `src/middleware.test.ts`
- Test: `src/modules/dashboard/dashboard-data.test.ts`
- Test: `src/app/(app)/dashboard/page.test.tsx`
- Test: `src/app/page.test.tsx`
- Test: `tests/e2e/welcome-auth.spec.ts`

- [ ] **Step 1: Run the focused auth regression suite one more time**

Run: `npm test -- src/middleware.test.ts src/modules/dashboard/dashboard-data.test.ts src/app/(app)/dashboard/page.test.tsx src/app/page.test.tsx`
Expected: PASS.

- [ ] **Step 2: Run lint from the target worktree**

Run: `npm run lint`
Expected: PASS.

- [ ] **Step 3: Run the full unit suite from the target worktree**

Run: `npm test`
Expected: PASS.

- [ ] **Step 4: Run the focused Playwright suite**

Run: `npx playwright test tests/e2e/welcome-auth.spec.ts --project=chromium --workers=1`
Expected: PASS.

- [ ] **Step 5: Run the full end-to-end suite if the branch is otherwise green**

Run: `npm run test:e2e`
Expected: PASS.

- [ ] **Step 6: Run the production build**

Run: `npm run build`
Expected: PASS.

## Rationale

- The real bug is not the root welcome page itself; it is that route admission and dashboard fallback disagree about whether `/dashboard` is protected.
- Keeping the change centered in `middleware.ts` and `dashboard-data.ts` fixes the root cause without rewriting Clerk wiring or page structure.
- Using a discriminated dashboard access result is the smallest way to make live-access failures explicit and testable.
- Reusing `MoneyLoadingWindow` keeps the root loading fix visually consistent and avoids another one-off loading component.

## Risks and mitigations

- Risk: Overprotecting auth routes can break Clerk catch-all routes.
  Mitigation: Keep the existing protected prefix list narrow and add a public-root regression test so `/`, `/sign-in`, and `/sign-up` remain reachable.

- Risk: Redirect loops between middleware, sign-in, and `/auth/continue`.
  Mitigation: Let middleware preserve the original request path in `redirectTo`, then keep the existing sign-in sanitization logic responsible for narrowing unsafe targets.

- Risk: Dashboard page tests become brittle if the access result shape changes again.
  Mitigation: Keep one explicit union type in `dashboard-data.ts` and mock that exact union in `src/app/(app)/dashboard/page.test.tsx`.

- Risk: Playwright cannot fully simulate a real Clerk-configured signed-in flow in the repo’s current local no-Clerk harness.
  Mitigation: Treat Playwright as regression coverage for public-root and redirect behavior, and treat `src/middleware.test.ts` plus `src/modules/dashboard/dashboard-data.test.ts` as the source of truth for Clerk-configured enforcement.

## Validation summary

- Middleware: `src/middleware.test.ts` must prove that Clerk-configured protected routes call `auth.protect()` and that `/` stays public.
- Unit and integration: `src/modules/dashboard/dashboard-data.test.ts`, `src/app/(app)/dashboard/page.test.tsx`, and `src/app/page.test.tsx` must prove the access contract and loading state.
- Playwright: `tests/e2e/welcome-auth.spec.ts` must prove the signed-out welcome surface still owns `/` and that direct `/dashboard` visits no longer bypass auth in the local harness.
- Repo checks: finish with `npm run lint`, `npm test`, `npm run test:e2e`, and `npm run build` from `/home/ewaldt/Documents/VS/GAMES/BudgetBITCH/.worktrees/secure-welcome-window-login`.