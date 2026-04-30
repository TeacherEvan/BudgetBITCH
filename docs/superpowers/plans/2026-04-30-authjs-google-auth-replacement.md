# Auth.js Google Auth Replacement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Clerk with Auth.js + Google OAuth as the only login method while preserving BudgetBITCH's local bootstrap and protected-route behavior.

**Architecture:** Move identity ownership to Auth.js, keep the existing app-local bootstrap concept, and convert auth entry routes into product-owned Google-only pages. Replace Clerk-based middleware and server helpers with Auth.js session helpers so root gating, `/auth/continue`, and protected routes keep the same product behavior with a new auth backend.

**Tech Stack:** Next.js App Router, Auth.js, Google OAuth, Prisma, Vitest, Playwright

---

## File Structure

- **Create:** `src/auth.ts` — Auth.js root config exporting `handlers`, `auth`, `signIn`, and `signOut`.
- **Create:** `src/app/api/auth/[...nextauth]/route.ts` — App Router route that re-exports Auth.js handlers.
- **Create:** `src/lib/auth/session.ts` — Small session helpers that replace Clerk lookups in server code and middleware.
- **Create:** `src/lib/auth/session.test.ts` — Unit coverage for auth-session helpers.
- **Create:** `src/modules/auth/auth-user.ts` — Resolve verified Google email + display name from the Auth.js session payload.
- **Create:** `src/modules/auth/auth-user.test.ts` — Unit coverage for session-to-local-user mapping.
- **Modify:** `src/middleware.ts` — Replace Clerk checks and `auth.protect()` flow with Auth.js session checks plus safe redirects.
- **Modify:** `src/app/sign-in/[[...sign-in]]/page.tsx` — Product-owned Google-only sign-in page with privacy disclosure.
- **Modify:** `src/app/sign-up/[[...sign-up]]/page.tsx` — Redirect to `/sign-in` so the product exposes one auth path.
- **Modify:** `src/app/(app)/auth/continue/page.tsx` — Bootstrap after Auth.js session instead of Clerk session.
- **Modify:** `src/app/api/v1/auth/bootstrap/route.ts` — Use Auth.js session-derived user data.
- **Modify:** `src/components/auth/auth-entry-panel.tsx` — Remove Clerk-era method copy; support Google-only and privacy messaging.
- **Modify:** `src/modules/auth/bootstrap-user.ts` and `src/modules/auth/bootstrap-user.test.ts` — Keep local bootstrap behavior, but feed it Auth.js identity data.
- **Modify:** `src/lib/auth/route-guard.ts`, `src/lib/auth/workspace-route-guard.ts`, `src/lib/auth/integration-route-guard.ts`, `src/lib/auth/workspace-api-access.ts` — Read Auth.js session identity instead of Clerk identity assumptions.
- **Modify:** existing auth tests under `src/app/sign-in/**`, `src/app/sign-up/**`, `src/app/(app)/auth/continue/**`, and `src/lib/auth/**`.
- **Modify:** `tests/e2e/welcome-auth.spec.ts` and `tests/e2e/smoke.spec.ts` — Keep root gating expectations aligned with the new auth system.

### Task 1: Add Auth.js foundation and session helpers

**Files:**
- Modify: `package.json`
- Create: `src/auth.ts`
- Create: `src/app/api/auth/[...nextauth]/route.ts`
- Create: `src/lib/auth/session.ts`
- Test: `src/lib/auth/session.test.ts`

- [ ] **Step 1: Write the failing unit test for the new session helper**

```ts
import { describe, expect, it } from "vitest";
import { getAuthenticatedUserId, getAuthenticatedUserEmail } from "./session";

describe("session helpers", () => {
  it("reads the app user id and verified email from an Auth.js session", () => {
    const session = {
      user: {
        id: "user_123",
        email: "alex@example.com",
        emailVerified: true,
      },
    };

    expect(getAuthenticatedUserId(session)).toBe("user_123");
    expect(getAuthenticatedUserEmail(session)).toBe("alex@example.com");
  });

  it("returns empty email when the session email is not verified", () => {
    const session = {
      user: {
        id: "user_123",
        email: "alex@example.com",
        emailVerified: false,
      },
    };

    expect(getAuthenticatedUserEmail(session)).toBe("");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- src/lib/auth/session.test.ts`

Expected: FAIL with `Cannot find module './session'` or missing export errors.

- [ ] **Step 3: Add Auth.js and the minimal implementation**

```ts
// src/auth.ts
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      authorization: {
        params: {
          prompt: "select_account",
        },
      },
    }),
  ],
  pages: {
    signIn: "/sign-in",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    jwt({ token, profile }) {
      if (profile?.sub) {
        token.sub = profile.sub;
      }

      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.emailVerified = Boolean(session.user.email);
      }

      return session;
    },
  },
});
```

```ts
// src/app/api/auth/[...nextauth]/route.ts
import { handlers } from "@/auth";

export const { GET, POST } = handlers;
```

```ts
// src/lib/auth/session.ts
type AuthenticatedSession = {
  user?: {
    id?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
  } | null;
} | null;

export function getAuthenticatedUserId(session: AuthenticatedSession) {
  return session?.user?.id?.trim() ?? "";
}

export function getAuthenticatedUserEmail(session: AuthenticatedSession) {
  if (!session?.user?.emailVerified) {
    return "";
  }

  return session.user.email?.trim() ?? "";
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- src/lib/auth/session.test.ts`

Expected: PASS with 2 tests passed.

- [ ] **Step 5: Commit**

```bash
git add package.json src/auth.ts src/app/api/auth/[...nextauth]/route.ts src/lib/auth/session.ts src/lib/auth/session.test.ts
git commit -m "feat: add authjs session foundation"
```

### Task 2: Replace auth entry routes with Google-only product-owned pages

**Files:**
- Modify: `src/app/sign-in/[[...sign-in]]/page.tsx`
- Modify: `src/app/sign-in/[[...sign-in]]/page.test.tsx`
- Modify: `src/app/sign-up/[[...sign-up]]/page.tsx`
- Modify: `src/app/sign-up/[[...sign-up]]/page.test.tsx`
- Modify: `src/components/auth/auth-entry-panel.tsx`

- [ ] **Step 1: Write the failing auth entry tests**

```ts
import { render, screen } from "@testing-library/react";
import SignInPage from "./page";

describe("SignInPage", () => {
  it("shows one Google-only call to action", async () => {
    render(await SignInPage());

    expect(screen.getByRole("button", { name: /continue with google/i })).toBeInTheDocument();
    expect(screen.queryByText(/email and password/i)).not.toBeInTheDocument();
    expect(screen.getByText(/google is only used to sign you in/i)).toBeInTheDocument();
  });
});
```

```ts
import SignUpPage from "./page";

describe("SignUpPage", () => {
  it("redirects sign-up traffic to sign-in", async () => {
    await expect(SignUpPage()).rejects.toMatchObject({
      digest: expect.stringContaining("/sign-in"),
    });
  });
});
```

- [ ] **Step 2: Run the auth entry tests to verify they fail**

Run: `npm test -- src/app/sign-in/[[...sign-in]]/page.test.tsx src/app/sign-up/[[...sign-up]]/page.test.tsx`

Expected: FAIL because the current pages still render Clerk-era copy and behavior.

- [ ] **Step 3: Implement the Google-only auth entry pages**

```tsx
// inside src/app/sign-in/[[...sign-in]]/page.tsx
import { signIn } from "@/auth";

async function startGoogleSignIn() {
  "use server";
  await signIn("google", { redirectTo: forceRedirectUrl });
}

return (
  <AuthEntryPanel
    eyebrow="Sign in"
    title="Open your budget board"
    description="Use Google to sign in, then let BudgetBITCH finish local setup for your workspace."
    authMethodVariant="sign-in"
    footer={<span>Google is only used to sign you in. BudgetBITCH does not read Gmail inbox content.</span>}
  >
    <form action={startGoogleSignIn}>
      <button type="submit" className="bb-button-primary w-full justify-center">
        Continue with Google
      </button>
    </form>
  </AuthEntryPanel>
);
```

```tsx
// inside src/app/sign-up/[[...sign-up]]/page.tsx
import { redirect } from "next/navigation";

export default async function SignUpPage() {
  redirect("/sign-in");
}
```

```tsx
// inside src/components/auth/auth-entry-panel.tsx
<li className="rounded-3xl border border-white/10 bg-black/15 px-4 py-3">
  Google is the only sign-in method for this app.
</li>
<li className="rounded-3xl border border-white/10 bg-black/15 px-4 py-3">
  BudgetBITCH stores only the local account and workspace data it needs to run.
</li>
<li className="rounded-3xl border border-white/10 bg-black/15 px-4 py-3">
  Gmail inbox content is never read as part of sign-in.
</li>
```

- [ ] **Step 4: Run the auth entry tests to verify they pass**

Run: `npm test -- src/app/sign-in/[[...sign-in]]/page.test.tsx src/app/sign-up/[[...sign-up]]/page.test.tsx`

Expected: PASS with Google-only expectations.

- [ ] **Step 5: Commit**

```bash
git add src/app/sign-in/[[...sign-in]]/page.tsx src/app/sign-in/[[...sign-in]]/page.test.tsx src/app/sign-up/[[...sign-up]]/page.tsx src/app/sign-up/[[...sign-up]]/page.test.tsx src/components/auth/auth-entry-panel.tsx
git commit -m "feat: replace clerk entry pages with google auth"
```

### Task 3: Replace Clerk bootstrap and route protection with Auth.js session data

**Files:**
- Create: `src/modules/auth/auth-user.ts`
- Test: `src/modules/auth/auth-user.test.ts`
- Modify: `src/app/(app)/auth/continue/page.tsx`
- Modify: `src/app/(app)/auth/continue/page.test.tsx`
- Modify: `src/app/api/v1/auth/bootstrap/route.ts`
- Modify: `src/modules/auth/bootstrap-user.ts`
- Modify: `src/modules/auth/bootstrap-user.test.ts`
- Modify: `src/middleware.ts`
- Modify: `src/lib/auth/route-guard.ts`
- Modify: `src/lib/auth/workspace-route-guard.ts`
- Modify: `src/lib/auth/integration-route-guard.ts`
- Modify: `src/lib/auth/workspace-api-access.ts`

- [ ] **Step 1: Write failing tests for Auth.js-backed bootstrap**

```ts
import { describe, expect, it } from "vitest";
import { getAuthUserDisplayName, missingAuthUserEmailErrorMessage } from "./auth-user";

describe("auth-user", () => {
  it("prefers a verified session email", () => {
    const session = {
      user: {
        name: "Alex Rivera",
        email: "alex@example.com",
        emailVerified: true,
      },
    };

    expect(getAuthUserDisplayName(session)).toBe("Alex Rivera");
  });

  it("uses the new missing-email message", () => {
    expect(missingAuthUserEmailErrorMessage).toMatch(/verified google-backed email/i);
  });
});
```

- [ ] **Step 2: Run bootstrap-related tests to verify they fail**

Run: `npm test -- src/modules/auth/auth-user.test.ts src/app/(app)/auth/continue/page.test.tsx src/app/api/v1/auth/bootstrap/route.test.ts`

Expected: FAIL because the code still imports Clerk helpers and messages.

- [ ] **Step 3: Implement the Auth.js-backed bootstrap path**

```ts
// src/modules/auth/auth-user.ts
type AuthSessionLike = {
  user?: {
    name?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
  } | null;
} | null;

export const missingAuthUserEmailErrorMessage =
  "BudgetBITCH requires a verified Google-backed email before local setup can finish.";

export function getAuthUserDisplayName(session: AuthSessionLike) {
  return session?.user?.name?.trim() ?? null;
}

export function getAuthUserEmail(session: AuthSessionLike) {
  if (!session?.user?.emailVerified) {
    return "";
  }

  return session.user.email?.trim() ?? "";
}
```

```tsx
// inside src/app/(app)/auth/continue/page.tsx
import { auth } from "@/auth";
import { getAuthUserDisplayName, getAuthUserEmail, missingAuthUserEmailErrorMessage } from "@/modules/auth/auth-user";

const session = await auth();
const authenticatedUserId = getAuthenticatedUserId(session);
const email = getAuthUserEmail(session);

if (!authenticatedUserId) {
  redirect(`/sign-in?redirectTo=${encodeURIComponent(redirectTarget)}`);
}

if (!email) {
  return (
    <AuthEntryPanel
      eyebrow="Continue"
      title="Verified Google email required"
      description={missingAuthUserEmailErrorMessage}
    >
      <p className="bb-mini-copy text-sm">
        Sign in again with Google, then return here to finish local setup.
      </p>
    </AuthEntryPanel>
  );
}
```

```ts
// inside src/middleware.ts
import { auth } from "@/auth";

const session = await auth();

if (!getAuthenticatedUserId(session) && isProtectedPath(pathname)) {
  const signInUrl = new URL("/sign-in", request.url);
  signInUrl.searchParams.set("redirectTo", getRedirectTarget(request));
  return NextResponse.redirect(signInUrl);
}
```

- [ ] **Step 4: Run the focused bootstrap and guard tests to verify they pass**

Run: `npm test -- src/modules/auth/auth-user.test.ts src/app/(app)/auth/continue/page.test.tsx src/app/api/v1/auth/bootstrap/route.test.ts src/lib/auth/route-guard.test.ts src/lib/auth/workspace-route-guard.test.ts src/lib/auth/integration-route-guard.test.ts src/lib/auth/workspace-api-access.test.ts`

Expected: PASS with Auth.js-backed session behavior.

- [ ] **Step 5: Commit**

```bash
git add src/modules/auth/auth-user.ts src/modules/auth/auth-user.test.ts src/app/(app)/auth/continue/page.tsx src/app/(app)/auth/continue/page.test.tsx src/app/api/v1/auth/bootstrap/route.ts src/middleware.ts src/lib/auth/route-guard.ts src/lib/auth/workspace-route-guard.ts src/lib/auth/integration-route-guard.ts src/lib/auth/workspace-api-access.ts
git commit -m "feat: move bootstrap and guards to authjs"
```

### Task 4: Remove Clerk leftovers and restore end-to-end confidence

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `src/app/layout.test.tsx`
- Modify: `tests/e2e/welcome-auth.spec.ts`
- Modify: `tests/e2e/smoke.spec.ts`
- Modify: any remaining Clerk references under `src/**`

- [ ] **Step 1: Write the failing regression checks**

```ts
import { render, screen } from "@testing-library/react";
import Layout from "./layout";

it("does not require Clerk provider wiring", async () => {
  render(await Layout({ children: <div>child</div> }));
  expect(screen.getByText("child")).toBeInTheDocument();
});
```

```ts
test("signed-out visitors still reach the app-owned sign-in page", async ({ page }) => {
  await page.goto("/dashboard?workspaceId=workspace-2");
  await expect(page).toHaveURL(/\/sign-in\?redirectTo=/);
  await expect(page.getByRole("button", { name: /continue with google/i })).toBeVisible();
});
```

- [ ] **Step 2: Run layout and E2E coverage to verify it fails before cleanup**

Run: `npm test -- src/app/layout.test.tsx && npm run test:e2e -- tests/e2e/welcome-auth.spec.ts tests/e2e/smoke.spec.ts`

Expected: FAIL until Clerk providers, env assumptions, and E2E expectations are removed.

- [ ] **Step 3: Remove remaining Clerk assumptions**

```tsx
// example layout direction
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

```ts
// search target after cleanup
// rg "clerk|Clerk" src tests
```

- [ ] **Step 4: Run full validation**

Run:

```bash
npm run lint
npm test
npm run test:e2e -- tests/e2e/welcome-auth.spec.ts tests/e2e/smoke.spec.ts
npm run build
```

Expected:

- `eslint` exits 0
- `vitest` exits 0
- targeted Playwright auth/root flows pass
- `next build` exits 0

- [ ] **Step 5: Commit**

```bash
git add src/app/layout.tsx src/app/layout.test.tsx tests/e2e/welcome-auth.spec.ts tests/e2e/smoke.spec.ts
git commit -m "refactor: remove clerk from root auth flow"
```
