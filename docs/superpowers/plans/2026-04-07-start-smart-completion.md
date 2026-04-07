# Start Smart Completion Implementation Plan

> **For agentic workers:** REQUIRED: Use the `subagent-driven-development` agent (recommended) or `executing-plans` agent to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the approved Start Smart design in the current repo by adding real protected workspace bootstrap, removing remaining `demo_workspace` reads, surfacing persisted blueprint data in downstream routes, and making the E2E flow pass under a repeatable auth setup.

**Architecture:** Keep route handlers thin and move auth and workspace bootstrap into small server-side helpers under `src/lib/auth/**` and `src/modules/workspaces/**`. Treat the latest persisted Money Survival Blueprint as the shared source of truth for the dashboard, Learn, and Jobs so Start Smart feeds the rest of the app instead of each route reading hard-coded workspace IDs.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Prisma 7, Clerk, Zod, Vitest, Testing Library, Playwright

---

## File Map

- Create: `src/lib/auth/request-auth.ts` — wraps Clerk auth and provides a deterministic Playwright bypass profile for local E2E runs.
- Create: `src/lib/auth/request-auth.test.ts` — verifies real-auth and bypass-auth request resolution.
- Create: `src/modules/workspaces/personal-workspace.ts` — upserts `UserProfile` and ensures a personal workspace membership exists.
- Create: `src/modules/workspaces/personal-workspace.test.ts` — verifies workspace bootstrap behavior.
- Modify: `src/lib/auth/workspace-access.ts` — resolves an explicit workspace or auto-creates/returns the user’s personal workspace.
- Modify: `src/app/(app)/start-smart/page.tsx` — keeps Start Smart bound to the shared workspace-access helper.
- Modify: `src/app/api/v1/start-smart/blueprint/route.ts` — keeps authorization early and uses the resolved workspace ID.
- Create: `src/modules/start-smart/latest-blueprint.ts` — reads and normalizes the latest persisted blueprint snapshot for a workspace.
- Create: `src/modules/start-smart/latest-blueprint.test.ts` — verifies blueprint extraction and fallback behavior.
- Modify: `src/app/(app)/dashboard/page.tsx` — renders a persisted blueprint summary instead of only static placeholder content.
- Modify: `src/app/(app)/dashboard/page.test.tsx` — verifies persisted and empty-state dashboard rendering.
- Modify: `src/app/(app)/learn/page.tsx` — removes `demo_workspace` and resolves recommendations from the current workspace’s latest blueprint.
- Modify: `src/app/(app)/learn/page.test.tsx` — verifies workspace-aware recommendation rendering.
- Modify: `src/app/(app)/jobs/page.tsx` — removes `demo_workspace` and resolves scored jobs from the current workspace’s latest blueprint.
- Modify: `src/app/(app)/jobs/page.test.tsx` — verifies workspace-aware jobs rendering.
- Modify: `middleware.ts` — restores route protection for app routes and workspace-backed API routes while allowing explicit Playwright bypass mode.
- Modify: `src/middleware.test.ts` — verifies bypass mode and protected-route matcher behavior.
- Modify: `playwright.config.ts` — boots the local dev server with deterministic test-auth environment variables.
- Modify: `tests/e2e/start-smart.spec.ts` — verifies the protected Start Smart journey from landing to persisted blueprint result.
- Modify: `.env.example` — documents the non-secret E2E auth bypass variables.
- Modify: `README.md` — documents protected workspace bootstrap and Start Smart data flow.
- Modify: `docs/CODEBASE_INDEX.md` — documents the new auth/workspace helpers and shared blueprint loader.
- Modify: `docs/DEV_TREE.md` — updates the tree graph for the new auth/workspace helper files.

### Task 1: Bootstrap Authenticated Personal Workspaces

**Files:**
- Create: `src/lib/auth/request-auth.ts`
- Create: `src/lib/auth/request-auth.test.ts`
- Create: `src/modules/workspaces/personal-workspace.ts`
- Create: `src/modules/workspaces/personal-workspace.test.ts`
- Modify: `src/lib/auth/workspace-access.ts`

- [ ] **Step 1: Write the failing auth and workspace bootstrap tests**

```ts
// src/lib/auth/request-auth.test.ts
import { beforeEach, describe, expect, it, vi } from "vitest";

const { authMock, currentUserMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  currentUserMock: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: authMock,
  currentUser: currentUserMock,
}));

import { getRequestAuth } from "./request-auth";

describe("getRequestAuth", () => {
  beforeEach(() => {
    delete process.env.E2E_BYPASS_AUTH;
    delete process.env.E2E_TEST_CLERK_USER_ID;
    delete process.env.E2E_TEST_EMAIL;
    delete process.env.E2E_TEST_NAME;
    authMock.mockReset();
    currentUserMock.mockReset();
  });

  it("returns the explicit Playwright bypass profile when E2E auth bypass is enabled", async () => {
    process.env.E2E_BYPASS_AUTH = "true";
    process.env.E2E_TEST_CLERK_USER_ID = "clerk_e2e_user";
    process.env.E2E_TEST_EMAIL = "start-smart-e2e@example.com";
    process.env.E2E_TEST_NAME = "Start Smart E2E";

    await expect(getRequestAuth()).resolves.toEqual({
      userId: "clerk_e2e_user",
      email: "start-smart-e2e@example.com",
      displayName: "Start Smart E2E",
    });
  });

  it("returns the active Clerk profile when bypass auth is disabled", async () => {
    authMock.mockResolvedValue({ userId: "user_live_123" });
    currentUserMock.mockResolvedValue({
      id: "user_live_123",
      fullName: "Budget Person",
      username: "budget-person",
      primaryEmailAddress: { emailAddress: "budget@example.com" },
    });

    await expect(getRequestAuth()).resolves.toEqual({
      userId: "user_live_123",
      email: "budget@example.com",
      displayName: "Budget Person",
    });
  });
});
```

```ts
// src/modules/workspaces/personal-workspace.test.ts
import { describe, expect, it, vi } from "vitest";
import { ensurePersonalWorkspaceForUser } from "./personal-workspace";

describe("ensurePersonalWorkspaceForUser", () => {
  it("creates a personal workspace when the user has no memberships", async () => {
    const prisma = {
      userProfile: {
        upsert: vi.fn().mockResolvedValue({ id: "profile_123" }),
      },
      workspaceMember: {
        findFirst: vi.fn().mockResolvedValue(null),
      },
      workspace: {
        create: vi.fn().mockResolvedValue({ id: "ws_personal_123" }),
      },
      $transaction: vi.fn(async (callback: (tx: unknown) => Promise<unknown>) => callback(prisma)),
    };

    await expect(
      ensurePersonalWorkspaceForUser(prisma as never, {
        clerkUserId: "user_live_123",
        email: "budget@example.com",
        displayName: "Budget Person",
      }),
    ).resolves.toEqual({
      workspaceId: "ws_personal_123",
      userProfileId: "profile_123",
      createdWorkspace: true,
    });
  });
});
```

- [ ] **Step 2: Run the focused tests to verify they fail**

Run: `npm test -- src/lib/auth/request-auth.test.ts src/modules/workspaces/personal-workspace.test.ts -v`
Expected: FAIL with missing module errors for `request-auth.ts` and `personal-workspace.ts`

- [ ] **Step 3: Implement request-auth and personal workspace bootstrap**

```ts
// src/lib/auth/request-auth.ts
import { auth, currentUser } from "@clerk/nextjs/server";

export type RequestAuth = {
  userId: string | null;
  email: string | null;
  displayName: string | null;
};

export async function getRequestAuth(): Promise<RequestAuth> {
  if (process.env.E2E_BYPASS_AUTH === "true") {
    return {
      userId: process.env.E2E_TEST_CLERK_USER_ID ?? "clerk_e2e_user",
      email: process.env.E2E_TEST_EMAIL ?? "start-smart-e2e@example.com",
      displayName: process.env.E2E_TEST_NAME ?? "Start Smart E2E",
    };
  }

  const { userId } = await auth();

  if (!userId) {
    return { userId: null, email: null, displayName: null };
  }

  const clerkUser = await currentUser();

  return {
    userId,
    email: clerkUser?.primaryEmailAddress?.emailAddress ?? `${userId}@example.invalid`,
    displayName: clerkUser?.fullName ?? clerkUser?.username ?? null,
  };
}
```

```ts
// src/modules/workspaces/personal-workspace.ts
import type { PrismaClient } from "@prisma/client";

type PersonalWorkspaceUser = {
  clerkUserId: string;
  email: string;
  displayName: string | null;
};

export async function ensurePersonalWorkspaceForUser(
  prisma: PrismaClient,
  user: PersonalWorkspaceUser,
) {
  return prisma.$transaction(async (tx) => {
    const userProfile = await tx.userProfile.upsert({
      where: { clerkUserId: user.clerkUserId },
      update: {
        email: user.email,
        displayName: user.displayName,
      },
      create: {
        clerkUserId: user.clerkUserId,
        email: user.email,
        displayName: user.displayName,
      },
    });

    const existingMembership = await tx.workspaceMember.findFirst({
      where: { userId: userProfile.id },
      orderBy: { createdAt: "asc" },
      select: { workspaceId: true },
    });

    if (existingMembership) {
      return {
        workspaceId: existingMembership.workspaceId,
        userProfileId: userProfile.id,
        createdWorkspace: false,
      };
    }

    const workspace = await tx.workspace.create({
      data: {
        name: user.displayName ? `${user.displayName}'s Workspace` : "Personal Workspace",
        type: "personal",
      },
    });

    await tx.workspaceMember.create({
      data: {
        workspaceId: workspace.id,
        userId: userProfile.id,
        role: "owner",
      },
    });

    return {
      workspaceId: workspace.id,
      userProfileId: userProfile.id,
      createdWorkspace: true,
    };
  });
}
```

- [ ] **Step 4: Wire workspace access through the new bootstrap helper**

```ts
// src/lib/auth/workspace-access.ts
import { getPrismaClient } from "@/lib/prisma";
import { ensurePersonalWorkspaceForUser } from "@/modules/workspaces/personal-workspace";
import { getRequestAuth } from "./request-auth";

export async function getCurrentWorkspaceAccess(workspaceId?: string) {
  const requestAuth = await getRequestAuth();

  if (!requestAuth.userId || !requestAuth.email) {
    return {
      allowed: false as const,
      status: 401 as const,
      reason: "unauthenticated" as const,
    };
  }

  const prisma = getPrismaClient();

  if (!workspaceId) {
    const ensured = await ensurePersonalWorkspaceForUser(prisma, {
      clerkUserId: requestAuth.userId,
      email: requestAuth.email,
      displayName: requestAuth.displayName,
    });

    return {
      allowed: true as const,
      workspaceId: ensured.workspaceId,
      userProfileId: ensured.userProfileId,
    };
  }

  const membership = await prisma.workspaceMember.findFirst({
    where: {
      workspaceId,
      user: { clerkUserId: requestAuth.userId },
    },
    select: { workspaceId: true, userId: true },
  });

  if (!membership) {
    return {
      allowed: false as const,
      status: 403 as const,
      reason: "workspace_forbidden" as const,
    };
  }

  return {
    allowed: true as const,
    workspaceId: membership.workspaceId,
    userProfileId: membership.userId,
  };
}
```

- [ ] **Step 5: Re-run the focused tests and commit**

Run: `npm test -- src/lib/auth/request-auth.test.ts src/modules/workspaces/personal-workspace.test.ts src/app/api/v1/start-smart/blueprint/route.test.ts src/app/'(app)'/start-smart/page.test.tsx -v`
Expected: PASS for the new auth/bootstrap tests and the existing Start Smart route/page tests

```bash
git add src/lib/auth/request-auth.ts src/lib/auth/request-auth.test.ts src/modules/workspaces/personal-workspace.ts src/modules/workspaces/personal-workspace.test.ts src/lib/auth/workspace-access.ts src/app/api/v1/start-smart/blueprint/route.ts src/app/(app)/start-smart/page.tsx src/app/api/v1/start-smart/blueprint/route.test.ts src/app/(app)/start-smart/page.test.tsx
git commit -m "feat: bootstrap personal workspace access"
```

### Task 2: Add a Shared Latest-Blueprint Loader and Render It on the Dashboard

**Files:**
- Create: `src/modules/start-smart/latest-blueprint.ts`
- Create: `src/modules/start-smart/latest-blueprint.test.ts`
- Modify: `src/app/(app)/dashboard/page.tsx`
- Modify: `src/app/(app)/dashboard/page.test.tsx`

- [ ] **Step 1: Write the failing tests for latest-blueprint loading and dashboard summary rendering**

```ts
// src/modules/start-smart/latest-blueprint.test.ts
import { describe, expect, it, vi } from "vitest";

const findFirstMock = vi.fn();

vi.mock("@/lib/prisma", () => ({
  getPrismaClient: () => ({
    moneyBlueprintSnapshot: {
      findFirst: findFirstMock,
    },
  }),
}));

import { getLatestBlueprintForWorkspace } from "./latest-blueprint";

describe("getLatestBlueprintForWorkspace", () => {
  it("returns a normalized summary from the latest snapshot", async () => {
    findFirstMock.mockResolvedValue({
      blueprintJson: {
        priorityStack: ["cover_essentials", "stabilize_cash_flow"],
        riskWarnings: ["high_debt_pressure"],
        next7Days: ["List all fixed bills"],
        learnModuleKeys: ["budgeting_basics"],
      },
    });

    await expect(getLatestBlueprintForWorkspace("ws_123")).resolves.toEqual({
      priorityStack: ["cover_essentials", "stabilize_cash_flow"],
      riskWarnings: ["high_debt_pressure"],
      next7Days: ["List all fixed bills"],
      learnModuleKeys: ["budgeting_basics"],
    });
  });
});
```

```tsx
// src/app/(app)/dashboard/page.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/workspace-access", () => ({
  getCurrentWorkspaceAccess: vi.fn().mockResolvedValue({
    allowed: true,
    workspaceId: "ws_123",
    userProfileId: "profile_123",
  }),
}));

vi.mock("@/modules/start-smart/latest-blueprint", () => ({
  getLatestBlueprintForWorkspace: vi.fn().mockResolvedValue({
    priorityStack: ["cover_essentials", "build_emergency_buffer"],
    riskWarnings: ["high_debt_pressure"],
    next7Days: ["List all fixed bills"],
    learnModuleKeys: ["budgeting_basics"],
  }),
}));

import DashboardPage from "./page";

describe("DashboardPage", () => {
  it("renders the latest blueprint summary when a snapshot exists", async () => {
    render(await DashboardPage());

    expect(screen.getByText("List all fixed bills")).toBeInTheDocument();
    expect(screen.getByText("high_debt_pressure")).toBeInTheDocument();
    expect(screen.getByText("build_emergency_buffer")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the focused tests to verify they fail**

Run: `npm test -- src/modules/start-smart/latest-blueprint.test.ts src/app/'(app)'/dashboard/page.test.tsx -v`
Expected: FAIL with missing module errors for `latest-blueprint.ts` and static dashboard rendering assertions

- [ ] **Step 3: Implement the shared latest-blueprint loader**

```ts
// src/modules/start-smart/latest-blueprint.ts
import { getPrismaClient } from "@/lib/prisma";

export type LatestBlueprintSummary = {
  priorityStack: string[];
  riskWarnings: string[];
  next7Days: string[];
  learnModuleKeys: string[];
};

export async function getLatestBlueprintForWorkspace(
  workspaceId: string,
): Promise<LatestBlueprintSummary | null> {
  const prisma = getPrismaClient();
  const latestBlueprint = await prisma.moneyBlueprintSnapshot.findFirst({
    where: { workspaceId },
    orderBy: { createdAt: "desc" },
  });

  const blueprintJson = latestBlueprint?.blueprintJson;

  if (!blueprintJson || typeof blueprintJson !== "object") {
    return null;
  }

  return {
    priorityStack: Array.isArray(blueprintJson.priorityStack) ? blueprintJson.priorityStack : [],
    riskWarnings: Array.isArray(blueprintJson.riskWarnings) ? blueprintJson.riskWarnings : [],
    next7Days: Array.isArray(blueprintJson.next7Days) ? blueprintJson.next7Days : [],
    learnModuleKeys: Array.isArray(blueprintJson.learnModuleKeys)
      ? blueprintJson.learnModuleKeys
      : [],
  };
}
```

- [ ] **Step 4: Make the dashboard page async and render persisted summary data**

```tsx
// src/app/(app)/dashboard/page.tsx
import { getCurrentWorkspaceAccess } from "@/lib/auth/workspace-access";
import { getLatestBlueprintForWorkspace } from "@/modules/start-smart/latest-blueprint";

export default async function DashboardPage() {
  const workspaceAccess = await getCurrentWorkspaceAccess();
  const latestBlueprint = workspaceAccess.allowed
    ? await getLatestBlueprintForWorkspace(workspaceAccess.workspaceId)
    : null;

  const blueprintSummary = latestBlueprint ?? {
    priorityStack: ["cover_essentials"],
    riskWarnings: ["no_blueprint_yet"],
    next7Days: ["Build your first Money Survival Blueprint to populate this board."],
    learnModuleKeys: [],
  };

  return (
    <main className="bb-page-shell text-white">
      <article className="bb-app-warm-panel p-6" data-tone="gold">
        <p className="bb-kicker">Latest blueprint</p>
        <h2 className="mt-3 text-3xl font-semibold">Money Survival Blueprint</h2>
        <ul className="mt-4 grid gap-2 text-sm text-white">
          {blueprintSummary.next7Days.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </article>
    </main>
  );
}
```

- [ ] **Step 5: Re-run the focused tests and commit**

Run: `npm test -- src/modules/start-smart/latest-blueprint.test.ts src/app/'(app)'/dashboard/page.test.tsx -v`
Expected: PASS for the latest-blueprint helper and updated dashboard rendering

```bash
git add src/modules/start-smart/latest-blueprint.ts src/modules/start-smart/latest-blueprint.test.ts src/app/(app)/dashboard/page.tsx src/app/(app)/dashboard/page.test.tsx
git commit -m "feat: surface latest blueprint on dashboard"
```

### Task 3: Remove Remaining Demo Workspace Reads from Learn and Jobs

**Files:**
- Modify: `src/app/(app)/learn/page.tsx`
- Modify: `src/app/(app)/learn/page.test.tsx`
- Modify: `src/app/(app)/jobs/page.tsx`
- Modify: `src/app/(app)/jobs/page.test.tsx`
- Reuse: `src/lib/auth/workspace-access.ts`
- Reuse: `src/modules/start-smart/latest-blueprint.ts`

- [ ] **Step 1: Write the failing page tests for workspace-aware Learn and Jobs rendering**

```tsx
// src/app/(app)/learn/page.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/workspace-access", () => ({
  getCurrentWorkspaceAccess: vi.fn().mockResolvedValue({
    allowed: true,
    workspaceId: "ws_123",
    userProfileId: "profile_123",
  }),
}));

vi.mock("@/modules/start-smart/latest-blueprint", () => ({
  getLatestBlueprintForWorkspace: vi.fn().mockResolvedValue({
    priorityStack: ["cover_essentials", "stabilize_cash_flow"],
    riskWarnings: ["income_volatility_risk"],
    next7Days: ["List all fixed bills"],
    learnModuleKeys: ["budgeting_basics"],
  }),
}));

import LearnPage from "./page";

describe("LearnPage", () => {
  it("renders workspace-derived recommendations instead of a hard-coded demo workspace", async () => {
    render(await LearnPage());

    expect(screen.getAllByText("Budgeting Basics").length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: /review your essentials/i })).toHaveAttribute(
      "href",
      "/learn/budgeting-basics",
    );
  });
});
```

```tsx
// src/app/(app)/jobs/page.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/workspace-access", () => ({
  getCurrentWorkspaceAccess: vi.fn().mockResolvedValue({
    allowed: true,
    workspaceId: "ws_123",
    userProfileId: "profile_123",
  }),
}));

vi.mock("@/modules/start-smart/latest-blueprint", () => ({
  getLatestBlueprintForWorkspace: vi.fn().mockResolvedValue({
    priorityStack: ["cover_essentials", "stabilize_cash_flow"],
    riskWarnings: ["income_volatility_risk"],
    next7Days: ["List all fixed bills"],
    learnModuleKeys: ["budgeting_basics"],
  }),
}));

import JobsPage from "./page";

describe("JobsPage", () => {
  it("renders job lanes from the current workspace blueprint context", async () => {
    render(await JobsPage());

    expect(screen.getByText("Fast cash lane")).toBeInTheDocument();
    expect(screen.getByText("Remote Customer Support Specialist")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the focused page tests to verify they fail**

Run: `npm test -- src/app/'(app)'/learn/page.test.tsx src/app/'(app)'/jobs/page.test.tsx -v`
Expected: FAIL because both pages still read `demo_workspace`

- [ ] **Step 3: Replace the hard-coded workspace reads with shared access + latest blueprint helpers**

```ts
// src/app/(app)/learn/page.tsx
import { getCurrentWorkspaceAccess } from "@/lib/auth/workspace-access";
import { getLatestBlueprintForWorkspace } from "@/modules/start-smart/latest-blueprint";

async function getLearnRecommendations() {
  const workspaceAccess = await getCurrentWorkspaceAccess();

  if (!workspaceAccess.allowed) {
    return resolveLearnRecommendations({
      learnModuleKeys: [],
      priorityStack: ["cover_essentials"],
      riskWarnings: [],
    });
  }

  const latestBlueprint = await getLatestBlueprintForWorkspace(workspaceAccess.workspaceId);

  return resolveLearnRecommendations({
    learnModuleKeys: latestBlueprint?.learnModuleKeys ?? [],
    priorityStack: latestBlueprint?.priorityStack ?? ["cover_essentials"],
    riskWarnings: latestBlueprint?.riskWarnings ?? [],
  });
}
```

```ts
// src/app/(app)/jobs/page.tsx
import { getCurrentWorkspaceAccess } from "@/lib/auth/workspace-access";
import { getLatestBlueprintForWorkspace } from "@/modules/start-smart/latest-blueprint";

async function getRecommendedJobs() {
  const workspaceAccess = await getCurrentWorkspaceAccess();

  if (!workspaceAccess.allowed) {
    return scoreJobsForBlueprint({
      blueprint: {
        priorityStack: ["cover_essentials", "stabilize_cash_flow"],
        riskWarnings: ["income_volatility_risk"],
      },
      jobs: listJobs(),
    });
  }

  const latestBlueprint = await getLatestBlueprintForWorkspace(workspaceAccess.workspaceId);

  return scoreJobsForBlueprint({
    blueprint: {
      priorityStack: latestBlueprint?.priorityStack ?? ["cover_essentials"],
      riskWarnings: latestBlueprint?.riskWarnings ?? [],
    },
    jobs: listJobs(),
  });
}
```

- [ ] **Step 4: Re-run the focused tests and commit**

Run: `npm test -- src/app/'(app)'/learn/page.test.tsx src/app/'(app)'/jobs/page.test.tsx -v`
Expected: PASS for the workspace-aware Learn and Jobs pages

```bash
git add src/app/(app)/learn/page.tsx src/app/(app)/learn/page.test.tsx src/app/(app)/jobs/page.tsx src/app/(app)/jobs/page.test.tsx
git commit -m "refactor: use shared workspace blueprint context"
```

### Task 4: Restore Protected Route Behavior and Stabilize the Playwright Journey

**Files:**
- Modify: `middleware.ts`
- Modify: `src/middleware.test.ts`
- Modify: `playwright.config.ts`
- Modify: `tests/e2e/start-smart.spec.ts`
- Modify: `.env.example`

- [ ] **Step 1: Write the failing middleware and E2E configuration tests**

```ts
// src/middleware.test.ts
import { NextRequest, NextResponse } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { protectMock, clerkMiddlewareMock } = vi.hoisted(() => ({
  protectMock: vi.fn(),
  clerkMiddlewareMock: vi.fn((handler: unknown) => handler),
}));

vi.mock("@clerk/nextjs/server", () => ({
  clerkMiddleware: clerkMiddlewareMock,
  createRouteMatcher: () => () => true,
}));

import middleware from "../middleware";

describe("middleware", () => {
  beforeEach(() => {
    delete process.env.E2E_BYPASS_AUTH;
    protectMock.mockReset();
  });

  it("protects matched routes when auth bypass is disabled", async () => {
    await middleware({ protect: protectMock } as never, new NextRequest("http://localhost/start-smart"));

    expect(protectMock).toHaveBeenCalledTimes(1);
  });

  it("skips Clerk protection when explicit E2E auth bypass is enabled", async () => {
    process.env.E2E_BYPASS_AUTH = "true";
    const response = await middleware({ protect: protectMock } as never, new NextRequest("http://localhost/start-smart"));

    expect(protectMock).not.toHaveBeenCalled();
    expect(response).toBeInstanceOf(NextResponse);
  });
});
```

```ts
// tests/e2e/start-smart.spec.ts
import { expect, test } from "@playwright/test";

test("protected Start Smart journey creates a visible blueprint", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: /enter the magic/i }).click();
  await page.getByRole("link", { name: /start smart/i }).click();

  await expect(page.getByText(/build your survival blueprint in one quick pass/i)).toBeVisible();
  await page.getByText("Young adult").click();
  await page.getByLabel(/country/i).fill("US");
  await page.getByLabel(/state/i).fill("CA");
  await page.getByRole("button", { name: /build my survival blueprint/i }).click();

  await expect(page.getByText("Money Survival Blueprint")).toBeVisible();
  await expect(page.getByText("List all fixed bills")).toBeVisible();
});
```

- [ ] **Step 2: Run the failing middleware and Start Smart E2E tests**

Run: `npm test -- src/middleware.test.ts -v`
Expected: FAIL because middleware still returns `NextResponse.next()` for every route

Run: `npm run test:e2e -- tests/e2e/start-smart.spec.ts`
Expected: FAIL or hang because there is no deterministic auth bypass for Playwright yet

- [ ] **Step 3: Implement route protection with explicit E2E bypass**

```ts
// middleware.ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/learn(.*)",
  "/jobs(.*)",
  "/start-smart(.*)",
  "/settings(.*)",
  "/api/v1/start-smart(.*)",
  "/api/v1/learn(.*)",
  "/api/v1/jobs(.*)",
]);

export default clerkMiddleware(async (auth, request) => {
  if (process.env.E2E_BYPASS_AUTH === "true") {
    return NextResponse.next();
  }

  if (isProtectedRoute(request)) {
    await auth.protect();
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)", "/"],
};
```

- [ ] **Step 4: Boot Playwright with explicit auth-bypass environment variables**

```ts
// playwright.config.ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "on-first-retry",
  },
  webServer: {
    command: "npm run dev",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: !process.env.CI,
    env: {
      ...process.env,
      E2E_BYPASS_AUTH: "true",
      E2E_TEST_CLERK_USER_ID: "clerk_e2e_user",
      E2E_TEST_EMAIL: "start-smart-e2e@example.com",
      E2E_TEST_NAME: "Start Smart E2E",
    },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
```

```dotenv
# .env.example
E2E_BYPASS_AUTH=false
E2E_TEST_CLERK_USER_ID=clerk_e2e_user
E2E_TEST_EMAIL=start-smart-e2e@example.com
E2E_TEST_NAME=Start Smart E2E
```

- [ ] **Step 5: Re-run the focused middleware and E2E tests and commit**

Run: `npm test -- src/middleware.test.ts -v`
Expected: PASS with protected-route and bypass coverage

Run: `npm run test:e2e -- tests/e2e/start-smart.spec.ts`
Expected: PASS for the full protected Start Smart journey under Playwright bypass auth

```bash
git add middleware.ts src/middleware.test.ts playwright.config.ts tests/e2e/start-smart.spec.ts .env.example
git commit -m "test: stabilize protected start smart e2e flow"
```

### Task 5: Update Docs and Run Full Verification

**Files:**
- Modify: `README.md`
- Modify: `docs/CODEBASE_INDEX.md`
- Modify: `docs/DEV_TREE.md`

- [ ] **Step 1: Write the doc updates that explain the completed architecture**

```md
## Protected workspace bootstrap

The app now resolves a current workspace through shared auth helpers in `src/lib/auth/**` and
`src/modules/workspaces/**`. Signed-in users without an existing membership receive a personal
workspace automatically so Start Smart, Dashboard, Learn, and Jobs can all read the same persisted
Money Survival Blueprint context.

## Playwright auth mode

Local Playwright runs use explicit non-secret environment variables (`E2E_BYPASS_AUTH` and the
`E2E_TEST_*` values) so protected routes can be exercised without a live Clerk session.
```

```md
## New navigation anchors

- `src/lib/auth/request-auth.ts` — shared Clerk/test-auth request profile resolver
- `src/modules/workspaces/personal-workspace.ts` — personal workspace bootstrap
- `src/modules/start-smart/latest-blueprint.ts` — latest persisted blueprint reader used by Dashboard, Learn, and Jobs
```

- [ ] **Step 2: Apply the documentation updates**

```md
// docs/CODEBASE_INDEX.md
- **Auth helpers** — `src/lib/auth/request-auth.ts`, `src/lib/auth/workspace-access.ts` — current request auth + workspace resolution
- **Workspace bootstrap** — `src/modules/workspaces/personal-workspace.ts` — ensures a personal workspace exists for authenticated users
- **Blueprint reuse** — `src/modules/start-smart/latest-blueprint.ts` — latest persisted blueprint reader shared by dashboard, Learn, and Jobs
```

```md
// docs/DEV_TREE.md
G --> G1[route-guard + request-auth + workspace-access]
C --> C10[workspaces\npersonal workspace bootstrap]
C --> C11[start-smart\nblueprint engine + latest snapshot reader]
```

- [ ] **Step 3: Run the full verification suite**

Run: `npm run lint`
Expected: PASS

Run: `npm run test`
Expected: PASS

Run: `npm run test:e2e`
Expected: PASS

Run: `npm run db:generate`
Expected: PASS

Run: `npm run build`
Expected: PASS

- [ ] **Step 4: Commit the docs + verification pass**

```bash
git add README.md docs/CODEBASE_INDEX.md docs/DEV_TREE.md
git commit -m "docs: record start smart completion architecture"
```

## Success Checklist

- Start Smart stays protected and resolves a real workspace context.
- Authenticated users without an existing membership get a personal workspace automatically.
- The Start Smart blueprint route persists under the resolved workspace instead of a client-supplied demo ID.
- Dashboard, Learn, and Jobs all read the latest persisted blueprint for the active workspace.
- Playwright can exercise protected routes through the explicit local test-auth bypass.
- Lint, unit tests, E2E tests, Prisma generation, and production build all pass.