# Dashboard Error Logging Hardening Implementation Plan

> **For agentic workers:** REQUIRED: Use the `subagent-driven-development` agent (recommended) or `executing-plans` agent to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve the dashboard's intentional demo fallback while logging unexpected failures with enough context to diagnose production issues.

**Architecture:** Keep the existing early returns for missing Clerk or database configuration, but move all other failures into a single fallback catch that records the error context before returning demo data. Add a focused regression test that proves the fallback still works and that the logged payload preserves the error stack. Do not change the Convex access path or the dashboard data shape.

**Tech Stack:** Next.js App Router, Prisma, Clerk server auth, Vitest, ESLint

---

### Task 1: Harden dashboard fallback logging

**Files:**
- Modify: `src/modules/dashboard/dashboard-data.ts:402-408`
- Test: `src/modules/dashboard/dashboard-data.test.ts:54-69`

- [x] **Step 1: Write the failing test**

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";

it("logs the full unexpected error context before falling back", async () => {
  const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

  isClerkConfiguredMock.mockReturnValue(true);
  authMock.mockResolvedValue({ userId: "user_123" });
  findUniqueMock.mockRejectedValue(new Error("database unavailable"));

  const pageData = await getDashboardPageData("workspace-1");

  expect(pageData.isDemo).toBe(true);
  expect(consoleErrorSpy).toHaveBeenCalledWith("[getDashboardPageData] Unexpected error", {
    message: "database unavailable",
    stack: expect.stringContaining("database unavailable"),
  });

  consoleErrorSpy.mockRestore();
});
```

- [x] **Step 2: Run the test to verify the expected logging shape**

Run: `npx vitest run src/modules/dashboard/dashboard-data.test.ts`
Expected: FAIL until the catch block records `stack`.

- [x] **Step 3: Implement the minimal logging change**

```ts
} catch (error) {
  console.error("[getDashboardPageData] Unexpected error", {
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
  });

  return buildDemoData(requestedWorkspaceId);
}
```

- [x] **Step 4: Run the focused tests again**

Run: `npm test -- src/modules/dashboard/dashboard-data.test.ts src/lib/auth/workspace-access.test.ts`
Expected: PASS.

- [x] **Step 5: Lint the touched files**

Run: `npx eslint src/modules/dashboard/dashboard-data.ts src/modules/dashboard/dashboard-data.test.ts`
Expected: PASS with no warnings.

## Self-review checklist

- The plan covers the exact code review follow-up that was implemented.
- The dashboard fallback remains intact and only the diagnostics improve.
- The test asserts the stack-preserving log payload instead of just `message`.
- No Convex or schema work is introduced without evidence.
